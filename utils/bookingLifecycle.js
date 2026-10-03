/**
 * Booking Lifecycle Management Utility
 *
 * Lifecycle flow:
 * PENDING
 *   ├── Owner rejects ────→ REJECTED (terminal)
 *   └── Owner approves
 *         ├── Start date is future ────→ CONFIRMED
 *         │                                  │
 *         │                                  │ Start date arrives
 *         │                                  ▼
 *         └───────────────────────────→ ONGOING
 *                                            │
 *                                            │ End date passes
 *                                            ▼
 *                                        COMPLETED (terminal)
 *
 * Cancellation (Customer before start date):
 * PENDING / CONFIRMED ────→ CANCELLED (terminal)
 */

const Booking = require('../models/Booking');

/**
 * Checks if a date has arrived (today or past).
 */
const hasStarted = (startDate, now = new Date()) => {
    const start = new Date(startDate);
    if (now >= start) return true;

    // Check calendar date (local and UTC)
    const toYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const toUtcYMD = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

    return toYMD(now) >= toYMD(start) || toUtcYMD(now) >= toUtcYMD(start);
};

/**
 * Checks if a rental end date has passed.
 */
const hasEnded = (endDate, now = new Date()) => {
    const end = new Date(endDate);

    const isMidnight = (
        (end.getUTCHours() === 0 && end.getUTCMinutes() === 0 && end.getUTCSeconds() === 0) ||
        (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0)
    );

    // If date has a specific non-midnight time
    if (!isMidnight) {
        return now > end;
    }

    // If date-only (midnight), rental covers the whole calendar day
    const toYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const toUtcYMD = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

    return toYMD(now) > toYMD(end) && toUtcYMD(now) > toUtcYMD(end);
};

/**
 * Determines what the booking status should be right now.
 * Pure function - does not mutate or save to database.
 */
const getBookingLifecycleStatus = (booking, now = new Date()) => {
    if (!booking || !booking.status) {
        return 'pending';
    }

    const current = booking.status.toLowerCase();

    // Terminal statuses never transition automatically
    if (current === 'cancelled') return 'cancelled';
    if (current === 'rejected') return 'rejected';
    if (current === 'completed') return 'completed';
    if (current === 'expired') return 'expired';

    // Pending bookings:
    // If the requested rental period has already completely passed without owner approval:
    // => EXPIRED (rental never actually happened)
    if (current === 'pending') {
        if (hasEnded(booking.endDate, now)) {
            return 'expired';
        }
        return 'pending';
    }

    // Booking was approved in time (was confirmed or ongoing):
    // If the rental end has passed:
    // => COMPLETED (actual rental that happened and finished)
    if (hasEnded(booking.endDate, now)) {
        return 'completed';
    }

    // If start has arrived:
    // => ONGOING
    if (hasStarted(booking.startDate, now)) {
        return 'ongoing';
    }

    // Otherwise, still upcoming:
    // => CONFIRMED
    return 'confirmed';
};

/**
 * Synchronizes a single booking's status in MongoDB if needed.
 */
const syncBookingStatus = async (booking, now = new Date()) => {
    if (!booking) return booking;

    const expected = getBookingLifecycleStatus(booking, now);
    if (booking.status !== expected) {
        booking.status = expected;
        if (typeof booking.save === 'function') {
            await booking.save();
        }
    }
    return booking;
};

/**
 * Synchronizes an array of bookings and updates changed documents in MongoDB.
 */
const syncBookings = async (bookings, now = new Date()) => {
    if (!Array.isArray(bookings) || bookings.length === 0) {
        return bookings || [];
    }

    const updates = [];
    for (const b of bookings) {
        const expected = getBookingLifecycleStatus(b, now);
        if (b.status !== expected) {
            b.status = expected;
            if (typeof b.save === 'function') {
                updates.push(b.save());
            } else if (b._id) {
                updates.push(Booking.updateOne({ _id: b._id }, { $set: { status: expected } }));
            }
        }
    }

    if (updates.length > 0) {
        await Promise.all(updates);
    }

    return bookings;
};

/**
 * Background sync for all active bookings (pending, confirmed, ongoing).
 * - Pending whose end date passed => expired
 * - Confirmed whose start date arrived => ongoing
 * - Confirmed/Ongoing whose end date passed => completed
 */
const syncAllActiveBookings = async (now = new Date()) => {
    try {
        const activeBookings = await Booking.find({
            status: { $in: ['pending', 'confirmed', 'ongoing'] }
        });

        if (activeBookings.length === 0) return 0;

        let count = 0;
        const updates = [];

        for (const b of activeBookings) {
            const expected = getBookingLifecycleStatus(b, now);
            if (b.status !== expected) {
                b.status = expected;
                updates.push(b.save());
                count++;
            }
        }

        if (updates.length > 0) {
            await Promise.all(updates);
        }

        return count;
    } catch (err) {
        console.error('Error syncing active bookings:', err);
        return 0;
    }
};

module.exports = {
    hasStarted,
    hasEnded,
    getBookingLifecycleStatus,
    syncBookingStatus,
    syncBookings,
    syncAllActiveBookings
};

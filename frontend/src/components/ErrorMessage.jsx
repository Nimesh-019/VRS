import React from 'react';

export const ErrorMessage = ({ message }) => {
    if (!message) return null;

    return (
        <div className="alert-error">
            <span>⚠️</span>
            <span>{message}</span>
        </div>
    );
};

export default ErrorMessage;

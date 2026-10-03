const path = require('path');

const rootDir = (require.main && require.main.filename) 
    ? path.dirname(require.main.filename) 
    : path.resolve(__dirname, '..');

module.exports = rootDir;
if (typeof window == "undefined") {
    throw new Error("safe-jsonp requires a browser environment");
}

module.exports = require('./dist/safe-jsonp.umd.js');
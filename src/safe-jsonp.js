import {
    global,
    generateUniquePropName,
    testValueType,
    validateObject,
    encodeParams,
    parseParams,
    randomStr,
    once
} from "./lib/utils";

import {parseURL} from "./lib/browser";

import _fetch from "./lib/fetch";

import Sandbox from "./lib/sandbox";

const registerKey = generateUniquePropName(global, (i) => "_jsonp" + randomStr(3 + i / 10)),
    internalRegister = {},
    register = Object.create(internalRegister);

Object.defineProperty(global, registerKey, {
    get: () => register,
    set: () => {
        throw Error(`cannot rewrite JSONP callback register in window.${registerKey}`);
    }
});

/**
 * Makes JSONP request
 * @param {String} url
 * @param {Object} [options]
 * @param {Boolean} [options.sandbox]
 * @param {Object} [options.params]
 * @param {Object} [options.abortable]
 * @param {Number} [options.timeout]
 * @param {String} [options.cbParam]
 * @returns {JSONP|Promise}
 */

export default function JSONP(url, options, callback) {
    return (function (url, options = {}, callback) {

        let {
            sandbox,
            idleTimeout = 60000,
            timeout,
            preventCache,
            cbParam,
            abortable,
            params
        } = options;
        const instance = this,
            request = (callback) => {
                try {
                    const u = "undefined", b = "boolean";
                    testValueType("url", url, ["string"]);
                    testValueType("options", options, ["object"]);
                    validateObject(options, {
                        sandbox: [b, u],
                        params: ["object", u],
                        timeout: ["number", u],
                        abortable: [b, u],
                        preventCache: [b, u],
                        cbParam: ["string", u],
                    });
                } catch (e) {
                    callback(e);
                    return;
                }

                let {
                    origin,
                    pathname,
                    search
                } = parseURL(url);
                let urlParams = parseParams(search.slice(1)),
                    abortFn;

                const computedParams = Object.assign(urlParams, params || null),
                    _url = origin + pathname,
                    done = once((err, data) => callback(err && typeof err !== "object" ? Error(err) : err, data)),
                    fetch = () => _fetch(_url, {
                        timeout,
                        preventCache,
                        params: computedParams,
                        cbParam,
                        registerKey,
                        register
                    }, done);

                if (sandbox !== false) {
                    Sandbox.whenTested((result) => {
                        if (result) {
                            abortFn = Sandbox.query(
                                {
                                    data: {
                                        url: _url,
                                        options: {
                                            params: computedParams,
                                            timeout,
                                            cbParam,
                                            preventCache
                                        },
                                    },
                                    timeout,
                                },
                                {
                                    idleTimeout,
                                    mode: result
                                },
                                (err, response) =>
                                    err ? done(err, response) : done(response.err, response.data)
                            )

                        } else {
                            if (sandbox === true) {
                                done("sandbox is not supported")
                            } else {
                                abortFn = fetch();
                            }
                        }
                    })
                } else {
                    abortFn = fetch();
                }
                instance.abort = abortFn;
                abortable && (options.abort = abortFn);
                return instance;
            };

        if (callback) {
            testValueType("callback", callback, ["function", "undefined"]);
            return request(callback);
        } else {
            const _Promise = options && options.Promise || (typeof Promise !== "undefined" ? Promise : null);
            if (!_Promise) {
                throw Error("Unable to use Promise class");
            }

            return new _Promise((resolve, reject) => {
                request((err, data) => err ? reject(err) : resolve(data))
            })
        }

    }).apply(this instanceof JSONP ? this : Object.create(JSONP.prototype), typeof options === "function" ?
        [url, undefined, options] : [url, options, callback]);
}

Object.assign(JSONP, {
    parseParams,
    encodeParams,
    parseURL
});
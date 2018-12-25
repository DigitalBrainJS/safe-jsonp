import {
    global,
    generateUniquePropName,
    testValueType,
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

export default function JSONP(url, options, callback) {

    const globalPromise = typeof Promise !== "undefined" ? Promise : null;

    return (function (url, options = {}, callback) {
        testValueType("url", url, ["string"]);
        testValueType("options", options, ["object"]);
        testValueType("callback", callback, ["function", "undefined"]);

        testValueType("options.sandbox", options.sandbox, ["boolean", "undefined"]);
        testValueType("options.params", options.params, ["object", "undefined"]);
        testValueType("options.timeout", options.timeout, ["number", "undefined"]);
        testValueType("options.cbParam", options.cbParam, ["string", "undefined"]);

        let {
            sandbox,
            idleTimeout = 5000,
            timeout,
            preventCache,
            cbParam,
            abortable,
            Promise: _Promise = globalPromise,
            params
        } = options;

        const instance = this,
            request = (callback) => {
                let {origin, pathname, search} = parseURL(url),
                    urlParams = parseParams(search.slice(1)),
                    abortFn;

                const computedParams = Object.assign(urlParams, params || null),
                    _url = origin + pathname,
                    done = once((err, data) => callback(err && typeof err !== "object" ? Error(err) : err, data)),
                    fetch = () => abortFn = _fetch(_url, {
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
                                fetch();
                            }
                        }
                    })
                } else {
                    fetch();
                }
                instance.abort = abortFn;
                abortable && (options.abort = abortFn);
                return instance;
            };

        return callback ? request(callback) : new _Promise((resolve, reject) => {
            request((err, data) => err ? reject(err) : resolve(data))
        })

    }).apply(this instanceof JSONP ? this : Object.create(JSONP.prototype), typeof options === "function" ?
        [url, undefined, options] : [url, options, callback]);
}

Object.assign(JSONP, {
    parseParams,
    encodeParams,
    parseURL
});
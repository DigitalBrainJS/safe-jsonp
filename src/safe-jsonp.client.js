
import {
    global,
    generateUniquePropName,
    testValueType,
    encodeParams,
    parseParams,
    randomStr
} from "./lib/utils";

import {parseURL} from './lib/browser';

import _fetch from './lib/fetch';

import Sandbox from './lib/sandbox';

const registerKey= generateUniquePropName(global, (i)=>'_jsonp' +randomStr(3 + i/10)),
    internalRegister= {},
    register= Object.create(internalRegister);

Object.defineProperty(global, registerKey, {
    get: ()=> register,
    set: ()=>{
        throw Error(`cannot rewrite JSONP callback register in window.${registerKey}`);
    }
});

export default function JSONP(url, options, callback){
    const globalPromise = Promise;

    return (function (url, options = {}, callback) {
        testValueType('url', url, ['string']);
        testValueType('options', options, ['object']);
        testValueType('callback', callback, ['function', 'undefined']);

        testValueType('options.sandbox', options.sandbox, ['boolean', 'undefined']);
        testValueType('options.params', options.params, ['object', 'undefined']);
        testValueType('options.timeout', options.timeout, ['number', 'undefined']);
        testValueType('options.cbParam', options.cbParam, ['string', 'undefined']);

        let {
            sandbox,
            idleTimeout,
            timeout,
            preventCache,
            cbParam,
            abortable,
            Promise = globalPromise,
            params
        } = options;

        const instance = this,
            request = (callback) => {
                let {origin, pathname, search} = parseURL(url),
                    urlParams = parseParams(search.slice(1));

                const computedParams = Object.assign(urlParams, params || null),
                    _url = origin + pathname,
                    wrappedCallback = (err, data) => callback(err && typeof err !== 'object' ? Error(err) : err, data);

                if (sandbox && !Sandbox.isSupported) {
                    if (sandbox === true) return wrappedCallback("sandbox is not supported");
                    sandbox = false;
                }

                const abortQuery = sandbox ?
                    Sandbox.query({
                        url: _url,
                        options: {
                            params: computedParams,
                            timeout,
                            cbParam,
                            idleTimeout,
                            preventCache
                        }
                    }, (err, response) => err ? wrappedCallback("sandbox error") : wrappedCallback(response.err, response.data))

                    : _fetch(_url, {
                        timeout,
                        preventCache,
                        params: computedParams,
                        cbParam,
                        registerKey,
                        register
                    }, wrappedCallback);

                instance.abort = abortQuery;

                abortable && (options.abort = abortQuery);

                return instance;
            };

        return callback ? request(callback) : new Promise((resolve, reject) => {
            request((err, data) => err ? reject(err) : resolve(data))
        })

    }).apply(this instanceof JSONP ? this : Object.create(JSONP.prototype), typeof options === 'function' ?
        [url, undefined, options] : [url, options, callback]);
}

Object.assign(JSONP, {
    parseParams,
    encodeParams,
    parseURL,
});
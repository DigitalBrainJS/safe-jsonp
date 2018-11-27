
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

const hostNode = document.head;


const registerKey= generateUniquePropName(global, (i)=>'_jsonp' +randomStr(3 + i/10));

const internalRegister= {},
    register= Object.create(internalRegister);

Object.defineProperty(global, registerKey, {
    get: ()=> register,
    set: ()=>{
        throw Error(`cannot rewrite JSONP callback register in window.${registerKey}`);
    }
});



console.log('registerKey',  registerKey);




export default function JSONP(url, options, callback){
    const request= (url, options, callback)=> {

        testValueType('url', url, ['string'], callback);
        testValueType('options', options, ['object', 'undefined'], callback);
        testValueType('callback', callback, ['function']);

        let {
            sandbox,
            timeout,
            preventCache,
            callbackKey,
            params
        } = options || {};

        let {origin, pathname, search}= parseURL(url),
            urlParams= parseParams(search.slice(1));

        const computedParams= Object.assign(urlParams, params || null),
            _url= origin + pathname;


        if(sandbox){
            Sandbox.query({
                url: _url,
                options: {
                    params: computedParams,
                    timeout
                }
            }, (err, response)=> err ? callback("sandbox error") : callback(response.err, response.data))

        }else{
            return _fetch(_url, {
                timeout,
                preventCache,
                params: computedParams,
                callbackKey,
                registerKey,
                register
            }, callback);
        }
    };

    return ((url, options, callback) => callback ? request(url, options, callback) : new Promise((resolve, reject) => {
                request(url, options, (err, data) => err ? reject(err) : resolve(data))
            })
    ).apply(this, typeof options == 'function' ? [url, null, options] : [url, options, callback]);

}

Object.assign(JSONP, {
    parseParams,
    encodeParams,
    parseURL,
});
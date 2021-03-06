# safe-jsonp 
[![Build Status](https://travis-ci.org/DigitalBrainJS/safe-jsonp.svg?branch=master)](https://travis-ci.org/DigitalBrainJS/safe-jsonp)
[![](https://badgen.net/bundlephobia/min/safe-jsonp)](https://unpkg.com/safe-jsonp/dist/safe-jsonp.umd.js)
[![](https://badgen.net/bundlephobia/minzip/safe-jsonp)](https://unpkg.com/safe-jsonp/dist/safe-jsonp.umd.js)
[![](https://badgen.net/npm/license/safe-jsonp)](https://unpkg.com/safe-jsonp/dist/safe-jsonp.umd.js)


:star: A safer JSONP implementation for browsers with extra features :star:

# Features
- :zap: **safer requests to untrusted origins using optional sandbox mechanism\* (iframes & postMessage used inside)**
- :zap: **can abort the related http requests\** (other libs just ignore the response, but related http query keeps in pending state for some time**
- :heavy_check_mark: no dependencies
- :heavy_check_mark: CDN friendly
- supports Promise and callback styles
- supports custom Promise class
- supports query params in url string and/or options.params property
- automatically encoding params, converting objects and arrays params to JSON strings  
- anti-caching `_rnd` query param

\* this feature works only in modern browsers (except all IE).

\** not available in IE, Edge has partial support. 
## Try It!
[JSFiddle.net demo](https://jsfiddle.net/DigitalBrain/ugz5qn0r/)

## Installation

Install for node.js or browserify using npm or yarn:

``` bash
$ npm install safe-jsonp --save
```

``` bash
$ yarn add safe-jsonp
```

## Basic usage example
Promise style:
```javascript
import JSONP from "safe-jsonp";

JSONP('http://api.github.com/users/DigitalBrainJS')
    .then( data => console.log('JSONP data object:', data))
    .catch( err => console.warn('Oops...we got an error', err.message))

//or inside an async function 
const response= await JSONP('http://api.github.com/users/DigitalBrainJS');
console.log(response);
```


Callback style:
```javascript
import JSONP from "safe-jsonp";

JSONP('http://api.github.com/users/DigitalBrainJS', (err, data) => {
        if(err){
            console.warn('Oops...we got an error', err.message)
        }else{
            console.log('JSON data:', data)
        }    
    })
```

## CDN
Use unpkg.com cdn to get the link to the script/module from the package:
- minified (production) UMD ES5 version (~7kB)
```html
<script src="https://unpkg.com/safe-jsonp"></script>
```
- ESM ES2015 module(~14kB)
```javascript
import JSONP from "https://unpkg.com/safe-jsonp/dist/safe-jsonp.esm.js"
//or minified version
import JSONP from "https://unpkg.com/safe-jsonp/dist/safe-jsonp.esm.min.js"
```

## More examples
##### additional options:
```javascript
const Promise = require("bluebird");

//...async function

const data= await JSONP('http://api.github.com/users/DigitalBrainJS?name=bla&age=23', {
    params: {
        foo: 1,
        bar: [1,2,3] // We can pass objects and arrays as a param value
    },
    
    timeout: 60000, //60 seconds
    preventCache: true,//add _rnd query param with random value
    cbParam: 'callback',
    Promise //custom Promise class
})

//will make a request like https://api.github.com/users/DigitalBrainJS?name=bla&age=23&foo=1&bar=%5B1%2C2%2C3%5D&callback=_jsonpvqz.cb0
//callback param is randomly generated to avoid collisions
```   


##### Force sandbox mode:
```javascript
JSONP('http://api.github.com/users/DigitalBrainJS', {sandbox: true})
    .then(data=>console.log(data), err=>console.warn(err))
    //will fail if the current browser doesn't support sandbox mode or data/blob uri for iframe
```

##### Aborting the request:
```javascript
const jsonp= JSONP('http://api.github.com/users/DigitalBrainJS', (err, data) => {
        console.log(err) //Error: aborted  
    });
    
jsonp.abort();
```
Or when using Promise:
```javascript
const sharedOptions= {abortable: true};
//new method "abort" will be attached to this object

JSONP('http://api.github.com/users/DigitalBrainJS', sharedOptions)
    .then(data=>console.log(data), err=>console.warn(err));
    
sharedOptions.abort();
```

## API

### JSONP(url: String, [options: Object]): \<Promise>
### JSONP(url: String, [options: Object], cb: Function): \<JSONP>

  - `url: String` url to fetch
  - `[options: Object]`
      - `sandbox: Boolean|Undefined= undefined` sets sandbox mode for query handling to untrusted origins. 
      Default `undefined` value means prefer sandboxed mode, but allow non-sandboxed query if the environment doesn't 
      support it. In sandboxed mode all requests will be done in invisible iframe proxy, created temporally for each 
      origin 
      - `idleTimeout: Number= 60000` idle timeout for each sandbox in ms
      - `params: Object` Object with query params to combine with a URL string
      - `timeout: Number= 15000` max query pending time in ms. Default: `15000` (15 seconds)
      - `preventCache: Boolean= true` force disable cache by adding timestamp to a query param `_rnd`
      - `cbParam: String= 'callback'` name of the query param used by backend to get the name of the JSONP callback
      - `Promise: Function` Promise class that be used instead of native (if environment supports it)  
      - `abortable: Boolean` enables ability to abort for Promise mode. If this option is set to true, 
      an additional property called abort will be created in options object. 
      This allows to get the abort function via shared options object. 
      Additionally if sandbox mode is set (and it supported by a browser) this mode allows to abort the related http request of internal script element. 
- `[cb: Function(err: ?Error, [data: Object])]` callback function, called when jsonp request completes
(with success or error). 
If this argument is omitted, the function returns a Promise, otherwise, a JSONP instance will be returned.

Returns a promise or JSON instance depending on the presence of a callback argument

### JSONP class instance
*instance methods:*
  - `abort()` aborts the jsonp query with `Error: aborted`, handled by a callback or Promise chain.

*static methods:*
  - `parseURL(url: String): URL|Object` parse URL into components
  - `parseParams(paramsStr: String): Object` parse URL params string eg. `a=1&b=2` to params object `{a:1, b:2}`
  - `encodeParams(params: Object): String` encode params object to string
## Functional diagram
Sandbox mode: 

![Sandbox functional diagram](https://github.com/DigitalBrainJS/safe-jsonp/raw/master/public/safe-jsonp.png)  
## Contribution
 Feel free to fork, open issues, enhance or create pull requests. 
## License

The MIT License (MIT)

Copyright (c) 2018 Dmitriy Mozgovoy <robotshara@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

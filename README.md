[![browser support](https://ci.testling.com/DigitalBrainJS/safe-jsonp.png)
](https://ci.testling.com/DigitalBrainJS/safe-jsonp)

# safe-jsonp

A sandboxed JSONP implementation for the browser.

# Features
- optional sandbox mechanism for safer requests to untrusted origins (internally used iframes)
- support Promise and callback style
- support custom Promise class
- anti-caching `_rnd` query param

## Functional diagram
Sandbox mode: 

![Sandbox functional diagram](https://github.com/DigitalBrainJS/safe-jsonp/raw/master/public/safe-jsonp.png)

## Try It!
[Demo page for test](http://htmlpreview.github.io/?https://github.com/DigitalBrainJS/safe-jsonp/blob/master/public/index.html)

## Installation

Install for node.js or browserify using `npm`:

``` bash
$ npm install safe-jsonp --save
```

## Direct usage in the browser
Use unpkg.com cdn to get link to script/module from the package:
- unminified UMD ES5 version (~15kB)
```html
<script src="https://unpkg.com/safe-jsonp"></script>
```
- minified UMD ES5 version (~7kB)
```html
<script src="https://unpkg.com/safe-jsonp/dist/safe-jsonp.umd.min.js"></script>
```
- unminified ESM ES2015 module (~14kB)
```html
<script src="https://unpkg.com/safe-jsonp/dist/safe-jsonp.esm.js"></script>
```
- minified ESM ES2015 module (~7kB)
```html
<script src="https://unpkg.com/safe-jsonp/dist/safe-jsonp.esm.min.js"></script>
```


## API

### JSONP(url: String, [options: Object]): \<Promise>
### JSONP(url: String, [options: Object], fn: Function): \<JSONP>

  - `url: String` url to fetch
  - `[options: Object]` [optional]
      - `sandbox: Boolean|Undefined= undefined` sets sandbox mode for query handling to untrusted origins. 
      Default `undefined` value means prefer sandboxed mode, but allow non-sandboxed query if environment doesn't support it.
      In sandboxed mode **all** requests will be done in invisible iframe proxy, created temporally for each origin 
      - `idleTimeout: Number= 15000` idle timeout for each sandbox in ms
      - `params: Object` Object with query params to combine with url string
      - `timeout: Number= 15000` max query pending time in ms. Default: `15000` (15 seconds)
      - `preventCache: Boolean= true` force disable cache by adding timestamp to a query param `_rnd`
      - `cbParam: String= 'callback'` name of query param used by backend to get the name of the JSONP callback
      - `Promise: function` Promise class that be used instead of native (if environment supports it)  
      - `abortable: Boolean` enables ability to abort for Promise mode. If this option is set to true, 
      an additional property called abort will be created in options object. 
      This allows to get the abort function via shared options object.  
- `[fn: Function(err: ?Error, [data: Object])= underfined]` callback function, called when jsonp query is complete 
(with success or error)

Returns a promise or JSON instance depending on the presence of a callback argument

### JSONP class instance
*instance methods:*
  - `abort()` aborts the jsonp query with `Error: aborted`, handled by callback or Promise chain.

*static methods:*
  - `parseURL(url: String): URL|Object` parse URL into components
  - `parseParams(url: String): Object` parse URL params string eg. `a=1&b=2` to params object `{a:1, b:2}`
  - `encodeParams(params: Object): String` encode params object to string
  
## Usage example
Promise style:
```javascript
JSONP('http://api.github.com/users/DigitalBrainJS')
    .then( data => console.log('JSONP data object:', data), err => console.warn('Oops...we got an error', err.message))
```

```javascript
//in async function
const data= await JSONP('http://api.github.com/users/DigitalBrainJS')
```   

Callback style:
```javascript
JSONP('http://api.github.com/users/DigitalBrainJS', (err, data) => {
        if(err){
            console.warn('Oops...we got an error', err.message)
        }else{
            console.log('JSON data:', data)
        }    
    })
```

Accept sandbox mode only
```javascript
JSONP('http://api.github.com/users/DigitalBrainJS', {sandbox: true})
    .then(data=>console.log(data), err=>console.warn(err))

```

Aborting the request:
```javascript
const jsonp= JSONP('http://api.github.com/users/DigitalBrainJS', (err, data) => {
        console.log(err) //Error: aborted  
    });
    
jsonp.abort();
```
Or
```javascript
const sharedOptions= {abortable: true};

JSONP('http://api.github.com/users/DigitalBrainJS', sharedOptions)
    .then(data=>console.log(data), err=>console.warn(err));
    
sharedOptions.abort();
```

## License

The MIT License (MIT)

Copyright (c) 2018 Dmitriy Mozgovoy

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
[![browser support](https://ci.testling.com/DigitalBrainJS/safe-jsonp.png)
](https://ci.testling.com/DigitalBrainJS/safe-jsonp)

# safe-jsonp

A sandboxed JSONP implementation for browser.

## Installation

Install for node.js or browserify using `npm`:

``` bash
$ npm install safe-jsonp --save
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
  
## Functional diagram
Sandbox mode: 
![Image alt](https://github.com/DigitalBrainJS/safe-jsonp/raw/develop/public/safe-jsonp.png)

## Usage example
Promise style:
```
JSONP('http://www.mocky.io/v2/5c06d5893000007300d258da')
    .then( data => console('JSONP data object:', data), err => console.warn('Oops...we got an error', err.message))
```
Callback style:
```
JSONP('http://www.mocky.io/v2/5c06d5893000007300d258da',
    (err, data) => {
        if(err){
            console.warn('Oops...we got an error', err.message)
        }else{
            err => console.warn('Oops...we got an error', err.message)
        }    
    })
```

Accept sandbox mode only
```
JSONP('http://www.mocky.io/v2/5c06d5893000007300d258da', {sandbox: true})
    .then(data=>console.log, err=>console.warn)

```

aborting the request:
```
const jsonp= JSONP('http://www.mocky.io/v2/5c06d5893000007300d258da',
    (err, data) => {
        console.log(err) //Error: aborted  
    })
    
    jsonp.abort();
```
Or
```
const sharedOptions= {abortable: true};

JSONP('http://www.mocky.io/v2/5c06d5893000007300d258da', sharedOptions)
    .then(data=>console.log, err=>console.warn)
    
    sharedOptions.abort();
```

## License

Copyright (c) 2018 Dmitriy Mozgovoy
robotshara@gmail.com
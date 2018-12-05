const http = require('http');
const querystring = require('querystring');
const port = 8000;

console.log(`Starting JSONP server on ${port}`);

function jsonp_response(callbackName, data) {
    return `${callbackName}(${JSON.stringify(data)})`;
}

const server = http.createServer((request, response) => {
    const {url} = request;
    const {pathname, search} = new URL('http://localhost' + url);
    const params = querystring.parse(search.slice(1));
    let {callback, cb} = params;

    console.log('jsonp server: ', url);

    callback = callback || cb;

    if (!callback) {
        response.writeHead(500);
        response.end("jsonp callback name is missing");
        return;
    }

    switch (pathname) {
        case '/jsonp/valid':

            response.writeHead(200, {'Content-Type': 'text/javascript'});
            response.end(jsonp_response(callback, Object.assign({result: true}, params)));
            break;
        case '/jsonp/valid/nocache':
            response.writeHead(200, {'Content-Type': 'text/javascript'});
            response.end(jsonp_response(callback, {result: Date.now()}));
            break;
        case '/jsonp/valid/long':
            setTimeout(() => {
                response.writeHead(200, {'Content-Type': 'text/javascript'});
                response.end(jsonp_response(callback, {result: true}));
            }, 15000);
            break;
        case '/jsonp/invalid/badargs':
            response.writeHead(200, {'Content-Type': 'text/javascript'});
            response.end(`${callback}(1, ['a'], {})`);
            break;
        case '/jsonp/invalid/noargs':
            response.writeHead(200, {'Content-Type': 'text/javascript'});
            response.end(`${callback}()`);
            break;
        case '/jsonp/invalid/nocall':
            response.writeHead(200, {'Content-Type': 'text/javascript'});
            response.end();
            break;
        case '/jsonp/invalid/syntax':
            response.writeHead(200, {'Content-Type': 'text/javascript'});
            response.end('(fdfd');
            break;
        case '/jsonp/valid/sandboxed/hack':
            response.writeHead(200, {'Content-Type': 'text/javascript'});
            response.end(jsonp_response(callback, {hasAccess: window.parent.document}));
            break;
        default:
            response.writeHead(404);
            response.end('Invalid api path');
    }
});

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`jsonp server is listening on ${port}`)
});
import {getType, randomStr, generateUniquePropName} from './utils';
import {parseURL, onDOMReady} from './browser';
import fetch from './fetch';
import proxy from './proxy';

const injectResource = (imports) => Object.keys(imports).map(name => {
    const resource = imports[name];

    switch (getType(resource)) {
        case 'string':
            return resource;
        case 'function':
            return `const ${name}= ${resource.toString()}`;
        default:
            return resource.toString()
    }

}).join(';\n');


const sandboxes= {};

export default function Sandbox(options) {
    const sandbox = this,
        imports = {
            fetch,
            proxy,
            init: 'proxy()'
        };

    let iframe = document.createElement('iframe'),
        queries = {};


    let {
        origin,
        idleTimeout
    }= options || {};

    origin && (sandboxes[origin]= sandbox);

    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.display = 'none';

    let isReady = false, readyHandlers= [], timer;

    iframe.addEventListener('load', function onReady() {
        iframe.removeEventListener('load', onReady);
        isReady= true;
        readyHandlers.map(handler=> handler.call(sandbox));
        readyHandlers= [];
    });

    const onready = (handler) => isReady ? handler.call(sandbox) : readyHandlers.push(handler),
        destroy = () => {
            if (iframe) {
                if (origin) {
                    delete sandboxes[origin];
                }
                iframe.parentNode && iframe.parentNode.removeChild(iframe);

                iframe = null;
            }
        };



    sandbox.query= (data, callback)=> {

        if (timer) {
            clearTimeout(timer);
            timer = null;
        }

        const key = generateUniquePropName(queries, () => randomStr(10)),
            sendData = (data) => {
                onready(() => iframe.contentWindow.postMessage(JSON.stringify(Object.assign({key}, data)), "*"));
            };

        console.log(key);

        queries[key]= function(){
            onready(()=>sendData({abort: true}));
        };

        window.addEventListener("message", function handler(e) {

            const response = JSON.parse(e.data);

            if (response.key === key) {
                delete queries[key];

                window.removeEventListener("message", handler, false);

                if (!Object.keys(queries).length) {
                    idleTimeout && (timer = setTimeout(() => {
                        timer = null;
                        destroy();
                    }, idleTimeout));
                }

                try {
                    callback.call(sandbox, null, response.data);
                } catch (e) {
                    callback.call(sandbox, e.message);
                }
            }
        }, false);

        onready(()=>sendData({data}));

        return key;
    };

    iframe.src = "data:text/html;charset=utf-8," +
        encodeURI(`<body><script>${injectResource(imports)}</script></body>`);

    onDOMReady(()=>{
        document.body.appendChild(iframe)
    });
}

Object.assign(Sandbox, {
    query(data, callback){
        const {origin}= parseURL(data.url);

        return (origin && sandboxes[origin] || new Sandbox({origin})).query(data, callback);
    },

    isSupported: typeof window.postMessage=='function'
});
import {getType, randomStr, generateUniquePropName, once, encodeParams, mixin} from "./utils";
import {parseURL, whenDOMReady, addEvent} from "./browser";
import fetch from "./fetch";
import proxy from "./proxy";

const injectResource = (imports) => Object.keys(imports).map((name) => {
    const resource = imports[name];

    switch (getType(resource)) {
        case "string":
            return resource;
        case "function":
            return `const ${name}= ${resource.toString()}`;
        default:
            return resource.toString();
    }

}).join(";\n");


const sandboxes = {};

export default function Sandbox(options) {
    const sandbox = this,
        imports = {
            fetch,
            proxy,
            mixin,
            encodeParams,
            randomStr
        };

    let iframe = document.createElement("iframe"),
        queries = {},
        {
            origin,
            idleTimeout = 15000,
            mode = "data"
        } = options || {},
        isReady = false,
        readyHandlers = [],
        idleTimer,
        blobUrl;

    origin && (sandboxes[origin] = sandbox);

    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.style.display = "none";

    const content = [
        "<!DOCTYPE html><html><body>iframe:sandbox<",
        "script>",
        injectResource(imports),
        ";proxy();</",
        "script></body></html>"
    ].join("");

    const removeLoadListener = addEvent(iframe, "load", () => {
        removeLoadListener();
        blobUrl && URL.revokeObjectURL(blobUrl);
        isReady = true;
        readyHandlers.map(handler => handler.call(sandbox));
        readyHandlers = [];
    });

    const whenReady = (callback) => isReady ? callback.call(sandbox) : readyHandlers.push(callback),
        removeMessageListener = addEvent(window, "message", (e) => {
            try {
                const response = JSON.parse(e.data),
                    {key} = response;
                queries[key] && queries[key](response);
            } catch (e) {
            }
        }, false),
        stopIdleTimer = () => {
            if (idleTimer) {
                clearTimeout(idleTimer);
                idleTimer = null;
            }
        },
        destroy = () => {
            if (iframe) {

                if (origin) {
                    delete sandboxes[origin];
                }

                stopIdleTimer();

                removeMessageListener();

                iframe.parentNode && iframe.parentNode.removeChild(iframe);

                iframe = null;
            }
        };

    sandbox.whenReady = whenReady;

    sandbox.destroy = destroy;

    sandbox.query = (request, callback) => {

        stopIdleTimer();

        const {timeout} = request;

        let timeoutTimer = timeout > 0 && setTimeout(() => done("timeout"), timeout);

        const key = generateUniquePropName(queries, () => randomStr(10)),
            cleanup = () => {
                delete queries[key];

                if (timeoutTimer) {
                    clearTimeout(timeoutTimer);
                    timeoutTimer = null;
                }

                if (!Object.keys(queries).length) {
                    idleTimeout >= 0 && (idleTimer = setTimeout(() => {
                        idleTimer = null;
                        destroy();
                    }, idleTimeout));
                }
            },
            done = once((err, data) => {
                cleanup();
                callback.call(sandbox, err, data);
            }),
            sendData = (request) =>
                whenReady(() => iframe.contentWindow.postMessage(JSON.stringify(Object.assign({key}, request)), "*"));

        queries[key] = (response) => {
            done(response.err, response.data)
        };

        sendData(request);

        return () => {
            if (queries[key]) {
                sendData({action: "abort"});
                done("aborted");
            }
        }
    };

    iframe.src = mode == "blob" ?
        (blobUrl = URL.createObjectURL(new Blob([content], {type: "text/html"}))) :
        "data:text/html;charset=utf-8," + encodeURIComponent(content);

    whenDOMReady(() => document.body.appendChild(iframe));
}


Object.assign(Sandbox, {
    query(data, options, callback) {
        const {origin} = parseURL(data.url);
        return (origin && sandboxes[origin] || new Sandbox(Object.assign({origin}, options))).query(data, callback);
    },

    whenTested: ((data) => {
        let result, i = 0, sandbox;

        const {userAgent} = navigator,
            handlers = [],
            itemKey = "_safe-jsonp_",
            done = once((_result) => {
                if (result === undefined) {
                    result = _result;
                    try {
                        localStorage && localStorage.setItem(itemKey, JSON.stringify({
                            result: _result,
                            agent: userAgent
                        }));
                    } catch (e) {
                    }
                    handlers.forEach(callback => callback(_result));
                }
            }),
            test = (mode, cb) => {
                let sandbox;
                const timer = setTimeout(() => done(Error()), 500),
                    done = once((err, result) => {
                        try {
                            sandbox.destroy();
                        } catch (e) {
                        }
                        clearTimeout(timer);
                        cb(err, result)
                    });
                try {
                    (sandbox = new Sandbox({mode})).query({action: "test", data}, (err, _data) => {
                        if (!err && data === _data) {
                            done(null, mode);
                        } else {
                            done(err || Error());
                        }
                    });
                } catch (e) {
                    done(e);
                }
            },
            nextTest = () => {
                try {
                    i < 2 ? test(["data", "blob"][i++], (err, result) => {
                        err ? nextTest() : done(result);
                    }) : done(false);
                } catch (e) {
                }
            };

        try {
            const entry = JSON.parse(localStorage.getItem(itemKey) || {});
            if (entry.agent === userAgent && ~["data", "blob", false].indexOf(entry.result)) {
                result = entry.result;
            }
        } catch (e) {
        }

        if (result === undefined) {
            if (typeof window.postMessage == "function") {
                nextTest();
            } else {
                result = false;
            }
        }

        return (callback) => {
            result === undefined ? handlers.push(callback) : callback(result);
        }
    })(randomStr())

});


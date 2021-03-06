import {encodeParams, randomStr, mixin, generateUniquePropName} from "./utils";

export default function fetch(url, options, callback) {
    let wasCalled, isComplete, script, timer;
    const targetNode = document.head,
        done = (err, data) => {
            if (!isComplete) {
                isComplete = true;
                timer && clearTimeout(timer);
                if (script) {
                    targetNode.removeChild(script);
                    script.type = "";
                    script.src = "#";
                    script.setAttribute("timeout", 1);
                    script = null;
                }
                callback(err, data);
            }
        },

        completeHandler = () => !wasCalled && done("JSONP callback was not called"),
        publicCallback = function (data) {
            const {length} = arguments;

            delete register[cbName];

            wasCalled = true;
            if (!length) {
                done("data argument is missing");
            } else if (length > 1) {
                done("too many arguments were passed to the JSONP callback");
            } else {
                typeof data == "object" ? done(null, data) : done("invalid data argument type");
            }
        };

    let {
        timeout = 15000,
        registerKey = "__jp",
        register = window[registerKey] || (window[registerKey] = {}),
        params = {},
        cbParam,
        preventCache = true
    } = options || {};

    if (!cbParam || !(cbParam = (cbParam + "").trim())) {
        cbParam = "callback";
    }

    let cbName = "c" + generateUniquePropName(register, (i) => randomStr(i / 10 + 2));

    register[cbName] = publicCallback;

    timer = setTimeout(() => {
        timer = null;
        done(`timeout`)
    }, timeout);

    const internalParams = {};

    internalParams[cbParam] = registerKey + "." + cbName;

    preventCache && (internalParams._rnd = new Date().getTime().toString(36) + randomStr());

    Object.keys(internalParams).forEach(param => {
        Object.prototype.hasOwnProperty.call(params, param) &&
        done(`Query param [${param}] can not be set by user`);
    });

    script = document.createElement("script");
    script.type = "text/javascript";
    script.onerror = () => done("network");
    script.onload = completeHandler;

    script.onreadystatechange = function () {
        if (script.readyState === "complete" || script.readyState === "loaded") {
            script.onreadystatechange = null;
            completeHandler();
        }
    };

    script.src = url + "?" + encodeParams(mixin(params, internalParams));

    targetNode.appendChild(script);

    return () => done("aborted");
}










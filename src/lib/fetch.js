//https://free.currencyconverterapi.com/api/v6/convert?q=USD_PHP&compact=y&callback=_Ppc.cb0


export default function fetch(url, options, callback) {
    let wasCalled, isComplete, script, timer;
    const targetNode = document.head;


    const done = (err, data) => {
            if (!isComplete) {
                isComplete = true;
                timer && clearInterval(timer);
                if (script) {
                    targetNode.removeChild(script);
                    script.type = '';
                }

                callback(err, data);
            }
        },

        completeHandler = () => !wasCalled && done("JSONP callback was not called"),
        publicCallback = function (data) {
            const {length} = arguments;

            wasCalled = true;
            if (!length) {
                done("JSONP callback was called without data argument");
            } else if (length > 1) {
                done("too many arguments were passed to the JSONP callback");
            } else {
                done(null, data);
            }
        };

    let {
        timeout = 15000,
        registerKey = '__jp',
        register = window[registerKey] || (window[registerKey] = {}),
        params = {},
        cbParam,
        preventCache
    } = options || {};

    if (!cbParam || !(cbParam = (cbParam + '').trim())) {
        cbParam = 'callback';
    }

    let cbName, i = 0;

    while ((cbName = `cb${i.toString(36)}`) in register) {
        i++;
    }

    register[cbName] = publicCallback;

    timer = setTimeout(() => {
        timer = null;
        done(`timeout`)
    }, timeout);

    const internalParams = {};

    internalParams[cbParam] = cbParam;

    preventCache && (internalParams._rnd = new Date().getTime().toString(36));

    Object.keys(internalParams).forEach(param => {
        Object.prototype.hasOwnProperty.call(params, param) &&
        done(`User query param [${param}] was overridden with internals`);
    });


    params[cbParam] = registerKey + '.' + cbName;

    const query = params ? Object.keys(params).map(param => {
        let rawValue = params[param];
        return `${param}=${encodeURIComponent(rawValue && typeof rawValue == 'object' ?
            JSON.stringify(rawValue) : ('' + rawValue))}`;
    }).join('&') : '';

    script = document.createElement('script');
    script.type = 'text/javascript';
    script.onerror = () => done('internal');
    script.onload = completeHandler;

    script.onreadystatechange = function () {
        if (script.readyState == 'complete' || script.readyState == 'loaded') {
            script.onreadystatechange = null;
            completeHandler();
        }
    };

    console.log(query);

    script.src = url + (query ? '?' + query : '');

    console.log(script.src);

    targetNode.appendChild(script);

    return () => done('aborted');
};










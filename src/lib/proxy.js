export default function proxy() {

    const queries = {};

    function response(data) {
        window.parent.postMessage(JSON.stringify(data), "*");
    }

    window.onerror = console.info;

    window.addEventListener('error', function () {
        console.info('proxy addEvent onerror', arguments);
    });

    const {warn} = console;

    console.warn = function () {
        console.info(arguments);
        warn.apply(console, arguments);
    };

    window.addEventListener("message", (e) => {
        let key, data, abort;

        try {
            try {
                ({key, data, abort} = JSON.parse(e.data));
            } catch (e) {
                throw Error("invalid JSON request");
            }

            if (abort) {
                const query = queries[key];
                query && query();
            } else {
                if (!data.url) {
                    throw Error("url required");
                }

                queries[key] = fetch(data.url, data.options, (err, data) => {
                    delete queries[key];
                    response({
                        key,
                        data: {err, data}
                    });
                });
            }
        } catch (err) {
            response(err.message);
        }


    }, false);
}
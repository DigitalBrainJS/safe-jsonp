import fetch from "./fetch";

export default function proxy() {
    const queries = {},
        response = (data) => {
            window.parent.postMessage(JSON.stringify(data), "*");
        };

    window.addEventListener("message", (e) => {
        const {key, action, data} = JSON.parse(e.data);
        let query;
        try {
            switch (action) {
                case "test":
                    response({key, data});
                    break;
                case "abort":
                    query = queries[key];
                    query && query();
                    break;
                case "destroy":
                    document.execCommand && document.execCommand('Stop');
                    window.stop && window.stop();
                    break;
                default:
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
        } catch (e) {
            response({key, data: {err: e.message}});
        }
    }, false);
}

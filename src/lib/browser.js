export const parseURL = typeof URL != "undefined" ? (url) => new URL(url, window.location.href) : (url) => {
    let a = document.createElement("a");

    return {
        href: (a.href = url),
        protocol: a.protocol,
        host: a.host,
        hostname: a.hostname,
        port: a.port,
        pathname: a.pathname,
        hash: a.hash,
        search: a.search,
        origin: a.origin
    }
};

export function onDOMReady(callback) {
    let s = document.readyState;

    if (s == "interactive" || s == "complete") {
        callback();
    } else {
        document.addEventListener("DOMContentLoaded", function handler() {
            document.removeEventListener("DOMContentLoaded", handler);
            callback()
        });
    }
}
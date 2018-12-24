import {once} from "./utils";

export const parseURL = typeof URL == "function" ? (url) => new URL(url, window.location.href) : (() => {
    let a;

    return (url) => {
        a = a || document.createElement("a");
        return {
            href: (a.href = url),
            protocol: a.protocol,
            host: a.host,
            hostname: a.hostname,
            port: a.port,
            pathname: ("/" + a.pathname).replace(/^\/\//, "/"),
            hash: a.hash,
            search: a.search,
            origin: a.protocol + "//" + a.hostname
        }
    };
})();

const win = window,
    doc = document,
    modernEventAPI = doc.addEventListener,
    addListener = modernEventAPI ? "addEventListener" : "attachEvent",
    removeListener = modernEventAPI ? "removeEventListener" : "detachEvent",
    eventPrefix = modernEventAPI ? "" : "on";

export function addEvent(obj, event, fn, once) {
    const remove = () => obj[removeListener].apply(obj, args),
        args = [eventPrefix + event, once ? () => {
            remove();
            fn();
        } : fn];

    obj[addListener].apply(obj, args);

    return remove;
}

export const whenDOMReady = (() => {
    const callbacks = [],
        DOMListeners = [],
        done = once(() => {
            DOMListeners.forEach(listener => listener());
            callbacks.forEach(callback => callback());
        }),
        checkReady = () => doc.body && doc.readyState != "loading" && (isReady = true);
    let isReady, eventsAttached;

    return (callback) => {
        if (isReady || checkReady()) {
            setTimeout(callback);
        } else {
            if (!eventsAttached) {
                eventsAttached = DOMListeners.push(
                    addEvent(doc, "DOMContentLoaded", done),
                    addEvent(doc, "readystatechange", () => checkReady() && done()),
                    addEvent(win, "load", done)
                );
            }
            callbacks.push(callback);
        }
    }
})();

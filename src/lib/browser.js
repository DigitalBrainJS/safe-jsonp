
export const parseURL= typeof URL!='undefined'? (url)=>new URL(url, window.location.href) : (url)=>{
    let a = document.createElement("a");
    a.href = url;

    return {
        href: a.href,
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

export function onDOMReady(callback){
    if(~['interactive','complete'].indexOf(document.readyState)){
        callback();
    }else{
        document.addEventListener("DOMContentLoaded", function handler() {
            document.removeEventListener("DOMContentLoaded", handler);
            callback()
        });
    }
}
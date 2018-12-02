
export const parseURL= typeof URL!='undefined'? (url)=>new URL(url, window.location.href) : (url)=>{
    let a = document.createElement("a");
    a.href = url;
    return Object.assign({}, a);
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
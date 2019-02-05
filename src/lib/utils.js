export let global = new Function("return this")();

const {toString}= Object.prototype;


export function randomStr(length = 6) {
    let str = "";

    while (length-- > 0) {
        str += Math.floor(36 * Math.random()).toString(36)
    }

    return str;
}

export function generateUniquePropName(obj, generator = (i) => `${i.toString(36)}`, maxIterations = 1000) {
    let key, i= 0;
    while((key= generator.call(obj, i)) && key in obj){
        if(i++>maxIterations) return null;
    }
    return key;
};

const typeCache= Object.create(null);

export const getType= (thing)=>{
    if (thing === undefined || thing === null) return "" + thing;
    const tag= toString.call(thing);
    return typeCache[tag] || (typeCache[tag]= tag.slice(8, -1).toLowerCase());
};

export const testValueType = (name, value, types, fn) => {
    const r= /^[aeiou]/,
        realType= getType(value);

    if (!~types.indexOf(realType)) {
        const error= TypeError(
            `${name} should be ${r.test(types[0]) ? "an" : "a"} ${types.join("|")},` +
            ` not ${r.test(realType) ? "an" : "a"} ${realType}`
        );

        if(fn){
            fn(error);
            return false;
        }else{
            throw error;
        }

    }

    return true;
};

export function once(fn) {
    let isCalled;
    return function () {
        if (!isCalled) {
            fn.apply(this, arguments);
            isCalled = true;
        }
    }
}

export function parseParams(rawParams, params = {}){
    if(rawParams) {
        ("" + rawParams).split("&").forEach(pair => {
            const [key, value] = pair.split("="),
                decodedKey = decodeURIComponent(key),
                decodedValue = value!==undefined? decodeURIComponent(value) : undefined,
                currentEntry = params[decodedKey];
            params[decodedKey] = currentEntry ? [currentEntry, decodedValue] : decodedValue;
        });
    }
    return params;
};

export function mixin(obj) {
    let i = arguments.length, props = {};

    while (i-- > 0) {
        const dest = arguments[i];
        Object.keys(dest).map(key => props[key] || (props[key] = true) && (obj[key] = dest[key]))
    }

    return obj;
}

export function encodeParams(params) {
    return Object.keys(params).map(param => {
        let rawValue = params[param];
        return `${param}=${encodeURIComponent(rawValue && typeof rawValue == "object" ? JSON.stringify(rawValue) : ("" + rawValue))}`;
    }).join("&")
};
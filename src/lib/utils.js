export let global = new Function("return this")();

const {toString}= Object.prototype;


export function randomStr(length = 6) {
    let str = "";

    while (length-- > 0) {
        str += Math.floor(36 * Math.random()).toString(36)
    }

    return str;
}

export const generateUniquePropName= (obj, generator= (i)=>`${i.toString(36)}`, maxIterations= 1000)=>{
    let key, i= 0;
    while((key= generator.call(obj, i)) && key in obj){
        if(i++>maxIterations) return null;
    }
    return key;
};

const typeCache= Object.create(null);

export const getType= (thing)=>{
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

export const encodeParams= (params) =>params ? Object.keys(params).map(param => {
    let rawValue = params[param];
    return `${param}=${encodeURIComponent(rawValue && typeof rawValue == "object" ? JSON.stringify(rawValue) : ("" + rawValue))}`;
}).join("&") : "";

export let global = new Function('return this')();

export const chars= 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const {toString}= Object.prototype;


export function randomStr(length = 6, pool = chars) {
    let str = "";

    while (length-- > 0) {
        str += pool[(Math.floor(pool.length * Math.random()))];
    }

    return str;
}

export function dropElement(arr, value, rtl) {
    const index = arr[rtl ? 'indexOf' : 'lastIndexOf'](value);
    if (~index){
        arr.splice(index, 1);
    }

    return !!~index;
}

export function promisify(fn){
    return new function(...args){
        return new Promise((resolve, reject)=>{
            fn.apply(this, args.push((err, ...data)=>{
                err? reject(err) : resolve(data.length>1? data : data[0]);
            }))
        })
    };

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
            name + ' should be ' + (types.length ? (r.test(types[0])? 'an ' : 'a ') + types[0] : types.join('|')) +
            ', not ' + (r.test(realType)? 'an ' : 'a ') + realType
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
        ('' + rawParams).split('&').forEach(pair => {
            const [key, value] = pair.split('='),
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
    return `${param}=${encodeURIComponent(rawValue && typeof rawValue == 'object'? JSON.stringify(rawValue) : ('' + rawValue))}`;
}).join('&') : '';

export const dumpArguments = (...args) => args.map(arg => toString.call(arg).slice(8, -1)).join(', ');

export function getFuncCode(fn) {
    if (typeof fn=='function') {
        let str = Function.prototype.toString.call(fn),
            rawCode = str[str.length - 1] === '}' ? str.slice(str.indexOf("{") + 1, -1) : str.slice(str.indexOf('=>') + 2),
            code= rawCode.trim().replace(/\s{2,}/g, ' ');

        return code === '[native code]'? null : code;
    }

    return null;
}

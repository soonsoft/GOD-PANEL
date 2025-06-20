let idValue = 0;
const EventProxyFnPropery = Symbol("proxyFn");
const EventProxyElementProperty = Symbol("proxyElement");

const taskInfo = {
    MICRO: "micro",
    MACRO: "macro",
    ensureType: type => type === taskInfo.MACRO ? taskInfo.MACRO : taskInfo.MICRO,
    getTask: type => taskInfo[`${type}Task`],
    setTask: (type, task) => taskInfo[`${type}Task`] = task
};

function loadJS(src, callback) {
    const script = document.createElement("script");
    script.onload = callback;
    script.src = src;
    document.body.appendChild(script);
}

function ready(fn, immediate) {
    let doReady = () => {
        if(isFunction(fn)) {
            fn();
        } else if(Array.isArray(fn)) {
            fn.forEach(i => {
                if(isFunction(i)) {
                    i();
                }
            });
        }
    };
    if(immediate) {
        doReady();
    } else {
        on("DOMContentLoaded", doReady);
    }
}

function getCookie(cookieName) {
    function parseCookieValue(s) {
        if (s.indexOf('"') === 0) {
            // This is a quoted cookie as according to RFC2068, unescape...
            s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        try {
            //处理加号
            return decodeURIComponent(s.replace(/\+/g, ' '));
        } catch (e) {
            return s;
        }
    }

    let pairs = String(document.cookie).split(/; */);
    for(let i = 0; i < pairs.length; i++) {
        let pair = pairs[i];
        let index = pair.indexOf('=');
        if (index === -1) {
            continue;
        }
        let key = pair.substring(0, index).trim();
        if(key === cookieName) {
            let val = pair.substring(++index, pair.length).trim();
            return parseCookieValue(val)
        }
    }
    return null;
}

function isFunction(e) {
    return typeof e === "function";
}

function isEmpty(val) {
    let type = typeof val;
    return type === "undefined" || (type === "string" && val.length === 0) || val === null;
}

// Todo test this function
function base64Encode(str) {
    if(isEmpty(str)) {
        return "";
    }
    let encoder = new TextEncoder("utf-8");
    let uint8array = encoder.encode(str);
    return uint8array.toBase64();
}

// Todo test this function
function base64Decode(str) {
    if(isEmpty(str)) {
        return "";
    }
    let decoder = new TextDecoder("utf-8");
    let uint8array = Uint8Array.from(atob(str), c => c.charCodeAt(0));
    return decoder.decode(uint8array);
}

function on(element, eventName, eventFn) {
    if(isFunction(eventName)) {
        eventFn = eventName;
    }
    if(typeof element === "string") {
        eventName = element;
        element = null;
    }
    if(!element) {
        element = document;
    }
    element.addEventListener(eventName, eventFn, false);
}

function off(element, eventName, eventFn) {
    if(isFunction(eventName)) {
        eventFn = eventName;
    }
    if(typeof element === "string") {
        eventName = element;
        element = null;
    }
    if(!element) {
        element = document;
    }
    element.removeEventListener(eventName, eventFn);
}

function onAnimationStart(element, eventFn, once) {
    let listener = event => {
        if(once) {
            off(element, "transitionstart", listener);
        }
        if(isFunction(eventFn)) {
            eventFn(event);
        }
    };
    on(element, "transitionstart", listener);
}
function onAnimationEnd(element, eventFn, once) {
    let listener = event => {
        if(once) {
            off(element, "transitionend", listener);
        }
        if(isFunction(eventFn)) {
            eventFn(event);
        }
    };
    on(element, "transitionend", listener);
}

function createEventProxy(element, eventName) {
    if(!element) {
        throw new TypeError(`element is ${element}`);
    }
    if(isEmpty(eventName)) {
        throw TypeError(`eventName is ${eventName}`);
    }
    const proxyEvents = [];
    const proxy = {
        on: fn => {
            if(!isFunction(fn)) {
                return false;
            }
            for(let i = 0; i < proxyEvents.length; i++) {
                if(proxyEvents[i] === fn) {
                    return false;
                }
            }
            proxyEvents.push(fn);
            return true;
        },
        off: fn => {
            if(!isFunction(fn)) {
                return false;
            }
            for(let i = 0; i < proxyEvents.length; i++) {
                if(proxyEvents[i] === fn) {
                    proxyEvents.splice(i, 1);
                    return true;
                }
            }
            return false;
        }
    };
    Object.defineProperty(proxy, "eventName", {
        get: () => eventName,
        configurable: false,
        enumerable: true
    });
    proxy[EventProxyElementProperty] = element;
    proxy[EventProxyFnPropery] = e => {
        let elem = e.target;
        while(elem !== element) {
            let isAborted = false;
            for(let i = 0; i < proxyEvents.length; i++) {
                let proxyFn = proxyEvents[i];
                let behavior = {
                    hitting: false,
                    aborting: false
                };
                const setBehavior = values => Object.assign(behavior, values);
                try {
                    proxyFn(elem, e, setBehavior);
                    isAborted = behavior.aborting;
                    if(behavior.hitting) {
                        break;
                    }
                } catch(e) {
                    isAborted = true;
                    console.error(`${eventName} Proxy error.`, e);
                    break;
                }
            }
            if(isAborted) {
                break;
            }
            elem = elem.parentNode;
        }
    };
    on(element, eventName, proxy[EventProxyFnPropery]);
    return proxy;
}

function removeEventProxy(eventProxy) {
    if(!eventProxy) {
        return;
    }
    off(eventProxy[EventProxyElementProperty], eventProxy.eventName, eventProxy[EventProxyFnPropery]);
}

function appendHtml(elem, html) {
    if(typeof elem === "string") {
        html = elem;
        elem = document.body;
    }

    // beforebegin - 元素自身前面，
    // afterend - 元素自身后面，
    // afterbegin - 元素内部第一个元素前面，
    // beforeend - 元素内部最后一个子节点后面
    elem.insertAdjacentHTML("beforeend", html);
}

function replaceHtml(elem, html) {
    elem.replaceChildren([])
    appendHtml(elem, html);
}

function html(strings, ...keys) {
    return (...values) => {
        const result = [strings[0]];
        const dict = values[values.length - 1] || {};
        for(let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let value = Number.isInteger(key) ? values[key] : dict[key];
            result.push(value, strings[i + 1]);
        }
        return result.join("");
    };
}

function htmlCondition(predicate, val, fn) {
    if(isFunction(predicate)) {
        if(predicate(val)) {
            return isFunction(fn) ? fn(val) : fn;
        }
    } else {
        if(!!predicate) {
            return isFunction(val) ? val() : fn(val);
        }
    }
    return "";
}

/*
    NodeType:
    1 - ELEMENT_NODE
    2 - ATTRIBUTE_NODE
    3 - TEXT_NODE
    4 - CDATA_SECTION_NODE ( <!CDATA[[ … ]]> )
    5 - undefined
    6 - undefined
    7 - PROCESSING_INSTRUCTION_NODE ( <?xml-stylesheet ... ?> )
    8 - COMMENT_NODE ( <!-- … --> )
    9 - DOCUMENT_NODE
    10 - DOCUMENT_TYPE_NODE ( <!DOCTYPE html> )
    11 - DOCUMENT_FRAGMENT_NODE
*/
function parentElement(elem) {
    if(!elem) {
        return null;
    }
    if(elem.nodeType === 1) {
        return elem.parentElement;
    }
    let parent = elem.parentNode;
    while(parent && parent.nodeType !== 1) {
        if(parent.nodeType === 9) {
            break;
        }
        parent = parent.parentNode;
    }
    return parent;
}
    
function nextElement(elem) {
    if(!elem) {
        return null;
    }
    if(elem.nodeType === 1) {
        return elem.nextElementSibling;
    }
    let next = elem.nextSibling;
    while(next && next.nodeType !== 1) {
        next = elem.nextSibling;
    }
    return next;
}

function previousElement(elem) {
    if(!elem) {
        return null;
    }
    if(elem.nodeType === 1) {
        return elem.previousElementSibling;
    }
    let next = elem.previousSibling;
    while(next && next.nodeType !== 1) {
        next = elem.previousSibling;
    }
    return next;
}

/**
 * 注册异步任务
 * @param {*} fn 任务函数
 * @param {*} type 配置 micro - 微任务，macro - 宏任务
 * @returns 
 */
function setNextTick(fn, type) {
    if(!isFunction(fn)) {
        throw new TypeError("the arguments fn is not a function");
    }

    type = taskInfo.ensureType(type);
    let task = taskInfo.getTask(type);
    if(!task) {
        task = {
            status: "pending",
            list: [],
            run: () => {
                while(task.list.length > 0) {
                    task.status = "running";
                    let list = task.list;
                    task.list = [];
                    for(let i = 0; i < list.length; i++) {
                        if(isFunction(list[i])) {
                            try {
                                list[i]();
                            } catch(e) {
                                console.error(e);
                            }
                        }
                    }
                }
                task.status = "pending";
            }
        };
        taskInfo.setTask(type, task);
    }
    task.list.push(fn);
    if(task.status === "pending") {
        if(type === taskInfo.MICRO) {
            Promise.resolve().then(task.run);
        } else {
            if(isFunction(setImmediate)) {
                setImmediate(task.run);
            } else {
                setTimeout(task.run);
            }
        }
        task.status = "waitting";
    }
    return `${type}::${task.list.length - 1}`;
}

function clearNextTick(key) {
    if(!isEmpty(key)) {
        let [type, index] = key.split("::");
        let task = taskInfo.getTask(type);
        task.list[index] = undefined;
        return true;
    }
    return false;
}

// 深拷贝函数
function deepClone(obj, options = {}) {
    const {
        handleDOM = false, // 是否克隆DOM节点
        handlePromise = false // 是否克隆Promise
    } = options;

    if (typeof obj !== 'object' || obj === null) return obj;

    const root = Array.isArray(obj) ? [] : Object.create(Object.getPrototypeOf(obj));
    const stack = [{ parent: root, key: undefined, data: obj }];
    const visited = new Map();
    visited.set(obj, root);

    const isDOM = v => (typeof Node === 'function' && v instanceof Node);

    while (stack.length) {
        const { parent, key, data } = stack.pop();
        let res = parent;
        if (typeof key !== 'undefined') {
            let clone;
            if (Array.isArray(data)) {
                clone = [];
            } else if (data instanceof Date) {
                clone = new Date(data);
            } else if (data instanceof RegExp) {
                clone = new RegExp(data.source, data.flags);
                clone.lastIndex = data.lastIndex;
            } else if (data instanceof Map) {
                clone = new Map();
            } else if (data instanceof Set) {
                clone = new Set();
            } else if (data instanceof Error) {
                clone = new data.constructor(data.message);
                clone.stack = data.stack;
            } else if (ArrayBuffer.isView(data)) {
                clone = new data.constructor(data.buffer.slice(0));
            } else if (data instanceof ArrayBuffer) {
                clone = data.slice(0);
            } else if (typeof data === 'function') {
                clone = data.bind(null);
            } else if (typeof Promise !== 'undefined' && data instanceof Promise) {
                clone = handlePromise ? Promise.resolve(data) : data;
            } else if (typeof WeakMap !== 'undefined' && data instanceof WeakMap) {
                clone = data; // 只能浅拷贝
            } else if (typeof WeakSet !== 'undefined' && data instanceof WeakSet) {
                clone = data; // 只能浅拷贝
            } else if (typeof Symbol !== 'undefined' && typeof data === 'symbol') {
                clone = Object(Symbol.prototype.valueOf.call(data));
            } else if (isDOM(data)) {
                clone = handleDOM ? data.cloneNode(true) : data;
            } else {
                clone = Object.create(Object.getPrototypeOf(data));
            }
            res = parent[key] = clone;
            visited.set(data, clone);
        }

        if (data instanceof Map) {
            for (let [k, v] of data.entries()) {
                if (typeof v === 'object' && v !== null) {
                    if (visited.has(v)) {
                        res.set(k, visited.get(v));
                    } else {
                        stack.push({ parent: res, key: k, data: v, isMap: true });
                    }
                } else {
                    res.set(k, v);
                }
            }
            continue;
        }
        if (data instanceof Set) {
            for (let v of data.values()) {
                if (typeof v === 'object' && v !== null) {
                    if (visited.has(v)) {
                        res.add(visited.get(v));
                    } else {
                        stack.push({ parent: res, key: v, data: v, isSet: true });
                    }
                } else {
                    res.add(v);
                }
            }
            continue;
        }
        const keys = [
            ...Object.getOwnPropertyNames(data),
            ...Object.getOwnPropertySymbols(data)
        ];
        for (let k of keys) {
            const desc = Object.getOwnPropertyDescriptor(data, k);
            if (!desc) continue;
            if ('value' in desc) {
                const value = desc.value;
                if (typeof value === 'object' && value !== null) {
                    if (visited.has(value)) {
                        desc.value = visited.get(value);
                        Object.defineProperty(res, k, desc);
                    } else {
                        stack.push({ parent: res, key: k, data: value });
                    }
                } else {
                    Object.defineProperty(res, k, desc);
                }
            } else {
                Object.defineProperty(res, k, desc);
            }
        }
    }
    return root;
}

function generateId() {
    idValue++;
    return idValue;
}

function generateGUID() {
    const cryptoObj = window.crypto || window.msCrypto;
    const buffer = new Uint8Array(16);
    cryptoObj.getRandomValues(buffer);

    buffer[6] = (buffer[6] & 0x0f) | 0x40; // Version 4
    buffer[8] = (buffer[8] & 0x3f) | 0x80; // Variant 10

    const hex = Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function show(element) {
    if(!element) {
        return;
    }
    let displayValue = window.getComputedStyle(element).display;
    if(displayValue !== "none") {
        return;
    }
    displayValue = element.getAttribute("tmp_display");
    if(displayValue) {
        element.style.display = displayValue;
    } else {
        element.style.display = "block";
    }
}

function hide(element) {
    if(!element) {
        return;
    }
    let displayValue = getComputedStyle(element).display;
    if(displayValue === "none") {
        return;
    }
    element.setAttribute("tmp_display", displayValue);
    element.style.display = "none";
}

function saveAs(blob, filename) {
    let alink = document.createElement("a");
    alink.style = "margin-left: -100px";
    document.body.appendChild(alink);
    alink.download = filename || "download-file.unknown";
    alink.href = URL.createObjectURL(blob);
    alink.click();
    document.body.removeChild(alink);
}

function readTextFile(blob, encoding) {
    return new Promise((resolve, reject) => {
        if(!blob || !(blob instanceof Blob)) {
            resolve(null);
            return;
        }
        try {
            let fileReader = new FileReader();
            fileReader.addEventListener("load", () => {
                resolve(fileReader.result);
            }, false);
            fileReader.readAsText(blob, encoding || "UTF-8");
        } catch(e) {
            reject(e);
        }
    });
}

function convertDataAttr(str) {
    if(isEmpty(str)) {
        return "";
    }

    let parts = ["data"];
    let startIndex = 0;
    let strLength = str.length;
    for(let i = 0; i < strLength; i++) {
        let c = str.charAt(i);
        if(c >= "A" && c <= "Z") {
            if(i > startIndex) {
                parts.push(str.substring(startIndex, i).toLowerCase());
            }
            startIndex = i;
        }
    }
    if(startIndex < strLength) {
        parts.push(str.substring(startIndex, strLength).toLowerCase());
    }
    return parts.join("-");
}

function splitText(str, split) {
    if(isEmpty(str)) {
        return [];
    }
    str += "";
    let arr = str.split(split || ",");
    let result = [];
    arr.forEach(e => {
        let val = e.trim();
        if(val) {
            result.push(val);
        }
    });
    return result;
}

export {
    loadJS,
    ready,
    getCookie,
    isFunction,
    isEmpty,
    on,
    off,
    onAnimationStart,
    onAnimationEnd,
    createEventProxy,
    removeEventProxy,
    appendHtml,
    replaceHtml,
    html,
    htmlCondition,
    parentElement,
    previousElement,
    nextElement,
    setNextTick,
    clearNextTick,
    deepClone,
    generateId,
    show,
    hide,
    saveAs,
    readTextFile,
    convertDataAttr,
    splitText
};
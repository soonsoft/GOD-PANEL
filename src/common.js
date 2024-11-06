let idValue = 0;

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

function nextTick(fn) {
    return setTimeout(fn);
}

function generateId() {
    idValue++;
    return idValue;
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

export {
    loadJS,
    ready,
    getCookie,
    isFunction,
    isEmpty,
    on,
    off,
    appendHtml,
    replaceHtml,
    html,
    htmlCondition,
    parentElement,
    previousElement,
    nextElement,
    nextTick,
    generateId,
    saveAs
};
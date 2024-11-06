import { isFunction, isEmpty } from './common.js';

const events = new Map();

function addEventListener(name, fn) {
    if(!isFunction(fn)) {
        return false;
    }
    let callbackArr = events.get(name);
    if(!callbackArr) {
        callbackArr = [];
        events.set(name, callbackArr);
    }
    for(let i = 0; i < callbackArr.length; i++) {
        if(callbackArr[i] === fn) {
            return false;
        }
    }
    callbackArr.push(fn);
    return true;
}

function removeEventListener(name, fn) {
    if(events.has(name) && isFunction(fn)) {
        let callbackList = events.get(name);
        if(Array.isArray(callbackList) && callbackList.length > 0) {
            for(let i = 0; i < callbackList.length; i++) {
                if(callbackList[i] === fn) {
                    callbackList.splice(i, 1);
                    return true;
                }
            }
        }
    }
    return false;
}

function clearEventListener(name) {
    if(events.has(name)) {
        events.delete(name);
    }
}

function dispatchEvent(name, obj) {
    if(isEmpty(name)) {
        return;
    }
    const callbackArr = events.get(name);
    if(Array.isArray(callbackArr)) {
        callbackArr.forEach(fn => fn(obj));
    }
}

export {
    addEventListener,
    removeEventListener,
    clearEventListener,
    dispatchEvent
};
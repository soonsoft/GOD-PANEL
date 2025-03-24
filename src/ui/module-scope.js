import { replaceHtml } from "../common";

let bodyScopeStack;
// state
let activedScope;
let activedScopeNum;

function newScopeStack() {
    bodyScopeStack = [];
}

function releaseScopeStack() {
    bodyScopeStack = null;
}

function getScopeStackSize() {
    return bodyScopeStack.length;
}

//#region scope API

function getScopeInfo(scope) {
    let scopeIndex = parseInt(scope);
    if(scopeIndex < 0) {
        scopeIndex = 0;
    }
    let scopeInfo = bodyScopeStack[scopeIndex];
    if(!scopeInfo) {
        console.error(`call getScopeInfo - scope: ${scope} is not found.`);
    }
    return scopeInfo;
}

function getMainScopeInfo() {
    return getScopeInfo()[0];
}

function getLastScopeInfo() {
    return getScopeInfo(bodyScopeStack.length - 1);
}

function addScopeInfo(scopeInfo) {
    if(!scopeInfo) {
        scopeInfo = {};
    }
    bodyScopeStack.push(scopeInfo);
    let scope = bodyScopeStack.length - 1;
    scopeInfo.scope = scope;
    scopeInfo.enabled = true;
    return scope;
}

function popScopeInfo() {
    let scopeInfo =  bodyScopeStack.pop();
    scopeInfo.enabled = false;
    return scopeInfo;
}

function setScopeData(scope, key, value) {
    let scopeInfo = getScopeInfo(scope);
    if(!scopeInfo) {
        console.error(`「setScopeData」- the scope: ${scope} can not find.`);
        return false;
    }
    if(!scopeInfo.data) {
        scopeInfo.data = {};
    }

    scopeInfo.data[key] = value;
}

function getScopeData(scope, key) {
    let scopeInfo = getScopeInfo(scope);
    if(!scopeInfo) {
        console.error(`「setScopeData」- the scope: ${scope} can not find.`);
        return null;
    }

    return scopeInfo.data ? scopeInfo.data[key] : null;
}

function removeScopeData(scope, key) {
    let scopeInfo = getScopeInfo(scope);
    if(scopeInfo && scopeInfo.data) {
        delete scopeInfo.data[key];
    }
}

function wrapFunctionWithContext(fn, ctx, scope) {
    return function() {
        if(scope === activedScope) {
            activedScopeNum++;
        } else {
            activedScope = scope;
            activedScopeNum = 1;
        }

        try {
            return fn.apply(ctx, arguments);
        } catch(e) {
            console.error(e);
        } finally {
            activedScopeNum--;
            if(activedScopeNum === 0) {
                activedScope = null;
            }
        }
    }.bind(ctx);
}


//#endregion

//#region PropertyWithScope

function parsePropertyName(name) {
    let result = {
        scope: undefined,
        id: undefined
    };
    let arr = name.split("::");
    if(arr.length > 1) {
        result.scope = parseInt(arr[0], 10);
        result.id = arr[1];
    } else {
        result.id = arr[0];
    }

    return result;
}

function createPropertyId(scope, id) {
    return `${scope}::${id}`;
}

function isEditorProperty(property) {
    return typeof property === "string" ? property.startsWith("editor_") : property.scope === "editor";
}

//#endregion

function resultRender(html) {
    let scope = activedScope;
    let scopeInfo = getScopeInfo(scope || 0);
    if(scopeInfo && scopeInfo.enabled) {
        let bodyPanel = scopeInfo.bodyPanel;
        let resultPanel = bodyPanel.querySelector(".result-panel");
        if(!resultPanel) {
            return;
        }
        replaceHtml(resultPanel, html);
    }
}

export {
    newScopeStack,
    releaseScopeStack,
    getScopeStackSize,
    resultRender,
    wrapFunctionWithContext,
    getScopeInfo,
    getMainScopeInfo,
    getLastScopeInfo,
    addScopeInfo,
    popScopeInfo,
    parsePropertyName,
    createPropertyId,
    isEditorProperty,
    getScopeData,
    setScopeData,
    removeScopeData
};
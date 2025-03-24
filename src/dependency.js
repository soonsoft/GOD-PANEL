import {isFunction, replaceHtml} from "./common";
import { getScopeInfo, createPropertyId } from "./ui/module-scope";

function addDependency(scope, propertyId, depInfo) {
    let scopeInfo = getScopeInfo(scope);
    let depMap = scopeInfo?.depMap;
    if(depMap) {
        depMap.set(propertyId, depInfo);
    } else {
        console.error("depMap is not found.");
    }
}

function updateDependency(scope, changedProperyInfo, properties) {
    if(Array.isArray(scope)) {
        properties = scope;
        scope = null;
    } else if(typeof scope === "object") {
        changedProperyInfo = scope;
        scope = null;
    }

    if(Array.isArray(changedProperyInfo)) {
        properties = changedProperyInfo;
        changedProperyInfo = null;
    }

    if(!changedProperyInfo) {
        if(!Array.isArray(properties)) {
            let scopeInfo = getScopeInfo(scope);
            properties = Array.isArray(scopeInfo.properties) ? scopeInfo.properties : [];
        }
        properties.forEach(p => {
            updateDependency(scope, p);
        });
    } else {
        const depMap = getScopeInfo(scope).depMap;
        const id = createPropertyId(scope, changedProperyInfo.id);
        if(!depMap || !depMap.has(id)) {
            return;
        }

        let depInfo = depMap.get(id);
        if(!isFunction(depInfo.depFn)) {
            return;
        }
        if(depInfo.destinationProperyInfo.type === "select") {
            let descriptionId = createPropertyId(scope, depInfo.destinationProperyInfo.id);
            let selectElem = document.getElementById(descriptionId);
            if(selectElem) {
                let options = depInfo.depFn(changedProperyInfo.value, depInfo.destinationProperyInfo);
                replaceHtml(selectElem, depInfo.selectRender(options, depInfo.destinationProperyInfo));
            }
        }
    }
}

export {
    addDependency,
    updateDependency
};

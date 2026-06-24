import { generateId, html, htmlCondition, isEmpty, isFunction, convertDataAttr, appendHtml, onAnimationEnd, hide } from "../common";
import { cardRender } from "./render/card-view";
import { jsonRender } from "./render/json-view";
import { tableRender } from "./render/table-view";
import { imageRender } from "./render/image-view";
import { propertyRender } from "./render/properties-view";
import { pageButtonRender } from "./render/pager-view";

function createLinkButton(actionName, text, param) {
    let scope = this.scope || 0;
    let attrs = [`data-scope="${scope}"`];
    if(!isEmpty(param)) {
        Object.keys(param).forEach(key => {
            let attrName = convertDataAttr(key);
            let attrValue = param[key];
            attrs.push(`${attrName}="${attrValue}"`);
        });
    }
    let dataAttrs = attrs.join(" ");
    return `<a data-action-name="${actionName}" ${dataAttrs}>${text}</a>`;
}


function showToast(globalContext = null, message = "", options) {
    if(typeof globalContext === "string") {
        [message, options] = arguments;
        globalContext = null;
    }

    if(!globalContext) {
        return;
    }

    function appendMessage(message) {
        return `
            <li>
                <p>${message}</p>
            </li>
        `;
    }

    let toastInfo = globalContext.toastInfo;
    if(toastInfo) {
        let ul = toastInfo.toastPanel.querySelector("ul");
        let children = ul.children;
        if(children.length >= 5) {
            children[0].remove();
        }
        appendHtml(ul, appendMessage(message));
    } else {
        let toastId = `toast_${generateId()}`;
        let htmlBuilder = [`<div id="${toastId}" class="toast-panel">`];
        htmlBuilder.push('<ul>');
        htmlBuilder.push(appendMessage(message));
        htmlBuilder.push('</ul>');
        htmlBuilder.push('</div>');
        let godPanel = globalContext.godPanel;
        appendHtml(godPanel, htmlBuilder.join(""));
        globalContext.toastInfo = toastInfo = {
            toastPanel: document.getElementById(toastId)
        };
        requestAnimationFrame(() => toastInfo.toastPanel.classList.add("toast-in"));
    }
    if(toastInfo.timeoutHandler) {
        clearTimeout(toastInfo.timeoutHandler);
    }
    toastInfo.timeoutHandler = setTimeout(() => {
        onAnimationEnd(toastInfo.toastPanel, () => {
            if(toastInfo.toastPanel.classList.contains("toast-out")) {
                toastInfo.toastPanel.remove();
            }
        }, true);
        toastInfo.toastPanel.classList.add("toast-out");
        globalContext.toastInfo = null;
    }, 5000);
}

export {
    createLinkButton,
    jsonRender,
    tableRender,
    pageButtonRender,
    imageRender,
    cardRender,
    propertyRender,
    showToast
};
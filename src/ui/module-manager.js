import { isFunction, isEmpty, on, html, htmlCondition, appendHtml, replaceHtml, onAnimationStart, onAnimationEnd, setNextTick, deepClone } from "../common";
import { addEventListener, dispatchEvent } from "../event";
import { getScopeInfo, addScopeInfo, parsePropertyId, wrapFunctionWithContext, releaseScopeStack, newScopeStack, setScopeData, getScopeData, getScopeStackSize, popScopeStack, peekScopeStack } from "./module-scope";
import { addDependency, updateDependency } from "../dependency";
import { cardRender, createLinkButton, imageRender, jsonRender, propertyRender, tableRender, pageButtonRender, showToast } from "./panel-ui"

let context;
let modules = [];
let currentMenuId;
let bodyGroup;

// state
let currentModuleDisabled = false;

function isEmptyModule(module) {
    return (!Array.isArray(module.properties) || module.properties.length === 0)
        && (!Array.isArray(module.actions) || module.actions.length === 0)
        && !isFunction(module.onOpened);
}

function setModuleDisabled(value) {
    currentModuleDisabled = value;
}

function getCurrentModule(id) {
    if(!id) {
        id = currentMenuId;
    }
    if(!id) {
        return null;
    }
    let arr = id.split(":");
    let index = parseInt(arr[0], 10);
    let subIndex = parseInt(arr[1], 10);

    let module = modules[index];
    if(!Number.isNaN(subIndex)) {
        module = module.subModules[subIndex];
    }
    return module;
}

//#region ActionContext API

function createActionContext(ctx, scope) {
    if(!ctx) {
        ctx = {};
    }
    ctx.scope = scope;
    ctx.godInfo = context;
    let funcList = {
        getCurrentViewModel: () => {
            return getCurrentViewModel(null, scope);
        },
        checkCurrentViewModel: () => {
            return checkCurrentViewModel(null, scope);
        },
        getPropertyValue: (propertyName) => {
            return getPropertyValue(propertyName, scope);
        },
        setPropertyValue: (propertyName, value) => {
            setPropertyValue(propertyName, value, scope);
        },
        updatePropertyInfo: (propertyName, setterFn) => {
            updatePropertyInfo(propertyName, setterFn, scope);
        },
        showDetailPanel,
        hideDetailPanel,
        createLinkButton,
        getElementData: wrapFunctionWithContext(function (key) {
            return this.element ? this.element.dataset[key] : null;
        }, ctx, scope),
        setData: wrapFunctionWithContext(function(key, value) {
            setScopeData(scope, key, value);
        }, ctx, scope),
        getData: wrapFunctionWithContext(function(key) {
            return getScopeData(scope, key);
        }, ctx, scope),
        jsonRender: wrapFunctionWithContext(jsonRender, ctx, scope),
        tableRender: wrapFunctionWithContext(tableRender, ctx, scope),
        imageRender: wrapFunctionWithContext(imageRender, ctx, scope),
        cardRender: wrapFunctionWithContext(cardRender, ctx, scope),
        pageButtonRender: wrapFunctionWithContext(pageButtonRender, ctx, scope),
        propertyRender: wrapFunctionWithContext(propertyRender, ctx, scope),
        toast: (title, message, options) => {
            showToast(context, title, message, options);
        }
    };
    return Object.assign(ctx, funcList);
}

function createCallAction(scopeInfo, scope) {
    return (actionName, param, onSuccess, onError) => {
        if(!scopeInfo || !Array.isArray(scopeInfo.actions)) {
            return;
        }
        let actionInfo = scopeInfo.actions.find(b => b.actionName === actionName);
        let options = {
            onSuccess,
            onError,
            param
        };
        callAction(actionInfo, scopeInfo, null, scope, options);
    };
}

function callAction(actionInfo, module, elem, scope, options = {}) {
    if(actionInfo && isFunction(actionInfo.action)) {
        const doSuccess = result => {
            if(isFunction(options.onSuccess)) {
                options.onSuccess.call(null, result);
            }
        };
        const doError = e => {
            if(isFunction(options.onError)) {
                options.onError.call(null, e);
            }
        };
        try {
            let result = actionInfo.action(createActionContext({
                element: elem,
                callAction: createCallAction(module, scope),
                module,
                actionInfo,
                param: options.param
            }, scope));
            if(result instanceof Promise) {
                result.then(doSuccess).catch(doError);
            } else {
                doSuccess(result);
            }
        } catch(e) {
            doError(e);
        }
    }
}

function isEditorProperty(property) {
    return typeof property === "string" ? property.startsWith("editor_") : property.scope === "editor";
}

//#endregion

//#region Data API

function getCurrentViewModel(properties, scope) {
    if(!properties) {
        let scopeInfo = getScopeInfo(scope || 0);
        properties = scopeInfo.properties;
    }
    let model = {};
    if(Array.isArray(properties)) {
        properties.forEach((e, i) => {
            model[e.id] = e.value;
        });
    }
    return model;
}

function checkCurrentViewModel(properties, scope) {
    let checkPropertyList = [];
    if(typeof properties === "string") {
        checkPropertyList = Array.prototype.slice.call(arguments, 0, arguments.length);
        properties = null;
    } else {
        checkPropertyList = Array.prototype.slice.call(arguments, 1, arguments.length);
    }

    if(!properties) {
        let scopeInfo = getScopeInfo(scope || 0);
        properties = scopeInfo.properties;
    }
    let result = {
        valid: true,
        messages: []
    };
    if(Array.isArray(properties)) {
        if(checkPropertyList.length > 0) {
            properties = properties.filter(p => checkPropertyList.includes(p.id));
        }
        properties.forEach((p, i) => {
            if(p.required ) {
                if(p.type === "file") {
                    let fileInput = document.getElementById(p.id);
                    if(fileInput && fileInput.files.length === 0) {
                        fileInput.value = "";
                        result.messages.push(`${p.label || p.id}未选择文件`);
                    }
                } else if(p.type === "checkbox") {
                    if(!Array.isArray(p.value) || p.value.length === 0) {
                        result.messages.push(`${p.label || p.id}未选择`);
                    }
                } else {
                    if(isEmpty(p.value) || Number.isNaN(p.value)) {
                        result.messages.push(`${p.label || p.id}不能为空`);
                    }
                }
            }
            if(isFunction(p.validate) && !p.validate(e.value)) {
                result.messages.push(`${p.label || p.id}的值不符合要求`);
            }
        });
    }
    if(result.messages.length > 0) {
        result.valid = false;
    }
    result.invalid = fn => {
        if(!result.valid) {
            if(isFunction(fn)) {
                fn(result);
            }
        }
        return !result.valid;
    };
    return result;
}

function eachPropertiesByName(propertyName, scope, fn) {
    let scopeInfo = getScopeInfo(scope || 0);
    let properties = scopeInfo.properties;
    if(Array.isArray(properties)) {
        for(let i = 0; i < properties.length; i++) {
            let propertyInfo = properties[i];
            if(propertyInfo.id === propertyName) {
                return fn(propertyInfo);
            }
        }
    }
}

function propertiesRender(scopeInfo) {
    let properties = scopeInfo.properties;
    let scope = scopeInfo.scope;
    let container = scopeInfo.bodyPanel.querySelector(".body-container");
    let formPanel = container.querySelector(".form-panel");
    replaceHtml(formPanel, formRender(properties, scope));
}

function getPropertyValue(propertyName, scope) {
    return eachPropertiesByName(propertyName, scope, p => p.value) || null;
}
function setPropertyValue(propertyName, value, scope) {
    eachPropertiesByName(propertyName, scope, propertyInfo => {
        propertyInfo.value = value;
        if(isFunction(propertyInfo.updatePropertyElement)) {
            propertyInfo.updatePropertyElement(value);
        }
    });
}

function updatePropertyInfo(propertyName, setterFn, scope) {
    let scopeInfo = getScopeInfo(scope || 0);
    eachPropertiesByName(propertyName, scope, propertyInfo => {
        setterFn(propertyInfo);
        if(!scopeInfo.updatePropertiesKey) {
            scopeInfo.updatePropertiesKey = setNextTick(() => {
                propertiesRender(scopeInfo);
                console.log(`run tick ${scopeInfo.updatePropertiesKey}`);
                scopeInfo.updatePropertiesKey = undefined;
            });
            console.log(`add tick ${scopeInfo.updatePropertiesKey}`);
        }
    });
}

//#endregion

//#region events

function onOpened(module) {
    if(isFunction(module)) {
        addEventListener("module-opened", module);
    } else {
        dispatchEvent("module-opened", module);
    }
}

function onClosed(module) {
    if(isFunction(module)) {
        addEventListener("module-closed", module);
    } else {
        dispatchEvent("module-closed", module);
    }
}

//#endregion

// 打开页面
function openPage(moduleId) {
    let moduleInfo = getCurrentModule(moduleId);
    if(!moduleInfo) {
        return;
    }

    let scopeInfo = {
        layout: moduleInfo.layout,
        properties: deepClone(moduleInfo.properties),
        actions: moduleInfo.actions,
        onOpened: moduleInfo.onOpened,
        onClosed: moduleInfo.onClosed,
        depMap: new Map()
    };
    addScopeInfo(scopeInfo);

    let elem = `
        <div id="detailContentPanel" class="content-panel content-panel-actived">
            <section class="title-panel">
                <h1>${moduleInfo.menuText}</h1>
                ${htmlCondition(v => !isEmpty(v), moduleInfo.description, html`<p>${0}</p>`)}
            </section>
            <section class="body-group">
                ${detailBodyRender(scopeInfo)}
            </section>
        </div>
        <div id="loadingElement" class="page-progress large circles">
            <span class="circle"></span>
            <span class="circle"></span>
            <span class="circle"></span>
            <span class="circle"></span>
            <span class="circle"></span>
            <span class="circle"></span>
        </div>
    `;
    replaceHtml(godDetailPanel, elem);

    bodyGroup = godDetailPanel.querySelector(".body-group");
    scopeInfo.bodyPanel = bodyGroup.querySelector(".body-panel");
    
    onOpened(scopeInfo);
}

// 关闭页面
function closePage(moduleId) {
    if(!moduleId) {
        return;
    }
    let moduleInfo = getCurrentModule(moduleId);
    if(!moduleInfo) {
        return;
    }

    onClosed(moduleInfo);

    // reset
    currentMenuId = null;
    bodyGroup = null;
    releaseScopeStack();
}

// 打开子页面
function showDetailPanel(scopeInfo, contentFn) {
    return new Promise((resolve, reject) => {
        if(isFunction(scopeInfo)) {
            contentFn = scopeInfo;
            scopeInfo = null;
        }
        if(!scopeInfo) {
            scopeInfo = {};
        }
        scopeInfo.classes = ["move-out"];
        scopeInfo.styles = ["display:none"];

        let scope = addScopeInfo(scopeInfo);
        scopeInfo.scope = scope;
    
        let html = detailBodyRender(scopeInfo);
        appendHtml(bodyGroup, html);
        let bodyPanelList = bodyGroup.querySelectorAll(".body-panel");
        if(bodyPanelList && bodyPanelList.length === getScopeStackSize()) {
            let currentScopeInfo = getScopeInfo(scope - 1);
            let currentBody = currentScopeInfo.bodyPanel;
            let nextBody = bodyPanelList[bodyPanelList.length - 1];

            scopeInfo.bodyPanel = nextBody;

            // 显示
            nextBody.style.display = "flex";
            // 更新依赖
            updateDependency(scope);

            // 动画事件
            onAnimationStart(nextBody, e => {
                if(isFunction(contentFn)) {
                    contentFn();
                }
            }, true);
            onAnimationEnd(nextBody, e => {
                try {
                    resolve(createActionContext({
                        element: null,
                        module: scopeInfo,
                        callAction: createCallAction(scopeInfo, scope)
                    }, scope));
                } catch(e) {    
                    reject(e);
                }
            }, true);
            onAnimationStart(currentBody, e => {
                currentBody.style.display = "none";
            }, true);

            // 开始动画
            requestAnimationFrame(() => {
                currentBody.classList.add("move-hide");
                // 兼容 Firefox，Firefox需要做第二帧才能将nextBody移动到右边
                requestAnimationFrame(() => {
                    nextBody.classList.remove("move-out");
                });
            });

            // 激活后退按钮
            let backAction = document.getElementById("backAction");
            if(backAction) {
                backAction.disabled = false;
            }
        }
    });
}

// 关闭子页面
function hideDetailPanel() {
    return new Promise((resolve, reject) => {
        if(getScopeStackSize() <= 1) {
            return;
        }

        let nextBody = popScopeStack().bodyPanel;
        let currentBody = peekScopeStack().bodyPanel;
        if(currentBody && nextBody) {
            // 设置动画事件
            let nextTransitionendFn = event => {
                nextBody.removeEventListener("transitionend", nextTransitionendFn);
                nextBody.remove();
                resolve();
            };
            nextBody.addEventListener("transitionend", nextTransitionendFn, false);
            currentBody.style.display = "flex";
            requestAnimationFrame(() => {
                nextBody.classList.add("move-out");
                // 兼容 Firefox，Firefox需要分两二帧
                requestAnimationFrame(() => {
                    currentBody.classList.remove("move-hide");
                });
            });

            if(getScopeStackSize() <= 1) {
                // 禁用后退按钮
                let backAction = document.getElementById("backAction");
                if(backAction) {
                    backAction.disabled = true;
                }
            }
        }
    });
}

function onMenuItemClick(dt, dl) {
    let id = dt.dataset.menuId;
    if(currentMenuId === id) {
        return;
    }
    let module = getCurrentModule(id);
    if(isEmptyModule(module)) {
        return;
    }

    let dtList = dl.getElementsByTagName("dt");
    for(let i = 0; i < dtList.length; i++) {
        let dt = dtList[i];
        if(dt.classList.contains("menu-item-selected")) {
            dt.classList.remove("menu-item-selected");
            break;
        }
    }
    closePage(currentMenuId);

    dt.classList.add("menu-item-selected");
    currentMenuId = id;
    newScopeStack();

    openPage(id);
}

function onActionClick(elem) {
    let scope = elem.dataset.scope;
    if(isEmpty(scope)) {
        return;
    }

    scope = parseInt(scope);
    let module = getScopeInfo(scope);
    if(!module || !Array.isArray(module.actions)) {
        return;
    }

    if(elem.tagName === "BUTTON") {
        let buttonIndex = elem.dataset.buttonIndex;
        let buttonInfo = module.actions[buttonIndex];
        if(buttonInfo) {
            callAction(buttonInfo, module, elem, scope);
        } else {
            console.error(`buttonIndex: ${buttonIndex} is not found.`);
        }
    }

    if(elem.tagName === "A") {
        let actionName = elem.dataset.actionName;
        if(isEmpty(actionName)) {
            console.warn("actionName is empty.");
            return;
        }
        let buttonInfo = module.actions.find(b => b.actionName === actionName);
        if(buttonInfo) {
            callAction(buttonInfo, module, elem, scope);
        } else {
            console.error(`actionName: ${actionName} is not found.`);
        }
    }
}

function initModules(moduleList, ctx) {
    modules = moduleList;
    context = ctx;
    let godMenuPanel = context.godMenuPanel;
    let godDetailPanel = context.godDetailPanel;

    function menuItemRender(menuItem, id, level) {
        let marginLeft = 8 + 16 * level;
        menuItem.id = id;
        return `
            <dt data-menu-id="${id}">
                <b></b>
                <u>
                    <i style="margin-left: ${marginLeft}px;${htmlCondition(icon => !isEmpty(icon), menuItem.icon, html`background-image:url(${0});`)}"></i><span>${menuItem.menuText}</span>
                </u>
                ${htmlCondition(Array.isArray(menuItem.subModules) && menuItem.subModules.length > 0, html`<a class="extend-button" href="javascript:void(0)"></a>`)}
            </dt>
        `;
    }

    function switchSubMenu(extendButton) {
        let subMenuElement = extendButton.parentElement.nextElementSibling;
        if(subMenuElement.classList.contains("submenu-opend")) {
            subMenuElement.classList.remove("submenu-opend");
            extendButton.classList.remove("extend-button-up");
        } else {
            subMenuElement.classList.add("submenu-opend");
            extendButton.classList.add("extend-button-up");
        }
    }

    onClosed(module => {
        if(isFunction(module.onClosed)) {
            module.onClosed(createActionContext({
                module
            }));
        }

        if(Array.isArray(module.properties)) {
            module.properties.forEach((e, i) => {
                e.value = "";
                delete e.updatePropertyElement;
            });
        }
    });
    onOpened(module => {
        if(isFunction(module.onOpened)) {
            let scope = 0;
            module.onOpened(createActionContext({
                module,
                callAction: createCallAction(module, scope)
            }, scope));
        }
    });

    const htmlBuilder = [];
    htmlBuilder.push("<dl>");
    modules.forEach((m, i) => {
        htmlBuilder.push(menuItemRender(m, i, 0));
        if(m.subModules) {
            htmlBuilder.push("<dd>", "<dl>");
            m.subModules.forEach((sub, j) => {
                htmlBuilder.push(menuItemRender(sub, (i + ":" + j), 1));
            });
            htmlBuilder.push("</dl>", "</dd>");
        }
    });
    htmlBuilder.push("</dl>");

    appendHtml(godMenuPanel, htmlBuilder.join(""));

    const dl = godMenuPanel.getElementsByTagName("dl")[0];
    context.clickProxy.on((elem, e, setBehavior) => {
        if(currentModuleDisabled) {
            return;
        }

        function done() {
            setBehavior({
                hitting: true,
                aborting: true
            });
        }

        if(elem.id === "backAction") {
            done();
            hideDetailPanel();
            return;
        }

        if(elem.id === "menuAction") {
            done();
            alert(elem.id);
            return;
        }

        if(elem.classList.contains("extend-button")) {
            done();
            switchSubMenu(elem);
            return;
        }

        if(dl && elem.tagName === "DT") {
            done();
            onMenuItemClick(elem, dl);
            return;
        }

        if(elem.tagName === 'BUTTON' || elem.tagName === "A") {
            done();
            onActionClick(elem);
            return;
        }
    });

    context.changeProxy.on((elem, e, setBehavior) => {
        if(isEmpty(elem.id)) {
            return;
        }
        
        const propertyId = parsePropertyId(elem.id);
        if(isEmpty(propertyId.scope)) {
            return;
        }
        setBehavior({
            hitting: true,
            aborting: true
        });
        const scope = propertyId.scope;
        const propertyName = propertyId.id;
        const scopeInfo = getScopeInfo(scope);
        let properties;
        if(isEditorProperty(propertyName)) {
            properties = getEditorProperties(scope);
        } else {
            properties = scopeInfo.properties;
        }
        if(properties) {
            const value = elem.value;
            for(let i = 0; i < properties.length; i++) {
                let propertyInfo = properties[i];
                if(propertyInfo.id === propertyName) {
                    switch(propertyInfo.type) {
                        case "file":
                            callAction(propertyInfo, scopeInfo, elem);
                            break;
                        case "checkbox":
                            let selectedValues = Array.isArray(propertyInfo.value) ? propertyInfo.value : [];
                            if(elem.checked) {
                                selectedValues.push(value);
                            } else {
                                selectedValues = selectedValues.filter(v => v !== value);
                            }
                            propertyInfo.value = selectedValues;
                            break;
                        default:
                            propertyInfo.value = 
                                isFunction(propertyInfo.convertor)
                                    ? propertyInfo.convertor(value, propertyInfo)
                                    : value;
                            if(Number.isNaN(propertyInfo.value)) {
                                propertyInfo.value = undefined;
                            }
                            break;
                    }
                    // 更新依赖
                    updateDependency(scope, propertyInfo);
                    return;
                }
            }
        }
    });
}

// 生成表单
function formRender(properties, scope) {
    let htmlBuilder = [];
    htmlBuilder.push('<ul class="form-list">');
    if(Array.isArray(properties)) {
        properties.forEach((p, i) => {
            htmlBuilder.push("<li>");
            htmlBuilder.push(propertyRender(p, addDependency, scope));
            htmlBuilder.push("</li>");
        });
    }
    htmlBuilder.push("</ul>");
    return htmlBuilder.join("");
}

// 生成按钮
function buttonRender(buttonList, scope) {
    let htmlBuilder = [];
    if(Array.isArray(buttonList) && buttonList.length > 0) {
        if(buttonList.length > 0) {
            buttonList.forEach((b, i) => {
                if(isEmpty(b.text)) {
                    return;
                }
                htmlBuilder.push(`<button data-button-index="${i}"${htmlCondition(v => !isEmpty(v), scope, html` data-scope="${0}"`)}>${b.text}</button>`);
            });
        }
    }
    if(htmlBuilder.length > 0) {
        return `
            <section class="button-panel">
                ${htmlBuilder.join("")}
            </section>
        `;
    }
    return "";
}

function detailBodyRender(detailOption) {
    let bodyLayout = isEmpty(detailOption.layout) ? "left-right" : detailOption.layout;
    let properties = detailOption.properties;
    let actions = detailOption.actions;
    let scope = detailOption.scope;
    let bodyClass = 
        Array.isArray(detailOption.classes) && detailOption.classes.length > 0 
            ? " " + detailOption.classes.join(" ")
            : "";
    let bodyStyle = 
        Array.isArray(detailOption.styles) && detailOption.styles.length > 0 
            ? ` style="${detailOption.styles.join(";")}"` 
            : "";
    return `
        <section class="body-panel${bodyClass}"${bodyStyle}>
            <section class="body-container ${bodyLayout}">
                ${htmlCondition(Array.isArray(properties) && properties.length > 0, formRender(properties, scope), html`<section class="form-panel">${0}</section>`)}
                <section class="result-panel"></section>
            </section>
            ${buttonRender(actions, scope)}
        </section>
    `;
} 

export {
    setModuleDisabled,
    initModules,
    onOpened,
    onClosed
};
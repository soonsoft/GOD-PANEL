import { isFunction, isEmpty, on, html, htmlCondition, appendHtml, replaceHtml } from "../common";
import { addEventListener, dispatchEvent } from "../event";

let context;
let modules = [];
let currentMenuId;
let currentModuleDisabled = false;
let depMap = null;

function setModuleDisabled(value) {
    currentModuleDisabled = value;
}

function addDependency(propertyId, depInfo) {
    if(!depMap) {
        depMap = new Map();
    }
    depMap.set(propertyId, depInfo);
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
    if(!isNaN(subIndex)) {
        module = module.subModules[subIndex];
    }
    return module;
}

function getCurrentViewModel() {
    let module = getCurrentModule();
    let model = {};
    if(Array.isArray(module.properties)) {
        module.properties.forEach((e, i) => {
            model[e.id] = e.value;
        });
    }
    return model;
}

function checkCurrentViewModel() {
    let module = getCurrentModule();
    let result = {
        valid: true,
        messages: []
    };
    if(Array.isArray(module.properties)) {
        let properties = module.properties;
        if(arguments.length > 0) {
            let idArr = Array.prototype.slice.call(arguments, 0, arguments.length);
            properties = properties.filter(p => idArr.include(p.id));
        }
        properties.forEach((p, i) => {
            if(p.required && isEmpty(p.value)) {
                if(p.type === "file") {
                    let fileInput = document.getElementById(p.id);
                    if(fileInput && fileInput.files.length === 0) {
                        fileInput.value = "";
                        result.messages.push(`${p.label || p.id}未选择文件`);
                    }
                } else {
                    if(isEmpty(p.value)) {
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

// 打开页面
function openPage(moduleId) {
    let moduleInfo = getCurrentModule(moduleId);
    if(!moduleInfo) {
        return;
    }

    let elem = `
        <div id="detailContentPanel" class="content-panel content-panel-actived">
            <section class="title-panel">
                <h1>${moduleInfo.menuText}</h1>
                ${htmlCondition(v => !isEmpty(v), moduleInfo.description, html`<p>${0}</p>`)}
            </section>
            <section class="body-panel">
                ${htmlCondition(Array.isArray(moduleInfo.properties) && moduleInfo.properties.length > 0, formRender(moduleInfo.properties), html`<section class="form-panel">${0}</section>`)}
                <section class="result-panel"></section>
            </section>
            ${buttonRender(moduleInfo.button)}
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

    onOpend(moduleInfo);
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
    depMap = null;
}

//#region events

function onOpend(module) {
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

function callAction(actionInfo, module, elem) {
    if(actionInfo && isFunction(actionInfo.action)) {
        actionInfo.action({
            element: elem,
            module,
            actionInfo,
            getCurrentViewModel,
            checkCurrentViewModel
        });
    }
}

function initModules(moduleList, ctx) {
    modules = moduleList;
    context = ctx;
    let godMenuPanel = context.godMenuPanel;
    let godDetailPanel = context.godDetailPanel;
    function menuItemRender(menuItem, id, level) {
        let marginLeft = 8 + 40 * level;
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
            module.onClosed({
                module,
                getCurrentViewModel,
                checkCurrentViewModel
            });
        }

        if(Array.isArray(module.properties)) {
            module.properties.forEach((e, i) => {
                e.value = "";
            });
        }
    });
    onOpend(module => {
        if(isFunction(module.onOpend)) {
            module.onOpend({
                module,
                godInfo: context,
                callAction: actionName => {
                    let buttonInfo = module.button.find(b => b.actionName === actionName);
                    callAction(buttonInfo, module, elem);
                },
                getCurrentViewModel,
                checkCurrentViewModel
            });
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
    if(dl) {
        // 注册事件
        on(dl, "click", e => {
            let elem = e.target;
            while(elem.tagName !== 'DT') {
                if(elem.tagName === "DL" || elem.id === "godMenuPanel") {
                    return;
                }
                if(elem.classList.contains("extend-button")) {
                    switchSubMenu(elem);
                    return;
                }
                elem = elem.parentNode;
            }

            let id = elem.dataset.menuId;
            if(currentMenuId === id) {
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

            elem.classList.add("menu-item-selected");
            currentMenuId = id;

            openPage(id);
        });
    }

    on(godDetailPanel, "click", e => {
        if(currentModuleDisabled) {
            return;
        }
        let elem = e.target;
        while(elem.tagName !== 'BUTTON' && elem.tagName !== "A") {
            if(elem.id === "godDetailPanel") {
                return;
            }
            elem = elem.parentNode;
        }

        let module = getCurrentModule();
        if(!module || !Array.isArray(module.button)) {
            return;
        }

        if(elem.tagName === "BUTTON") {
            let buttonIndex = elem.dataset.buttonIndex;
            let buttonInfo = module.button[buttonIndex];
            callAction(buttonInfo, module, elem);
        }

        if(elem.tagName === "A") {
            let actionName = elem.dataset.actionName;
            let buttonInfo = module.button.find(b => b.actionName === actionName);
            callAction(buttonInfo, module, elem);
        }
    });

    on(godDetailPanel, "change", e => {
        let elem = e.target;
        let value = elem.value;
        let propertyName = elem.dataset.propertyName;
        let module = getCurrentModule();
        if(module && module.properties) {
            for(let i = 0; i < module.properties.length; i++) {
                let propertyInfo = module.properties[i];
                if(propertyInfo.id === propertyName) {
                    switch(propertyInfo.type) {
                        case "file":
                            callAction(propertyInfo, module, elem);
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
                            break;
                    }
                    return;
                }
            }
        }
    });
}

// 生成表单
function formRender(properties) {
    function insertStar(hasStar) {
        return hasStar ? `<span class="required-star">*</span>` : "";
    }

    function selectRender(options, propertyInfo) {
        let htmlBuilder = [];
        htmlBuilder.push(`<option value="">请选择</option>`);
        propertyInfo.value = "";
        if(Array.isArray(options)) {
            options.forEach(option => {
                if(typeof option !== "object") {
                    option = { value: option }
                }
                let value = option.value;
                let text = option.text || value;
                let selected = !!option.selected;
                htmlBuilder.push(`<option value="${value}" ${selected ? "selected" : ""}>${text}</option>`);
                if(selected) {
                    propertyInfo.value = value;
                }
            });
        }
        return htmlBuilder.join("");
    }

    function checkboxRender(options, propertyInfo) {
        let htmlBuilder = [];
        if(Array.isArray(options)) {
            const selectedValues = [];
            options.forEach((option, idx) => {
                let value = option.value;
                let text = option.text || value;
                let selected = !!option.selected;
                htmlBuilder.push(`<input id="${propertyInfo.id}_${idx}" data-property-name="${propertyInfo.id}" type="checkbox" value="${value}" ${selected ? "checked" : ""}>`);
                htmlBuilder.push(`<label for="${propertyInfo.id}_${idx}" class="checkbox-text">${text}</label>`);
                if(selected) {
                    selectedValues.push(value);
                }
            });
            propertyInfo.value = selectedValues;
        }
        return htmlBuilder.join("");
    }

    let htmlBuilder = [];
    htmlBuilder.push('<ul class="form-list">');
    if(Array.isArray(properties)) {
        properties.forEach((e, i) => {
            let propertyInfo = e;
            let value = propertyInfo.value || "";
            htmlBuilder.push("<li>");
            htmlBuilder.push(`<label class="label-text">${propertyInfo.label}</label>${insertStar(propertyInfo.required)}<br>`);
            switch(propertyInfo.type) {
                case "string":
                    htmlBuilder.push(`<input id="${propertyInfo.id}" type="text" data-property-name="${propertyInfo.id}" value="${value}" />`);
                    break;
                case "text":
                    htmlBuilder.push(`<textarea id="${propertyInfo.id}" data-property-name="${propertyInfo.id}">${value}</textarea>`);
                    break;
                case "select":
                    htmlBuilder.push(`<select id="${propertyInfo.id}" data-property-name="${propertyInfo.id}">`);
                    htmlBuilder.push(selectRender(propertyInfo.options, propertyInfo));
                    htmlBuilder.push(`</select>`);
                    break;
                case "checkbox":
                    htmlBuilder.push(`<div id="${propertyInfo.id}" class="checkbox-panel">`);
                    htmlBuilder.push(checkboxRender(propertyInfo.options, propertyInfo));
                    htmlBuilder.push("</div>");
                    break;
                case "file":
                    htmlBuilder.splice(htmlBuilder.length - 1, 1, `
                        <label class="label-file">
                            <input id="${propertyInfo.id}" type="file" data-property-name="${propertyInfo.id}" value="">
                            <span>${propertyInfo.label}</span>
                        </label>
                    `);
                    break;
                default:
                    htmlBuilder.push(`<input id="${propertyInfo.id}" type="${propertyInfo.type}" data-property-name="${propertyInfo.id}" value="${value}"`);
                    ["min", "max", "step"].forEach(attr => {
                        if(!isEmpty(propertyInfo[attr])) {
                            htmlBuilder.push(` ${attr}="${propertyInfo[attr]}"`);
                        }
                    });
                    htmlBuilder.push(" />")
                    break;
            }
            htmlBuilder.push("</li>");
        });
    }
    htmlBuilder.push("</ul>");
    return htmlBuilder.join("");
}

// 生成按钮
function buttonRender(buttonList) {
    let htmlBuilder = [];
    if(Array.isArray(buttonList) && buttonList.length > 0) {
        htmlBuilder.push('<section class="button-panel">');
        buttonList.forEach((b, i) => {
            if(isEmpty(b.text)) {
                return;
            }
            htmlBuilder.push(`<button data-button-index="${i}">${b.text}</button>`);
        });
        htmlBuilder.push('</section>');
    }
    return htmlBuilder.join("");
}

export {
    setModuleDisabled,
    initModules,
    onOpend,
    onClosed,
    addDependency
};
import { isFunction, isEmpty, on, html, htmlCondition, appendHtml, replaceHtml } from "../../../src/common";
import { formRender, buttonRender } from "../../../src/ui/panel-ui";
import { addEventListener, dispatchEvent } from "../../../src/event";
import { formModule } from "./form-module";
import { loadingModule } from "./loading-module";
import { renderModule } from "./render-module";
import { aboutModule } from "./about-module";

const modules = [
    formModule,
    loadingModule,
    renderModule,
    aboutModule
];

let currentMenuId;
let currentModuleDisabled = false;

function setModuleDisabled(value) {
    currentModuleDisabled = value;
}

function getCurrentModule(id) {
    if(!id) {
        id = currentMenuId;
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

function initModules(godMenuPanel, godDetailPanel, godInfo) {
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
                godInfo,
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
                godInfo,
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

export {
    setModuleDisabled,
    initModules,
    onOpend,
    onClosed
};
import { html, htmlCondition, isEmpty } from "../../common";
import { createPropertyId } from "../module-scope";

/**
 * 将属性对应生成为组件
 * @param {*} propertyInfo 属性信息
 */
export function propertyRender(propertyInfo, depMap, scope) {
    function insertStar(hasStar) {
        return hasStar ? `<span class="required-star">*</span>` : "";
    }

    function selectRender(options, propertyInfo) {
        let htmlBuilder = [`<option value="">请选择</option>`];
        let selectValue = propertyInfo.value;
        propertyInfo.value = "";
        if(Array.isArray(options)) {
            let optionGroup = {};
            options.forEach(option => {
                if(selectValue) {
                    if(option.value === selectValue) {
                        option.selected = true;
                    } else {
                        option.selected = false;
                    }
                }
                let group = option.group || "NONE";
                let groupItem = optionGroup[group];
                if(!groupItem) {
                    groupItem = {
                        label: group,
                        options: []
                    };
                    optionGroup[group] = groupItem;
                }
                groupItem.options.push(option);
            });
            Object.keys(optionGroup).forEach(key => {
                let groupItem = optionGroup[key];
                const isGroup = groupItem.label !== "NONE";
                if(isGroup) {
                    htmlBuilder.push(`<optgroup label=${groupItem.label}>`);
                }
                groupItem.options.forEach(option => {
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
                if(isGroup) {
                    htmlBuilder.push(`</optgroup>`);
                }
            });
        }
        return htmlBuilder.join("");
    }

    function groupItemRender(options, propertyInfo, propertyId) {
        let htmlBuilder = [];
        if(Array.isArray(options)) {
            let selectedValue = propertyInfo.type === "checkbox" ? [] : "";
            options.forEach((option, idx) => {
                let id = `${propertyId}::${idx}`;
                let value = option.value;
                let text = option.text || value;
                let selected = !!option.selected;
                htmlBuilder.push(`<input id="${id}" type="${propertyInfo.type}" ${htmlCondition(propertyInfo.type === 'radio', propertyId, html`name="${0}"`)} value="${value}" ${selected ? "checked" : ""}>`);
                htmlBuilder.push(`<label for="${id}" class="checkbox-text">${text}</label>`);
                if(selected) {
                    if(propertyInfo.type === "checkbox") {
                        selectedValue.push(value);
                    } else {
                        selectedValue = value;
                    }
                }
            });
            propertyInfo.value = selectedValue;
        }
        return htmlBuilder.join("");
    }

    if(isEmpty(propertyInfo.type)) {
        return "";
    }

    let htmlBuilder = [];
    let value = propertyInfo.value || "";
    let propertyId = createPropertyId(scope, propertyInfo.id);
    // propertyInfo.id = propertyId;
    htmlBuilder.push(`<label class="label-text">${propertyInfo.label || propertyId}</label>${insertStar(propertyInfo.required)}<br>`);
    switch(propertyInfo.type) {
        case "string":
            htmlBuilder.push(`<input id="${propertyId}" type="text" value="${value}" />`);
            break;
        case "text":
            htmlBuilder.push(`<textarea id="${propertyId}">${value}</textarea>`);
            break;
        case "select":
            if(propertyInfo.optionsDep) {
                Object.keys(propertyInfo.optionsDep).forEach(k => {
                    addDependency(k, {
                        depFn: propertyInfo.optionsDep[k],
                        destinationProperyInfo: propertyInfo,
                        selectRender
                    });
                });
                options = [];
            }
            htmlBuilder.push(`<select id="${propertyId}">`);
            htmlBuilder.push(selectRender(propertyInfo.options, propertyInfo));
            htmlBuilder.push(`</select>`);
            break;
        case "checkbox":
        case "radio":
            htmlBuilder.push(`<div id="${propertyId}" class="checkbox-panel">`);
            htmlBuilder.push(groupItemRender(propertyInfo.options, propertyInfo, propertyId));
            htmlBuilder.push("</div>");
            propertyInfo.updatePropertyElement = value => {
                if(isEmpty(value)) {
                    value = [];
                }
                value = Array.isArray(value) ? value : [value];
                let elem = document.getElementById(propertyId);
                if(elem) {
                    let checkboxes = elem.querySelectorAll("input[type=checkbox], input[type=radio]");
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = value.includes(checkbox.value);
                    });
                }
            };
            break;
        case "file":
            htmlBuilder.splice(htmlBuilder.length - 1, 1, `
                <label class="label-file">
                    <input id="${propertyId}" type="file" value="">
                    <span>${propertyInfo.label}</span>
                </label>
            `);
            // file 无法通过 value 设置
            propertyInfo.updatePropertyElement = value => {};
            break;
        case "hidden":
            htmlBuilder.splice(htmlBuilder.length - 1, 1, `
                <input id="${propertyId}" type="hidden" value="${value}" />
            `);
            break;
        case "color":
            if(isEmpty(value)) {
                value = "#0066ff";
                propertyInfo.value = value;
            }
            htmlBuilder.push(`<input id="${propertyId}" type="color" value="${value}" />`);
            break;
        default:
            htmlBuilder.push(`<input id="${propertyId}" type="${propertyInfo.type}" value="${value}"`);
            ["min", "max", "step"].forEach(attr => {
                if(!isEmpty(propertyInfo[attr])) {
                    htmlBuilder.push(` ${attr}="${propertyInfo[attr]}"`);
                }
            });
            htmlBuilder.push(" />")
            break;
    }
    if(!propertyInfo.updatePropertyElement) {
        propertyInfo.updatePropertyElement = value => {
            let elem = document.getElementById(propertyId);
            if(elem) {
                elem.value = value;
            }
        };
    }
    return htmlBuilder.join("");
}
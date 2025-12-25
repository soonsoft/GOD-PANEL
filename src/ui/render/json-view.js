import { html, htmlCondition, isEmpty, isFunction } from "../../common";
import { resultRender } from "../module-scope";

/**
 * JSON 视图
 * @param {*} data 
 * @param {*} formatter 
 */
export function jsonRender(data, formatter) {
    if(data instanceof Error) {
        data = data.message;
    }

    function createItem(name, value, customHtml) {
        let hasName = !isEmpty(name);
        let arr = customHtml;
        if(!Array.isArray(arr)) {
            arr = [];
        }
        if(!isEmpty(value)) {
            arr.splice(0, 0, value);
        }
        let htmlArr = [];
        let colorClass = "";
        arr.forEach((e, i) => {
            colorClass = i === 0 ? "primary-color" : "";
            if(!hasName && i === 0) {
                htmlArr.push(`<span class="primary-color">${e}</span>`);
            } else {
                htmlArr.push(`<span class="before ${colorClass}">${e}</span>`);
            }
        });
        customHtml = htmlArr.join("");
        return `
            <div class="result-item">
                ${htmlCondition(!isEmpty(name), name, html`<label>${0}</label>`)}
                ${customHtml}
            </div>
        `;
    }   

    function createArrayitem(elem, index, formatterFn) {
        let customHtml = "";
        if(isFunction(formatterFn)) {
            customHtml = formatterFn(elem);
        }
        let ab = [];
        if(index === 0) {
            ab.push('<div class="result-item-group">');
        }
        ab.push(createItem((index + 1), (typeof elem === "string" ? elem : elem.name), customHtml));
        if(index === elem.len - 1) {
            ab.push('</div>');
        }
        return ab.join("");
    }

    function createMarks(level) {
        let h = [];
        for(let i = 0; i < level; i++) {
            h.push('<b class="result-title-marker"></b>');
        }
        return h.join("");
    }

    let htmlBuilder = [];
    let stack = [];
    stack.push({ name: null, value: data, level: 0, begin: 1, end: 1 });
    while(stack.length > 0) {
        let item = stack.pop();
        if(item.level > 0 && item.name) {
            htmlBuilder.push(`
                <div class="result-title">
                    ${createMarks(item.level)}<span>${item.name}</span>
                </div>
            `);
        }

        if(item.begin) {
            htmlBuilder.push('<div class="result-content">');
        }

        if(item.arrayElem) {
            htmlBuilder.push(createArrayitem(item.value, item.index, item.formatter));
        } else if(typeof item.value === "object" && item.value) {
            if(Array.isArray(item.value)) {
                let temp = [];
                let formatterFn = formatter ? formatter[item.name] : undefined;
                let len = item.value.length;
                for(let i = 0; i < len; i++) {
                    let elem = item.value[i];
                    if(elem) {
                        temp.push({
                            arrayElem: 1,
                            formatter: formatterFn,
                            index: i,
                            len: len,
                            value: elem,
                            level: item.level + 1,
                            begin: 0,
                            end: 0
                        });
                    }
                }
                if(temp.length > 0) {
                    temp[temp.length - 1].end += item.end;
                    item.end = 0;
                    temp.reverse().forEach(e => stack.push(e));
                }
            } else {
                let keys = Object.keys(item.value);
                let temp = [];
                let valProps = [];
                for(let i = 0; i < keys.length; i++) {
                    let subItem = item.value[keys[i]];
                    let type = typeof subItem;
                    if(type === "object" && subItem) {
                        temp.push({
                            name: keys[i],
                            value: (Array.isArray(subItem) && subItem.length === 0) ? "[]" : subItem,
                            level: item.level + 1,
                            begin: 1,
                            end: 1
                        });
                    } else {
                        valProps.push(createItem(keys[i], subItem + ""));
                    }
                }
                if(valProps.length > 0) {
                    htmlBuilder.push('<div class="result-item-group">');
                    valProps.forEach(e => htmlBuilder.push(e));
                    htmlBuilder.push("</div>");
                }
                if(temp.length > 0) {
                    temp[temp.length - 1].end += item.end;
                    item.end = 0;
                    temp.reverse().forEach(i => stack.push(i));
                }
            }
        } else {
            htmlBuilder.push('<div class="result-item-group">');
            htmlBuilder.push(createItem("", item.value + ""));
            htmlBuilder.push("</div>");              
        }

        for(let i = 0; i < item.end; i++) {
            htmlBuilder.push('</div>');
        }
    }

    resultRender(htmlBuilder.join(""));
}
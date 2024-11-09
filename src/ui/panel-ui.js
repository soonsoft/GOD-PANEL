import { generateId, html, htmlCondition, isEmpty, isFunction, replaceHtml } from "../common";

function resultRender(html) {
    let resultPanel = godDetailPanel.querySelector(".result-panel");
    if(!resultPanel) {
        return;
    }

    replaceHtml(resultPanel, html);
}

// Json 结果集展示
function jsonRender(data, formatter) {
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

// 表格展示
function tableRender(columns, data, renderFn) {
    if(arguments.length === 1) {
        data = columns;
        columns = null;
    }

    if(isFunction(data)) {
        renderFn = data;
        data = columns;
        columns = null;
    }

    if(!Array.isArray(data)) {
        data = [];
    }

    if(!columns) {
        columns = [];
        let firstRow = data[0];
        if(typeof firstRow === "object" && !isEmpty(firstRow)) {
            Object.keys(firstRow).forEach(k => columns.push({ column: k }));
        }
    }

    if(!isFunction(renderFn)) {
        renderFn = resultRender;
    }

    function formatValue(column, row, val, rowIndex, colIndex) {
        return isFunction(column.formatter) 
                ? column.formatter(val, { row: row, column: column, rowIndex: rowIndex, colIndex: colIndex}) 
                : val;
    }

    function formatColumn(column, val, colIndex) {
        return isFunction(val) ? val(column, colIndex) : val;
    }

    function getValue(row, column) {
        if(!column || !row) {
            return "";
        }
        let arr = column.split(".");
        let value = row;
        for(let i = 0; i < arr.length; i++) {
            let col = arr[i].trim();
            if(!col) {
                continue;
            }
            value = value[col];
        }
        return value;
    }

    function colgroup(columns) {
        const htmlBuilder = [];
        if(Array.isArray(columns) && columns.length > 0) {
            htmlBuilder.push("<colgroup>");
            columns.forEach(col => {
                htmlBuilder.push(`<col ${htmlCondition(v => typeof(v.width) === "number", col, html`style="width:${'width'}px"`)}>`);
            });
            htmlBuilder.push("</colgroup>");
        }
        return htmlBuilder.join("");
    }

    function thead(columns) {
        const htmlBuilder = [];
        if(Array.isArray(columns) && columns.length > 0) {
            htmlBuilder.push("<thead>");
            htmlBuilder.push("<tr>");
            columns.forEach((col, i) => {
                htmlBuilder.push(`
                    <th class="table-view-th" ${htmlCondition(col.align, col, html`style="text-align:${'align'}"`)}>
                        ${formatColumn(col, (col.text || col.column), i)}
                    </th>
                `);
            });
            htmlBuilder.push("</tr>");
            htmlBuilder.push("</thead>");
        }
        return htmlBuilder.join("");
    }

    function tbody(columns, data) {
        const htmlBuilder = [];
        if(Array.isArray(data) && data.length > 0) {
            htmlBuilder.push("<tbody>");
            for(let i = 0; i < data.length; i++) {
                let row = data[i];
                let isLastRow = i === data.length - 1;
                htmlBuilder.push('<tr class="table-view-row">');
                if(typeof row === "object") {
                    for(let j = 0; j < columns.length; j++) {
                        let col = columns[j];
                        htmlBuilder.push(`
                            <td class="table-view-td" ${htmlCondition(col.align, col, html`style="text-align:${'align'}"`)}>
                                ${formatValue(col, row, getValue(row, col.column), i, j)}
                            </td>
                        `);
                    }
                } else {
                    htmlBuilder.push(`<td class="table-view-td">${row}</td>`);
                }
                htmlBuilder.push("</tr>");
            }
            
            htmlBuilder.push("</tbody>");
        }
        return htmlBuilder.join("");
    }

    renderFn(`
        <div class="result-content-panel result-content-border">
            <table class="table-view" cellspacing="0" cellpadding="0">
                ${colgroup(columns)}
                ${thead(columns)}
                ${tbody(columns, data)}
            </table>
        </div>
    `);
}

// 图片展示
function imageRender() {
    if(arguments.length === 0) {
        return;
    }

    let imageArgIndex = 0;
    let options = arguments[0];
    if(typeof options === "object" && !(options instanceof Blob) && !(options instanceof ArrayBuffer)) {
        if(options instanceof Blob) {
            imageArgIndex++;
            options = {
                type: "blob"
            };
        } else if(options instanceof ArrayBuffer) {
            imageArgIndex++;
            options = {
                type: "arrayBuffer"
            };
        } else {
            options.type = isEmpty(options.type) ? "url" : options.type;
        }
    } else {
        options = {
            type: "url"
        }
    }

    let argArray = Array.prototype.slice.call(arguments, imageArgIndex, arguments.length);
    let afterTasks = [];
    let htmlBuilder = [];
    for(let i = 0; i < argArray.length; i++) {
        let arg = argArray[i];
        if(isEmpty(arg)) {
            continue;
        }
        htmlBuilder.push(`<div class="result-content-panel">`);
        if(options.type === "url") {
            htmlBuilder.push(`<img class="image-view" src="${arg}">`);
        } else if(options.type === "base64") {
            let mime, data;
            if(typeof arg === "string") {
                mime = options.mime;
                data = arg;
            } else {
                mime = arg.mime || options.mime;
                data = arg.data;
            }
            htmlBuilder.push(`<img class="image-view" src="data:${mime};base64,${data}" >`);
        } else {
            let imageId = "imageview::" + generateId() + "::" + (i + 1);
            let imgBlob = arg;
            if(options.type === "arrayBuffer") {
                imgBlob = new Blob(arg);
            }
            htmlBuilder.push(`<img id=${imageId} class="image-view">`);
            afterTasks.push(() => {
                let img = document.getElementById(imageId);
                if(img) {
                    img.src = URL.createObjectURL(imgBlob);
                }
            });
        }
        htmlBuilder.push("</div>");
    }

    resultRender(htmlBuilder.join(""));
    afterTasks.forEach(fn => fn());
}

// 生成表单
function formRender(properties) {
    function insertStar(hasStar) {
        return hasStar ? `<span class="required-star">*</span>` : "";
    }

    let htmlBuilder = [];
    htmlBuilder.push('<ul class="form-list">');
    if(Array.isArray(properties)) {
        properties.forEach((e, i) => {
            let value = e.value || "";
            htmlBuilder.push("<li>");
            htmlBuilder.push(`<label class="label-text">${e.label}</label>${insertStar(e.required)}<br>`);
            switch(e.type) {
                case "string":
                    htmlBuilder.push(`<input id="${e.id}" type="text" data-property-name="${e.id}" value="${value}" />`);
                    break;
                case "text":
                    htmlBuilder.push(`<textarea id="${e.id}" data-property-name="${e.id}"></textarea>`);
                    break;
                case "select":
                    htmlBuilder.push(`<select id="${e.id}" data-property-name="${e.id}">`);
                    htmlBuilder.push(`<option value="">请选择</option>`);
                    if(Array.isArray(e.options)) {
                        e.options.forEach(option => {
                            if(typeof option !== "object") {
                                option = { value: option }
                            }
                            let value = option.value;
                            let text = option.text || value;
                            let selected = !!option.selected;
                            htmlBuilder.push(`<option value="${value}" ${selected ? "selected" : ""}>${text}</option>`);
                            if(selected) {
                                e.value = value;
                            }
                        });
                    }
                    htmlBuilder.push(`</select>`);
                    break;
                case "checkbox":
                    if(Array.isArray(e.options)) {
                        const selectedValues = [];
                        e.options.forEach((option, idx) => {
                            let value = option.value;
                            let text = option.text || value;
                            let selected = !!option.selected;
                            htmlBuilder.push(`<input id="${e.id}_${idx}" data-property-name="${e.id}" type="checkbox" value="${value}" ${selected ? "checked" : ""}>`);
                            htmlBuilder.push(`<label for="${e.id}_${idx}" class="checkbox-text">${text}</label><br>`);
                            if(selected) {
                                selectedValues.push(value);
                            }
                        });
                        e.value = selectedValues;
                    }
                    break;
                case "file":
                    htmlBuilder.splice(htmlBuilder.length - 1, 1, `
                        <label class="label-file">
                            <input id="${e.id}" type="file" data-property-name="${e.id}" value="">
                            <span>${e.label}</span>
                        </label>
                    `);
                    break;
                default:
                    htmlBuilder.push(`<input id="${e.id}" type="${e.type}" data-property-name="${e.id}" value="${value}"`);
                    ["min", "max", "step"].forEach(attr => {
                        if(!isEmpty(e[attr])) {
                            htmlBuilder.push(` ${attr}="${e[attr]}"`);
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
    jsonRender,
    tableRender,
    imageRender,
    formRender,
    buttonRender
};
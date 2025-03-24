;(function() {
    const IdSymbol = Symbol("Id");

    // {{resources}} //

    const godInfo = {
        version: "1.0.0",
        http: {
            host: "",
            carryCookie: true
        },
        ui: {
            onClosed: module => {
                if(isFunction(module)) {
                    godInfo.addEventListener("closed", module);
                } else {
                    godInfo.dispatchEvent("closed", module);
                }
            },
            onOpend: module => {
                if(isFunction(module)) {
                    godInfo.addEventListener("opend", module);
                } else {
                    godInfo.dispatchEvent("opend", module);
                }
            }
        },
        events: {},
        addEventListener: (name, fn) => {
            if(!isFunction(fn)) {
                return;
            }
            let callbackArr = godInfo.events[name];
            if(!callbackArr) {
                callbackArr = [];
                godInfo.events[name] = callbackArr;
            }
            for(let i = 0; i < callbackArr.length; i++) {
                if(callbackArr[i] === fn) {
                    return;
                }
            }
            callbackArr.push(fn);
        },
        dispatchEvent: (name, obj) => {
            if(isEmpty(name)) {
                return;
            }
            const callbackArr = godInfo.events[name];
            if(Array.isArray(callbackArr)) {
                callbackArr.forEach(fn => fn(obj));
            }
        },
        modules: [],
        registerModule: (module) => {
            this.modules.push(module);
        }
    };

    // {{modules}} //

    //#region Dom

    function loadJS(src, callback) {
        const script = document.createElement("script");
        script.onload = callback;
        script.src = src;
        document.body.appendChild(script);
    }

    function ready(fn, immediate) {
        let doReady = () => {
            if(isFunction(fn)) {
                fn();
            } else if(Array.isArray(fn)) {
                fn.forEach(i => {
                    if(isFunction(i)) {
                        i();
                    }
                });
            }
        };
        if(immediate) {
            doReady();
        } else {
            on("DOMContentLoaded", doReady);
        }
    }

    function getCookie(cookieName) {
        function parseCookieValue(s) {
            if (s.indexOf('"') === 0) {
                // This is a quoted cookie as according to RFC2068, unescape...
                s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            }
            try {
                //处理加号
                return decodeURIComponent(s.replace(/\+/g, ' '));
            } catch (e) {
                return s;
            }
        }

        let pairs = String(document.cookie).split(/; */);
        for(let i = 0; i < pairs.length; i++) {
            let pair = pairs[i];
            let index = pair.indexOf('=');
            if (index === -1) {
                continue;
            }
            let key = pair.substring(0, index).trim();
            if(key === cookieName) {
                let val = pair.substring(++index, pair.length).trim();
                return parseCookieValue(val)
            }
        }
        return null;
    }

    function isFunction(e) {
        return typeof e === "function";
    }

    function isEmpty(val) {
        let type = typeof val;
        return type === "undefined" || (type === "string" && val.length === 0) || val === null;
    }

    function on(element, eventName, eventFn) {
        if(isFunction(eventName)) {
            eventFn = eventName;
        }
        if(typeof element === "string") {
            eventName = element;
            element = null;
        }
        if(!element) {
            element = document;
        }
        element.addEventListener(eventName, eventFn, false);
    }

    function off(element, eventName, eventFn) {
        if(isFunction(eventName)) {
            eventFn = eventName;
        }
        if(typeof element === "string") {
            eventName = element;
            element = null;
        }
        if(!element) {
            element = document;
        }
        element.removeEventListener(eventName, eventFn);
    }

    function appendHtml(elem, html) {
        if(typeof elem === "string") {
            html = elem;
            elem = document.body;
        }

        // beforebegin - 元素自身前面，
        // afterend - 元素自身后面，
        // afterbegin - 元素内部第一个元素前面，
        // beforeend - 元素内部最后一个子节点后面
        elem.insertAdjacentHTML("beforeend", html);
    }

    function replaceHtml(elem, html) {
        elem.replaceChildren([])
        appendHtml(elem, html);
    }

    function html(strings, ...keys) {
        return (...values) => {
            const result = [strings[0]];
            const dict = values[values.length - 1] || {};
            for(let i = 0; i < keys.length; i++) {
                let key = keys[i];
                let value = Number.isInteger(key) ? values[key] : dict[key];
                result.push(value, strings[i + 1]);
            }
            return result.join("");
        };
    }

    function htmlCondition(predicate, val, fn) {
        if(isFunction(predicate)) {
            if(predicate(val)) {
                return isFunction(fn) ? fn(val) : fn;
            }
        } else {
            if(!!predicate) {
                return isFunction(val) ? val() : fn(val);
            }
        }
        return "";
    }

    function nextTick(fn) {
        return setTimeout(fn);
    }

    function generateId() {
        if(!godInfo[IdSymbol]) {
            godInfo[IdSymbol] = 0;
        }
        godInfo[IdSymbol]++;
        return godInfo[IdSymbol];
    }

    function saveAs(blob, filename) {
        let alink = document.createElement("a");
        alink.style = "margin-left: -100px";
        document.body.appendChild(alink);
        alink.download = filename || "download-file.unknown";
        alink.href = URL.createObjectURL(blob);
        alink.click();
        document.body.removeChild(alink);
    }

    //#endregion

    //#region Http Request

    // {{http}} //

    //#endregion

    //#region UI

    function initUI() {
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

        godInfo.ui.jsonRender = jsonRender;
        godInfo.ui.formRender = formRender;
        godInfo.ui.buttonRender = buttonRender;
        godInfo.ui.tableRender = tableRender;
        godInfo.ui.imageRender = imageRender;

    }

    function initModules(godMenuPanel, godDetailPanel, modules) {
        function getCurrentModule(id) {
            if(!id) {
                id = godInfo.currentMenuId;
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
                        ${htmlCondition(Array.isArray(moduleInfo.properties) && moduleInfo.properties.length > 0, godInfo.ui.formRender(moduleInfo.properties), html`<section class="form-panel">${0}</section>`)}
                        <section class="result-panel"></section>
                    </section>
                    ${godInfo.ui.buttonRender(moduleInfo.button)}
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

            godInfo.ui.onOpend(moduleInfo);
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

            godInfo.loading = false;
            godInfo.ui.onClosed(moduleInfo);
        }

        function callAction(actionInfo, module, elem) {
            if(actionInfo && isFunction(actionInfo.action)) {
                actionInfo.action({
                    element: elem,
                    module,
                    actionInfo,
                    getCurrentViewModel,
                    checkCurrentViewModel,
                    jsonRender: godInfo.ui.jsonRender,
                    tableRender: godInfo.ui.tableRender,
                    imageRender: godInfo.ui.imageRender
                });
            }
        }

        // 生成菜单
        (function() {
            godInfo.ui.onClosed(module => {
                if(isFunction(module.onClosed)) {
                    module.onClosed(module);
                }

                if(Array.isArray(module.properties)) {
                    module.properties.forEach((e, i) => {
                        e.value = "";
                    });
                }
            });
            godInfo.ui.onOpend(module => {
                if(isFunction(module.onOpend)) {
                    module.onOpend({
                        module,
                        callAction: actionName => {
                            let buttonInfo = module.button.find(b => b.actionName === actionName);
                            callAction(buttonInfo, module, elem);
                        },
                        getCurrentViewModel,
                        checkCurrentViewModel,
                        jsonRender: godInfo.ui.jsonRender,
                        tableRender: godInfo.ui.tableRender,
                        imageRender: godInfo.ui.imageRender
                    });
                }
            });

            function menuItemRender(menuItem, id, level) {
                let marginLeft = 8 + 24 * level;
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
                on(dl, "click", e => {
                    if(godInfo.requestStart) {
                        return;
                    }
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
                    if(godInfo.currentMenuId === id) {
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
                    closePage(godInfo.currentMenuId);

                    elem.classList.add("menu-item-selected");
                    godInfo.currentMenuId = id;

                    openPage(id);
                });
            }
        })();

        // 注册事件
        (function() {
            on(godDetailPanel, "click", e => {
                if(godInfo.loading) {
                    return;
                }
                let elem = e.target;
                while(elem.tagName !== 'BUTTON' && elem.tagName !== "A") {
                    if(elem.id === "godDetailPanel") {
                        return;
                    }
                    elem = elem.parentElement;
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
        })();
    }
    
    function insertStyle() {
        const style = document.createElement("style");
        style.rel = "stylesheet";
        // {{css-style}} //
        document.getElementsByTagName("head").item(0).appendChild(style);
    }

    function insertGodPanel() {
        godInfo.app = document.getElementById("app");
        let appDisplayValue = "block";
        if(godInfo.app) {
            godInfo.app.classList.add("app-default");
            appDisplayValue = godInfo.app.style.display;
        }

        const template = `
            <div id="godPanel" class="god-panel-default">
                <div id="godBackground"></div>
                <div id="godContentPanel">
                    <div id="godPanelHeader">
                        <button id="closeButton"></button>
                        <span class="god-text">I AM THE GOD PANEL</span>
                    </div>
                    <div id="godPanelContainer">
                        <div id="godMenuPanel"></div>
                        <div id="godDetailPanel">
                            <div class="content-panel" style="justify-content:center">
                                <h1 class="primary-color" style="text-align:center;">Welcome to the God Panel</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <a id="godHandle" class="god-handle-default"></a>
        `;

        appendHtml(template);

        godInfo.godBackground = document.getElementById("godBackground");
        godInfo.godContentPanel = document.getElementById("godContentPanel");

        let loadingValue = 0;
        let loadingTimeout = null;
        Object.defineProperty(godInfo, "loading", {
            configurable: true,
            enumerable: true,
            get: () => {
                return loadingValue > 0;
            },
            set: val => {
                if(!!val) {
                    loadingValue++;
                    if(loadingValue === 1) {
                        loadingTimeout = setTimeout(() => {
                            loadingTimeout = null;
                            document.getElementById("loadingElement")?.classList.add("loading-show");
                            document.getElementById("detailContentPanel")?.classList.add("content-panel-disabled");
                        }, 1000);
                    }
                } else {
                    if(loadingValue > 0) {
                        loadingValue--;
                        if(loadingValue === 0) {
                            if(loadingTimeout) {
                                clearTimeout(loadingTimeout);
                                loadingTimeout = null;
                            }
                            document.getElementById("loadingElement")?.classList.remove("loading-show");
                            document.getElementById("detailContentPanel")?.classList.remove("content-panel-disabled");
                        }
                    }
                }
            }
        });

        godInfo.godMenuPanel = document.getElementById("godMenuPanel");
        godInfo.godDetailPanel = document.getElementById("godDetailPanel");
        initModules(godInfo.godMenuPanel, godInfo.godDetailPanel, godInfo.modules);

        const godPanel = document.getElementById("godPanel");
        const godHandle = document.getElementById("godHandle");

        function godPanelShow() {
            godPanel.classList.add("god-panel-show");
            godHandle.classList.remove("god-handle-show");
            if(godInfo.app) {
                godInfo.app.classList.add("app-hide");
            }
        }

        function godPanelHide() {
            godPanel.classList.remove("god-panel-show");
            godHandle.classList.add("god-handle-show");
            if(godInfo.app) {
                setTimeout(() => {
                    godInfo.app.classList.remove("app-hide");
                }, 320);
            }
        }

        if(godPanel && godHandle) {
            // transitionend, transitionstart, transitioncancel
            on(godPanel, "transitionstart", event => {
                if(!godPanel.classList.contains("god-panel-show")) {
                    if(godInfo.app) {
                        godInfo.app.style.display = appDisplayValue;
                    }
                }
            });
            on(godPanel, "transitionend", event => {
                if(godPanel.classList.contains("god-panel-show")) {
                    if(godInfo.app) {
                        godInfo.app.style.display = "none";
                    }
                }
            });
            setTimeout(() => godPanelShow());

            on(godHandle, "click", e => godPanelShow());

            const closeButton = document.getElementById("closeButton");
            if(closeButton) {
                on(closeButton, "click", e => godPanelHide());
            }
        }

        //#endregion
    }

    ready(() => {
        initUI();
        insertStyle();
        insertGodPanel();
    }, !!document.body);

})();

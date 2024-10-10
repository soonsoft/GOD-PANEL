;(function() {

    const contentType = {
        json: "application/json",
        file: "multipart/form-data",
        form: "application/x-www-form-urlencoded"
    };
    const godInfo = {
        theme: {
            primaryColor: "rgb(44, 108, 128)",
            fontColor: "#000000",
            panelColor: "rgba(255, 255, 255, .4)",
            panelFontColor: "#000000",
            panelBorderColor: "#000000",
            menuItemIconBgColor: "rgba(255, 255, 255, .5)",
            menuItemHoverColor: "rgba(255, 255, 255, .2)",
            menuItemSelectedColor: "rgba(255, 255, 255, .4)",
            buttonBgColor: "rgba(255, 255, 255, 1)",
            buttonActiveBgColor: "#000000",
            starColor: "#cf0842",
            basicBgColor: "#ffffff",
            basicFtColor: "#000000"
        },
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
                callbackArr.forEach(fn => fn.call(godInfo, obj));
            }
        }
    };

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

    function htmlNonNull(val, fn) {
        if(isEmpty(val)) {
            return "";
        }
        return fn(val);
    }

    function htmlCondition(predicate, val, fn) {
        if(isFunction(predicate) && predicate(val)) {
            if(isFunction(fn)) {
                fn(val);
            } else {
                return fn;
            }
        } else {
            if(!!predicate) {
                return isFunction(val) ? val() : fn(val);
            }
        }
        return "";
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

    function getContentDisposition(header) {
        let content = header.get("Content-Disposition");
        content = content ? content : "";
        let parts = content ? content.split(";") : [];
        let result = {
            value: ""
        };
        for(let i = 0; i < parts.length; i++) {
            let part = parts[i];
            if(part) {
                part = part.trim();
            }
            if(part.indexOf("=") > -1) {
                let arr = part.split("=");
                result[arr[0].trim()] = ecodeURIComponent(arr[1].trim());
            } else {
                result.value = part;
            }
        }
        return result;
    }

    async function httpUpload(url, data) {
        return await httpPost(url, data, {
            requestDataType: "file"
        });
    }

    async function httpDownload(url, data, filename, method) {
        let resp;
        const options = {
            responseDataType: "file"
        };
        if(method === "GET") {
            resp = await httpGet(url, data, options);
        } else {
            resp = await httpPost(url, data, options);
        }
        if(resp.ok) {
            if(isEmpty(filename)) {
                filename = getContentDisposition(resp.headers)?.filename;
            }
            let b = await resp.blob();
            if(b.type === "application/json") {
                let text = await b.text();
                try {
                    let json = JSON.parse(text);
                    throw json;
                } catch(e) {
                    throw e;
                }
            }

            saveAs(blob, filename);
        } else {
            throw {
                code: "Http 请求出错了",
                status: resp.status,
                statusText: resp.statusText,
                message: resp.text()
            }
        }
    }

    async function httpDownloadByGet(url, data, filename) {
        return await httpDownload(url, data, filename, "GET");
    }

    async function httpGet(url, data, options) {
        return await httpRequest(url, "GET", data, options);
    }

    async function httpPost(url, data, options) {
        return await httpRequest(url, "POST", data, options);
    }

    /**
     * 数据请求
     * @param {*} url 
     * @param {*} method GET / POST
     * @param {*} data ArrayBuffer / ArrayBufferView(Unit8Array等) / Blob / string / URLSearchParams / FormData
     * @param {*} options 请求配置
     * @returns 
     */
    async function httpRequest(url, method, data, options) {
        if(!data) {
            data = {};
        }
        if(!options) {
            options = {};
        }

        method = method || "POST";
        const hasRequestBody = !(/^(?:GET|HEAD)$/.test(method));

        let requestDataType = options.requestDataType || "json";
        let responseDataType = options.responseDataType || "json";
        delete options.requestDataType;
        delete options.responseDataType;

        if(data instanceof ArrayBuffer || data instanceof Blob) {
            requestDataType = "file";
        }
        if(data instanceof FormData) {
            requestDataType = "form";
            if(data.files && data.files.length > 0) {
                requestDataType = "file";
            }
        }

        function initHeader() {
            const defaultHeaders = {};
            if(hasRequestBody && requestDataType === "json") {
                defaultHeaders["Content-Type"] = contentType[requestDataType];
            }
            if(isFunction(godInfo.http.setDefaultHeaders)) {
                godInfo.http.setDefaultHeaders(defaultHeaders);
            }
            return defaultHeaders;
        }

        function initBody() {
            if(hasRequestBody) {
                if(data instanceof URLSearchParams) {
                    return undefined;
                }
                if(data instanceof ArrayBuffer || data instanceof Blob || data instanceof FormData) {
                    return data;
                } else if(typeof data === "string") {
                    return data;
                } else {
                    return JSON.stringify(data);
                }
            }
        }

        let fetchInit = Object.assign({
            method: method,
            headers: initHeader()
        }, options);
        if(godInfo.http.carryCookie) {
            fetchInit.credentials = "include";
        }
        fetchInit.body = initBody();

        let urlParams = data;
        if(!hasRequestBody) {
            let timestamp = (new Date()).getTime();
            if(data instanceof URLSearchParams) {
                urlParams.append("_t", timestamp);
            } else {
                data["_t"] = timestamp;
                urlParams = new URLSearchParams(data);
            }
        }
        if(urlParams instanceof URLSearchParams) {
            let queryString = urlParams.toString();
            let appendChar = /\?/.test(url) ? "&" : "?";
            url += appendChar + queryString;
        }

        let response = null;
        try {
            godInfo.loading = true;
            response = await fetch(url, fetchInit);
        } catch(e) {
            throw e;
        } finally {
            godInfo.loading = false;
        }

        if(responseDataType === "file") {
            return response;
        }

        if(response.ok) {
            if(responseDataType === "json") {
                return await response.json();
            } else if(requestDataType === "text") {
                return await response.text();
            } else {
                return await response;
            }
        } else {
            return {
                code: "Http 请求出错了",
                status: response.status,
                statusText: response.statusText,
                message: response.text()
            }
        }
    }

    //#endregion

    //#region UI

    function initUI() {
        // Json 结果集展示
        function resultRender(data, formatter) {
            let resultPanel = godDetailPanel.querySelector(".result-panel");
            if(!resultPanel) {
                return;
            }

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
                        ${htmlNonNull(name, html`<label>${0}</label>`)}
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
                        if(isFunction(formatter)) {
                            htmlBuilder.push(formatter(item.value));
                        } else {
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
            
            replaceHtml(resultPanel, htmlBuilder.join(""));
        }

        function tableRender(columns, data) {
            if(arguments.length === 1) {
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

            function formatValue(obj, val) {
                return isFunction(obj.formatter) ? obj.formatter(val) : val;
            }

            function colgroup(columns) {
                const htmlBuilder = [];
                if(Array.isArray(columns) && columns.length > 0) {
                    htmlBuilder.push("<colgroup>");
                    columns.forEach(col => {
                        htmlBuilder.push(`<col ${htmlCondition(v => typeof v.width === "number", col, html`style="width:${'width'}px"`)}>`);
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
                    columns.forEach(col => {
                        htmlBuilder.push(`<th class="table-view-th" ${htmlCondition(v => !!v.align, col, html`style="text-align:${'align'}"`)}>${formatValue(col, col.text || col.column)}</th>`);
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
                        htmlBuilder.push("<tr>");
                        if(typeof row === "object") {
                            for(let j = 0; j < columns.length; j++) {
                                let col = columns[j];
                                htmlBuilder.push(`<td class="table-view-td" ${htmlCondition(v => !!v.align, col, html`style="text-align:${'align'}"`)}>${formatValue(row, row[col.column])}</td>`);
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

            return `
                <table class="table-view" cellspacing="0" cellpadding="0">
                    ${colgroup(columns)}
                    ${thead(columns)}
                    ${tbody(columns, data)}
                </table>
            `;
        }

        function imageRender(blob) {

        }

        // 打开页面
        function openPage(moduleId) {
            let moduleInfo = godInfo.getCurrentModule(moduleId);
            if(!moduleInfo) {
                return;
            }

            let elem = `
                <div id="detailContentPanel" class="content-panel content-panel-actived">
                    <section class="title-panel">
                        <h1>${moduleInfo.menuText}</h1>
                    </section>
                    <section class="body-panel">
                        <section class="form-panel">
                            ${formRender(moduleInfo.properties)}
                        </section>
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

            godInfo.ui.onOpend(moduleInfo);
        }
        // 关闭页面
        function closePage(moduleId) {
            if(!moduleId) {
                return;
            }
            let moduleInfo = godInfo.getCurrentModule(moduleId);
            if(!moduleInfo) {
                return;
            }

            godInfo.ui.onClosed(moduleInfo);
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
                            htmlBuilder.push(`<input type="text" data-property-name="${e.id}" value="${value}" />`);
                            break;
                        case "text":
                            htmlBuilder.push(`<textarea data-property-name="${e.id}"></textarea>`);
                            break;
                        case "select":
                            htmlBuilder.push(`<select data-property-name="${e.id}">`);
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
                                    <input type="file" data-property-name="${e.id}" value="">
                                    <span>${e.label}</span>
                                </label>
                            `);
                            break;
                        default:
                            htmlBuilder.push(`<input type="${e.type}" data-property-name="${e.id}" value="${value}"`);
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
                    if(!isFunction(b.action)) {
                        htmlBuilder.push(`<button ${i === 0 ? "style=\"margin-left:0\"" : ""} data-button-index="${i}">${b.text}</button>`);
                    }
                });
                htmlBuilder.push('</section>');
            }
            return htmlBuilder.join("");
        }

        godInfo.ui.resultRender = resultRender;
        godInfo.ui.formRender = formRender;
        godInfo.ui.buttonRender = buttonRender;
        godInfo.ui.tableRender = tableRender;

        godInfo.ui.openPage = openPage;
        godInfo.ui.closePage = closePage;

    }

    function defineModules(godMenuPanel, godDetailPanel) {
        const modules = godInfo.modules = [
            {
                menuText: "常规表单系统",
                properties: [
                    { id: "text1", type: "string", label: "文本框", value: "" },
                    { id: "text2", type: "string", label: "必输项", value: "", required: true },
                    { id: "textarea1", type: "text", label: "多行文本框", value: "" },
                    { id: "number1", type: "number", label: "数字", step: 5 },
                    { id: "date1", type: "date", label: "日期" },
                    { id: "range1", type: "range", label: "滑动条", min: 0, max: 100, value: 25 },
                    { 
                        id: "select1", 
                        type: "select", 
                        label: "请选择国家与地区", 
                        options: [
                            { value: "CN", text: "中国大陆", selected: true },
                            { value: "HK", text: "香港" },
                            { value: "SG", text: "新加坡" },
                            { value: "US", text: "美国" },
                            { value: "UK", text: "英国" },
                            { value: "RA", text: "俄罗斯" },
                            { value: "FR", text: "法国" }
                        ]
                    },
                    { 
                        id: "checkbox1", 
                        type: "checkbox", 
                        label: "选择文件类型", 
                        options: [
                            { value: "json", text: "Json", selected: true },
                            { value: "txt", text: "文本" },
                            { value: "exe", text: "可执行文件" },
                            { value: "app", text: "应用程序" },
                            { value: "mp3", text: "音频文件", selected: true },
                            { value: "mp4", text: "视频文件" }
                        ]
                    }
                ],
                button: [
                    {
                        text: "显示表单数据",
                        click: () => {
                            if(checkCurrentViewModel().invalid(v => godInfo.ui.resultRender(v.messages))) {
                                return;
                            }
                            let vm = getCurrentViewModel();
                            godInfo.ui.resultRender(vm);
                        }
                    }
                ],
                subModules: [
                    {
                        menuText: "文件上传",
                        properties: [
                            { id: "fileName", type: "string", label: "模板文件名称（包含后缀）", required: true, value: "" },
                            { 
                                id: "file", 
                                type: "file", 
                                label: "上传", 
                                action: (fileInput, propertyInfo) => {
                                    let files = fileInput.files;
                                    if(files.length === 0) {
                                        fileInput.value = "";
                                        resultRender("没有选中文件");
                                        return;
                                    }
                                    if(checkCurrentViewModel().invalid(v => godInfo.ui.resultRender(v.messages))) {
                                        return;
                                    }
                                    let vm = getCurrentViewModel();
                                    godInfo.ui.resultRender(`开始上传 ${vm.fileName}`);
                                }
                            }
                        ]
                    },
                    {
                        menuText: "文件下载",
                        properties: [
                            { id: "fileName", type: "string", label: "文件名称", required: true, value: "" }
                        ],
                        button: [
                            {
                                text: "显示文件列表",
                                click: () => {
                                    if(checkCurrentViewModel().invalid(v => godInfo.ui.resultRender(v.messages))) {
                                        return;
                                    }
                                    let vm = getCurrentViewModel();
                                    let data = [
                                        `<a href="javascript:void(0)" data-action="download" data-filename="${vm.fileName}">${vm.fileName}</a>`
                                    ];
                                    godInfo.ui.resultRender(data);
                                }
                            },
                            {
                                actionName: "download",
                                action: elem => {
                                    let fileName = elem.dataset.filename;
                                    godInfo.ui.resultRender(`${fileName} 下载完成`);
                                }
                            }
                        ]
                    }
                ]
            },
            {
                menuText: "测试 Loading",
                properties: [
                    { id: "gid", type: "string", label: "集团号", value: "" }
                ],
                button: [
                    {
                        text: "开启",
                        click: () => {
                            godInfo.loading = true;
                        }
                    },
                    {
                        text: "关闭",
                        click: () => {
                            godInfo.loading = false;
                        }
                    }
                ]
            },
            {
                menuText: "显示结果集",
                properties: [
                    { 
                        id: "viewMode", 
                        type: "select", 
                        label: "请选择视图类型", 
                        options: [
                            { value: "json", text: "Json", selected: true },
                            { value: "table", text: "Table" },
                            { value: "json-array", text: "Json Array" },
                            { value: "text", text: "文本" }
                        ]
                    }
                ],
                button: [
                    {
                        text: "显示视图",
                        click: () => {
                            if(checkCurrentViewModel().invalid(v => godInfo.ui.resultRender(v.messages))) {
                                return;
                            }
                            let vm = getCurrentViewModel();
                            let result, formatter;
                            switch(vm.viewMode) {
                                case "json":
                                    result = {
                                        customerName: "张信哲",
                                        customerType: "个人客户",
                                        userInfo: {
                                            username: "Jeff",
                                            cellPhone: "13976117766"
                                        },
                                        accountInfo: {
                                            hkAccount: {
                                                accountNo: "HK0011",
                                                regionCode: "HK",
                                                tradeAccount: [
                                                    {
                                                        tradeAccountType: "代理人账户",
                                                        accountNo: "123456"
                                                    },
                                                    {
                                                        tradeAccountType: "全委账户",
                                                        accountNo: "987651"
                                                    },
                                                    {
                                                        tradeAccountType: "小贷账户",
                                                        accountNo: "135792"
                                                    }
                                                ]
                                            },
                                            sgAccount: {
                                                accountNo: "SG2211",
                                                regionCode: "SG",
                                                tradeAccount: [
                                                    {
                                                        tradeAccountType: "直投账户",
                                                        accountNo: "665588"
                                                    }
                                                ]
                                            }
                                        }
                                    };
                                    formatter = {
                                        tradeAccount: elem => {
                                            return [
                                                elem.tradeAccountType,
                                                elem.accountNo
                                            ];
                                        }
                                    };
                                    break;
                                case "table":
                                    result = [
                                        { name: "Jack", age: 30, gender: 1 },
                                        { name: "Lucy", age: 18, gender: 0 },
                                        { name: "Lily", age: 19, gender: 0 }
                                    ];
                                    formatter = arr => godInfo.ui.tableRender(arr);
                                    break;
                                case "json-array":
                                    result = {
                                        customerName: "张信哲",
                                        customerNameEn: "Jeff",
                                        bankcardList: [
                                            {
                                                bankName: "渣打银行",
                                                bankAccountName: "张信哲",
                                                bankAccountNo: "6623 8907 9876 1678 123"
                                            },
                                            {
                                                bankName: "招商银行香港分行",
                                                bankAccountName: "张信哲",
                                                bankAccountNo: "7789 8907 9965 1678 123"
                                            }
                                        ],
                                        certificates: [
                                            "中国居民身份证", "港澳往来通行证", "美国护照", "台湾身份证"
                                        ]
                                    };
                                    formatter = {
                                        bankcardList: elem => {
                                            return [
                                                elem.bankName,
                                                elem.bankAccountName,
                                                elem.bankAccountNo
                                            ];
                                        }
                                    };
                                    break;
                                default:
                                    result = "显示文本信息";
                                    break;
                            }
                            godInfo.ui.resultRender(result, formatter);
                        }
                    }
                ]
            }
        ];

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
                properties.forEach((e, i) => {
                    if(e.required && isEmpty(e.value)) {
                        result.messages.push(`${e.label || e.id}不能为空`);
                    }
                    if(isFunction(e.validate) && !e.validate(e.value)) {
                        result.messages.push(`${e.label || e.id}的值不符合要求`);
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

        // 生成菜单
        ;(function() {
            godInfo.ui.onClosed(module => {
                if(isFunction(module.onClosed)) {
                    module.onClosed.call(godInfo, module);
                }

                if(Array.isArray(module.properties)) {
                    module.properties.forEach((e, i) => {
                        e.value = "";
                    });
                }
            });
            godInfo.ui.onOpend(module => {
                if(isFunction(module.onOpend)) {
                    module.onOpend.call(godInfo, module);
                }
            });

            function menuItemRender(menuItem, id, level) {
                let marginLeft = 8 + 40 * level;
                menuItem.id = id;
                return `
                    <dt data-menu-id="${id}">
                        <b></b>
                        <u>
                            <i ${htmlCondition(val => !!val, menuItem.icon, html`class="${0}"`)} style="margin-left: ${marginLeft}px"></i><span>${menuItem.menuText}</span>
                        </u>
                    </dt>
                `;
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
                    godInfo.ui.closePage(godInfo.currentMenuId);

                    elem.classList.add("menu-item-selected");
                    godInfo.currentMenuId = id;

                    godInfo.ui.openPage(id);
                }, false);
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
                    elem = elem.parentNode;
                }
    
                let module = getCurrentModule();
                if(!module || !Array.isArray(module.button)) {
                    return;
                }
    
                if(elem.tagName === "BUTTON") {
                    let buttonIndex = elem.dataset.buttonIndex;
                    let buttonInfo = module.button[buttonIndex];
                    if(buttonInfo && isFunction(buttonInfo.click)) {
                        buttonInfo.click.call(module, elem);
                    }
                }
    
                if(elem.tagName === "A") {
                    let actionName = elem.dataset.action;
                    let buttonInfo = module.button.find(b => b.actionName === actionName);
                    if(buttonInfo && isFunction(buttonInfo.action)) {
                        buttonInfo.action.call(module, elem);
                    }
                }
            }, false);
    
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
                                    if(isFunction(propertyInfo.action)) {
                                        propertyInfo.action.call(module, elem, propertyInfo)
                                    }
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
                                            ? propertyInfo.convertor.call(module, value, propertyInfo)
                                            : value;
                                    break;
                            }
                            return;
                        }
                    }
                }
            }, false);
        })();

        godInfo.getCurrentModule = getCurrentModule;
        godInfo.getCurrentViewModel = getCurrentViewModel;
        godInfo.checkCurrentViewModel = checkCurrentViewModel;
    }
    
    function insertStyle() {
        const style = document.createElement("style");
        style.rel = "stylesheet";
        style.textContent = `
            .app-default {
                position: absolute;
                top: 0;
                left: 0;
                opacity: 1;
                visibility: block;
                transition: opacity 320ms cubic-bezier(.4, 0, .6, 1) 16ms, visibility 0ms linear 0ms;
            }

            .app-hide {
                visibility: hidden;
                opacity: 0;
                transition: opacity 320ms cubic-bezier(.4, 0, .6, 1) 0ms, visibility 0s linear 240ms;
            }

            #godHandle {
                position: fixed;
                top: 20px;
                left: 50%;
                margin-left: -60px;
                display: block;
                width: 120px;
                height: 4px;
                background-color: ${godInfo.theme.primaryColor};
                overflow: hidden;
                border-radius: 4px;
                z-index: 10000;
                cursor: pointer;
            }

            #godHandle:active {
                background-color: ${godInfo.theme.basicFtColor};
            }

            .god-handle-default {
                opacity: 0;
                transform: translate3d(0, -20px, 0);
                transition: opacity .32s cubic-bezier(.4, 0, .6, 1) 0s, transform .32s cubic-bezier(.4, 0, .6, 1) 0s;
            }

            .god-handle-show {
                transform: translate3d(0, 0, 0);
                opacity: 1;
                transition: opacity .32s cubic-bezier(.4, 0, .6, 1) .32s, transform .32s cubic-bezier(.4, 0, .6, 1) .32s;
            }

            #loadingElement {
                display: none;
            }

            div.loading-show {
                display: block !important;
            }

            /* 环形加载动画 */
            .page-progress {
                box-sizing: border-box;
                position: absolute;
                left: 50%;
                top: 50%;
                font-size: 16px;
            }

            .page-progress.large {
                width: 96px;
                height: 96px;
                margin-top: -48px;
                margin-left: -48px;
            }

            .page-progress.circles {
                background-color: transparent;
                border: none;
            }

            .page-progress.circles .circle {
                box-sizing: border-box;
                display: inline-block;
                height: 100%;
                left: 0px;
                padding: 18px;
                opacity: 0;
                position: absolute;
                top: 0px;
                width: 100%;
                animation: circles 4.125s ease-in-out infinite;
            }

            .page-progress.circles .circle::after {
                background-color: ${godInfo.theme.primaryColor};
                border-radius: 50%;
                content: "";
                display: block;
                position: absolute;
                height: 6px;
                width: 6px;
            }

            .page-progress.circles :nth-child(1).circle {
                animation-delay: 0s;
            }

            .page-progress.circles :nth-child(2).circle {
                animation-delay: 0.126s;
            }

            .page-progress.circles :nth-child(3).circle {
                animation-delay: 0.252s;
            }

            .page-progress.circles :nth-child(4).circle {
                animation-delay: 0.387s;
            }

            .page-progress.circles :nth-child(5).circle {
                animation-delay: 0.504s;
            }

            .page-progress.circles :nth-child(6).circle {
                animation-delay: 0.63s;
            }
            
            @keyframes circles {
                0%{transform: rotate(-180deg);
                    opacity: 0
                }
                13% {
                    opacity: 0
                }
                26% {
                    opacity: 1
                }
                74% {
                    opacity: 1
                }
                87% {
                    opacity: 0
                }
                100% {
                transform: rotate(585deg);
                    opacity: 0
                }
            }

            #godPanel {
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
            }

            div.god-panel-default {
                transform: translate3d(0, -100%, 0) scale3d(0.5, 0.5, 1);
                opacity: 0;
                transition: opacity .32s cubic-bezier(.4, 0, .6, 1) 0ms, transform .32s cubic-bezier(.4, 0, .6, 1) 0ms;
            }

            div.god-panel-show {
                opacity: 1;
                transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
            }
    
            #godPanel > #godBackground {
                position: absolute;
                width: 100%;
                height: 100%;
                /*background-image: url('https://s.cn.bing.net/th?id=OHR.WhaleSharkDay_ZH-CN3334940631_1920x1080.webp&qlt=50');*/
                /*background-image: url('https://wowtabextension.blob.core.windows.net/wowtabwallpapers/2024-09-28.jpg');*/
                /*background-image: url('https://wowtabextension.blob.core.windows.net/wowtabwallpapers/2024-09-12.jpg');*/
                /*background-image: url('https://wowtabextension.blob.core.windows.net/wowtabwallpapers/2024-09-06-9.png');*/
                background-image: url('https://wowtabextension.blob.core.windows.net/wowtabwallpapers/2024-06-21.jpg');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
            }
    
            #godPanel > #godContentPanel {
                width: 96%;
                height: 96%;
                top: 2%;
                left: 2%;
                position: absolute;
                background-color: ${godInfo.theme.panelColor};
                -webkit-backdrop-filter: blur(20px);
                backdrop-filter: blur(20px);
                border-radius: 10px;
                overflow: hidden;
                display: flex;
                flex-wrap: nowrap;
                flex-direction: column;
            }
    
            #godPanel #godPanelHeader {
                text-align: center;
                width: 100%;
                height: 40px;
                line-height: 40px;
                flex: 0 0 40px;
                position: relative;
            }

            #godPanel #godPanelHeader button#closeButton {
                display: inline-block;
                position: absolute;
                width: 12px;
                height: 12px;
                overflow: hidden;
                border: 0;
                border-radius: 50%;
                top: 14px;
                right: 14px;
                background-color: rgb(196, 35, 24);
            }

            #godPanel #godPanelHeader button#closeButton:active {
                background-color: rgb(148, 22, 13);
            }
    
            #godPanel .god-text {
                font-size: 16px;
            }
    
            #godPanel #godPanelContainer {
                width: 100%;
                flex: 1 1 auto;
                display: flex;
                flex-wrap: nowrap;
                flex-direction: row;
                overflow: hidden;
            }
    
            #godPanel #godMenuPanel {
                flex: 0 0 240px;
                height: 100%;
                overflow: auto;
            }
    
            #godPanel #godMenuPanel dl {
                width: 100%;
                height: auto;
            }
    
            #godPanel #godMenuPanel dt {
                width: 100%;
                height: 40px;
                line-height: 40px;
                position: relative;
            }
    
            #godPanel #godMenuPanel dt b {
                display: block;
                position: absolute;
                overflow: hidden;
                border-radius: 4px;
                top: 4px;
                left: 4px;
                right: 4px;
                bottom: 4px;
                background-color: ${godInfo.theme.menuItemHoverColor};
                opacity: 0;
                transition: opacity 240ms cubic-bezier(.4, 0, .6, 1) 0ms;
                cursor: pointer;
            }
    
            #godPanel #godMenuPanel dt u {
                text-decoration: none;
                position: absolute;
                display: block;
            }
    
            #godPanel #godMenuPanel dt:hover b {
                opacity: 1;
            }

            #godPanel #godMenuPanel dt.menu-item-selected > b {
                background-color: ${godInfo.theme.menuItemSelectedColor} !important;
                opacity: 1;
            }
    
            #godPanel #godMenuPanel dt i {
                display: inline-block;
                vertical-align: top;
                width: 24px;
                height: 24px;
                margin-top: 8px;
                margin-left: 8px;
                margin-right: 8px;
                background-color: ${godInfo.theme.menuItemIconBgColor};
                background-image: url("data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgc3R5bGU9IndpZHRoOiAxZW07aGVpZ2h0OiAxZW07dmVydGljYWwtYWxpZ246IG1pZGRsZTtmaWxsOiBjdXJyZW50Q29sb3I7b3ZlcmZsb3c6IGhpZGRlbjsiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBwLWlkPSIzNDQwIj48cGF0aCBkPSJNOTM3LjA2MiA2MjEuNjg4IDEwMjQgNjIxLjY4OCAxMDI0IDQwMi4yNWwtODYuOTM4IDBjLTg4LjE4OCAwLTEwOS4xODgtNTAuOTM4LTQ3LTExMy4xODhsNjEuNTYyLTYxLjU2Mi0xNTUuMTg4LTE1NS4xMjYtNjEuNSA2MS41Yy02Mi4zMTIgNjIuMzEyLTExMy4zMTIgNDEuMTg4LTExMy4xMjYtNDYuODc2IDAtMC4yNS0wLjEyNi0wLjM3Ni0wLjEyNi0wLjU2Mkw2MjEuNjg0IDAgNDAyLjM0NCAwbDAgODcuMjVjLTAuMjUgODcuODc2LTUxLjA2MiAxMDguODc2LTExMy4yODIgNDYuNjI2bC02MS41MzItNjEuNUw3Mi40MDYgMjI3LjVsNjEuNSA2MS41NjJjNjIuMjgyIDYyLjI1IDQxLjE1NiAxMTMuMTg4LTQ2Ljg3NiAxMTMuMTg4TDAgNDAyLjI1bDAgMjE5LjQzOCA4Ny4wMzIgMGM4OC4wMzIgMCAxMDkuMTU2IDUwLjkzOCA0Ni44NzYgMTEzLjI1bC02MS41IDYxLjUgMTU1LjEyNiAxNTUuMTg4IDYxLjUzMi02MS41NjJjNjIuMjE4LTYyLjE4OCAxMTMuMDMyLTQxLjE4OCAxMTMuMjgyIDQ2LjYyNkw0MDIuMzQ4IDEwMjRsMjE5LjM0NCAwIDAtODYuNDM4YzAtMC4xODggMC4xMjYtMC4zNzYgMC4xMjYtMC41NjItMC4xODgtODguMDYyIDUwLjgxMi0xMDkuMTI2IDExMy4xMjYtNDYuOTM4bDYxLjUgNjEuNTYyIDE1NS4xODgtMTU1LjE4OC02MS41NjItNjEuNUM4MjcuODc2IDY3Mi42MjYgODQ4Ljg3NiA2MjEuNjg4IDkzNy4wNjIgNjIxLjY4OHpNNTEyIDcwNGMtMTA2LjAzMiAwLTE5Mi04Ni0xOTItMTkyczg1Ljk2OC0xOTIgMTkyLTE5MmMxMDYgMCAxOTIgODYgMTkyIDE5MlM2MTggNzA0IDUxMiA3MDR6IiBwLWlkPSIzNDQxIj48L3BhdGg+PC9zdmc+");
                background-size: 16px 16px;
                background-repeat: no-repeat;
                background-position: center;
                overflow: hidden;
                border-radius: 50%;
            }
    
            #godPanel #godMenuPanel dt span {
                font-size: 14px;
            }
    
            #godPanel #godMenuPanel dd {
                
            }
    
            #godPanel #godDetailPanel {
                flex: auto;
                background-color: rgba(255, 255, 255, .7);
                overflow: hidden;
                margin-right: 10px;
                margin-bottom: 10px;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                position: relative;
            }

            #godPanel #godDetailPanel .primary-color {
                color: ${godInfo.theme.primaryColor};
            }

            #godPanel #godDetailPanel .content-panel {
                flex: 1 1 auto;
                margin: 10px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            #godPanel #godDetailPanel .content-panel-actived {
                opacity: 1;
                transition: opacity .24s cubic-bezier(.4, 0, .6, 1) 0ms;
            }

            #godPanel #godDetailPanel .content-panel-disabled {
                opacity: .2;
            }

            #godPanel #godDetailPanel section.title-panel {
                width: 100%;
                height: 64px;
                line-height: 64px;
            }

            #godPanel #godDetailPanel h1 {
                font-weight: normal;
                text-align: left;
                margin: 0;
                padding: 0;
            }

            #godPanel #godDetailPanel section.button-panel {
                flex: none;
                height: 48px;
                line-height: 48px;
                text-align: center;
            }

            #godPanel #godDetailPanel .label-text {
                line-height: 32px;
            }

            #godPanel #godDetailPanel .required-star {
                line-height: 32px;
                color: ${godInfo.theme.starColor};
                margin-left: 5px;
            }

            #godPanel #godDetailPanel input,
            #godPanel #godDetailPanel select {
                box-sizing: border-box;
                width: 200px;
                height: 32px;
                line-height: 32px;
                border: solid 1px #666;
                border-radius: 8px;
                padding-left: 2px;
                padding-right: 2px;
                outline: none;
            }

            #godPanel #godDetailPanel textarea {
                box-sizing: border-box;
                width: 200px;
                min-height: 128px;
                line-height: 24px;
                border: solid 1px #666;
                border-radius: 8px;
                padding-left: 2px;
                padding-right: 2px;
                overflow: auto;
                outline: none;
            }

            #godPanel #godDetailPanel input:focus,
            #godPanel #godDetailPanel select:focus,
            #godPanel #godDetailPanel textarea:focus {
                border-color: ${godInfo.theme.primaryColor};
            }

            #godPanel #godDetailPanel input[type=file] {
                top: -40px;
                left: -300px;
                position: absolute;
            }

            #godPanel #godDetailPanel input[type=checkbox] {
                width: 18px;
                height: 18px;
                line-height: 18px;
                border: solid 1px #666;
                border-radius: 4px;
                margin: 0;
                padding: 0;
                vertical-align: middle;
                background-color: ${godInfo.theme.basicBgColor};
                outline: none;
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
            }

            #godPanel #godDetailPanel input[type=checkbox]:checked {
                background-color: ${godInfo.theme.primaryColor};
                border-color: ${godInfo.theme.primaryColor};
                background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJ3aWR0aDogMTJweDsgaGVpZ2h0OiAxMnB4OyIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmVyc2lvbj0iMS4xIj48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNIDk1NC44NTcgMzIzLjQyOSBxIDAgMjIuODU3MSAtMTYgMzguODU3MSBsIC00MTMuNzE0IDQxMy43MTQgbCAtNzcuNzE0MyA3Ny43MTQzIHEgLTE2IDE2IC0zOC44NTcxIDE2IHQgLTM4Ljg1NzEgLTE2IGwgLTc3LjcxNDMgLTc3LjcxNDMgbCAtMjA2Ljg1NyAtMjA2Ljg1NyBxIC0xNiAtMTYgLTE2IC0zOC44NTcxIHQgMTYgLTM4Ljg1NzEgbCA3Ny43MTQzIC03Ny43MTQzIHEgMTYgLTE2IDM4Ljg1NzEgLTE2IHQgMzguODU3MSAxNiBsIDE2OCAxNjguNTcxIGwgMzc0Ljg1NyAtMzc1LjQyOSBxIDE2IC0xNiAzOC44NTcxIC0xNiB0IDM4Ljg1NzEgMTYgbCA3Ny43MTQzIDc3LjcxNDMgcSAxNiAxNiAxNiAzOC44NTcxIFoiIHAtaWQ9IjU3MjAiIC8+PC9zdmc+");
            }

            #godPanel #godDetailPanel .checkbox-text {
                margin-left: 5px;
                line-height: 32px;
                font-size: 14px;
            }

            #godPanel #godDetailPanel label.label-file {
                display: block;
                width: 200px;
                height: 32px;
                background-color: ${godInfo.theme.buttonBgColor};
                color: ${godInfo.theme.primaryColor};
                overflow: hidden;
                border-radius: 8px;
                border: none;
                text-align: center;
                line-height: 32px;
                position: relative;
            }

            #godPanel #godDetailPanel label.label-file:hover {
                background-color: ${godInfo.theme.primaryColor};
                color: ${godInfo.theme.basicBgColor};
            }

            #godPanel #godDetailPanel label.label-file:active {
                background-color: ${godInfo.theme.buttonActiveBgColor};
                color: ${godInfo.theme.basicBgColor};
            }

            #godPanel #godDetailPanel button {
                min-width: 100px;
                height: 32px;
                background-color: ${godInfo.theme.buttonBgColor};
                color: ${godInfo.theme.primaryColor};
                overflow: hidden;
                border-radius: 8px;
                border: none;
                padding: 0 8px 0 8px;
                margin-left: 10px;
                vertical-align: top;
                margin-top: 12px;
            }

            #godPanel #godDetailPanel button:hover {
                background-color: ${godInfo.theme.primaryColor};
                color: ${godInfo.theme.basicBgColor};
            }

            #godPanel #godDetailPanel button:active {
                background-color: ${godInfo.theme.buttonActiveBgColor};
                color: ${godInfo.theme.basicBgColor};
            }

            #godPanel #godDetailPanel section.body-panel {
                flex: auto;
                display: flex;
                flex-direction: row;
                border: solid 1px ${godInfo.theme.primaryColor};
                border-radius: 6px;
                overflow: hidden;
            }

            #godPanel #godDetailPanel section.form-panel {
                flex: 0 0 auto;
                width: 300px;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;
                border-right: solid 1px ${godInfo.theme.primaryColor};
                overflow: auto;
            }

            #godPanel #godDetailPanel .form-list {
                width: auto;
                height: auto;
                flex: none;
                min-height: 90%;
                margin: 0;
                padding: 0;
            }

            #godPanel #godDetailPanel .form-list li {
                margin: 0 0 10px 0;
                padding: 0;
                list-style: none;
            }

            #godPanel #godDetailPanel section.result-panel {
                flex: 1 1 auto;
                flex-direction: column;
                overflow: auto;
            }

            #godPanel #godDetailPanel div.result-title {
                flex: 1 1 100%;
                height: 32px;
                line-height: 32px;
                margin-top: 10px;
            }

            #godPanel #godDetailPanel div.result-title span {
                margin-left: 6px;
                color: ${godInfo.theme.primaryColor};
            }

            #godPanel #godDetailPanel .result-title-marker {
                display: inline-block;
                vertical-align: top;
                margin-top: 12px;
                width: 6px;
                height: 6px;
                overflow: hidden;
                border-radius: 50%;
                background-color: ${godInfo.theme.primaryColor};
                margin-left: 10px;
            }

            #godPanel #godDetailPanel div.result-content {
                width: 100%;
                height: auto;
                margin-bottom: 20px;
            }

            #godPanel #godDetailPanel div.result-item-group {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
            }

            #godPanel #godDetailPanel div.result-item {
                width: auto;
                height: 40px;
                background-color: ${godInfo.theme.basicBgColor};
                border-radius: 6px;
                padding: 0 10px 0 10px;
                margin-top: 10px;
                margin-left: 10px;
                display: flex;
                flex-direction: row;
                overflow: hidden;
            }

            #godPanel #godDetailPanel div.result-item label {
                text-align: center;
                line-height: 40px;
                margin-left: 5px;
                flex: none;
            }

            #godPanel #godDetailPanel div.result-item a {
                color: ${godInfo.theme.primaryColor};
                text-decoration: none;
            }

            #godPanel #godDetailPanel div.result-item a:hover {
                text-decoration: underline;
            }

            #godPanel #godDetailPanel div.result-item .before::before {
                content: '|';
                margin-left: 5px;
                margin-right: 5px;
                flex: none;
            }

            #godPanel #godDetailPanel div.result-item span {
                line-height: 40px;
                flex: none;
            }

            #godPanel #godDetailPanel .table-view {
                table-layout: fixed;
                width: calc(100% - 20px);
                margin: 10px auto 10px auto;
                border-spacing: 0;
                border-collapse: collapse;
                border-top: solid 1px ${godInfo.theme.primaryColor};
                border-left: solid 1px ${godInfo.theme.primaryColor};
            }

            #godPanel #godDetailPanel .table-view-th,
            #godPanel #godDetailPanel .table-view-td {
                padding: 0 5px 0 5px;
                height: 40px;
                line-height: 40px;
                font-weight: normal;
                border-bottom: solid 1px ${godInfo.theme.primaryColor};
                border-right: solid 1px ${godInfo.theme.primaryColor};
            }

            #godPanel #godDetailPanel .table-view-th {
                color: ${godInfo.theme.primaryColor};
            }
        `;
        document.getElementsByTagName("head").item(0).appendChild(style);
    }

    function insertGodPanel() {
        godInfo.app = document.getElementById("app");
        if(godInfo.app) {
            godInfo.app.classList.add("app-default");
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
        defineModules(godInfo.godMenuPanel, godInfo.godDetailPanel);

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
            godInfo.godPanel = godPanel;
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

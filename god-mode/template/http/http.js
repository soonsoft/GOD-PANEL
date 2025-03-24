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

    if(arguments.length < 4 && typeof data === "string") {
        let upCase = data.toUpperCase();
        if(upCase === "GET" || upCase === "POST") {
            method = upCase;
        } else {
            method = filename;
            filename = data;
        }
        data = null;
    }

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

async function parallelRequest(requestTasks, option) {
    if(!Array.isArray(requestTasks) || requestTasks.length === 0) {
        return [];
    }

    if(!option) {
        option = {};
    }

    option.size = parseInt(option.size);
    if(isNaN(option.size) || option.size < 1) {
        option.size = 3;
    }
    if(isEmpty(option.method)) {
        option.method = "GET";
    }

    const taskCount = requestTasks.length;
    let result = new Array(taskCount);
    async function execTask() {
        while(requestTasks.length > 0) {
            let task = requestTasks.shift();
            let resultIndex = taskCount - requestTasks.length - 1;

            let method = task.method || option.method;
            let responseDataType = task.responseDataType || option.requestDataType;
            let requestOptions = task.options || {};
            requestOptions.responseDataType = responseDataType;

            try {
                if(isEmpty(task.url)) {
                    throw new TypeError("url is empty.");
                }
                let resp = await httpRequest(task.url, method, task.data, requestOptions);
                result[resultIndex] = {
                    status: "success"
                };
                if(responseDataType === "blob") {
                    result[resultIndex].data = await resp.blob();
                    result[resultIndex].filename = getContentDispositionFileName(resp.headers);
                } else {
                    result[resultIndex].data = resp;
                }
            } catch(e) {
                result[resultIndex] = {
                    status: "failed",
                    message: e.message
                };
            }
        }
    }

    godInfo.loading = true;

    try {
        let executors = [];
        for(let i = 0; i < option.size; i++) {
            executors.push(execTask());
        }

        await Promise.all(executors);
    } catch(e) {
        console.error(e);
        godInfo.loading = false;
    }
    return result;
}

async function httpGet(url, data, options) {
    return await httpRequest(url, "GET", data, options);
}

async function httpPost(url, data, options) {
    return await httpRequest(url, "POST", data, options);
}

/**
 * 数据请求
 * 默认是 application/json 格式，如果需要form，data 请使用 FormData
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
            defaultHeaders["Content-Type"] = "application/json";
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
import { generateId, isEmpty } from "../../common";
import { resultRender } from "../module-scope";

/**
 * 图片视图
 * @param options = { type: "url" || "blob" || "arrayBuffer" || "base64" }
 * @param arguments[0-1] ~ [n] , string || Blob || ArrayBuffer
 * @returns 
 */
export function imageRender() {
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

    let containerStyle = "";
    let imageStyle = "";
    if(options.fillStyle === "contain") {
        containerStyle = "calc(100% - 20px);";
        imageStyle = "width:100%;height:100%;object-fit:contain;";
    }

    let argArray = Array.prototype.slice.call(arguments, imageArgIndex, arguments.length);
    let afterTasks = [];
    let htmlBuilder = [];
    for(let i = 0; i < argArray.length; i++) {
        let arg = argArray[i];
        if(isEmpty(arg)) {
            continue;
        }
        htmlBuilder.push(`<div class="result-content-panel" ${containerStyle}>`);
        if(options.type === "url") {
            htmlBuilder.push(`<img class="image-view" ${imageStyle} src="${arg}">`);
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
        if(i < argArray.length - 1) {
            htmlBuilder.push('<div class="image-view-gap"></div>');
        }
    }

    resultRender(htmlBuilder.join(""));
    afterTasks.forEach(fn => fn());
}
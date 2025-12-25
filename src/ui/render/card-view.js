import { isFunction } from "../../common";
import { resultRender } from "../module-scope";
/**
 * 卡片视图
 * @param {*} data 数据集
 * @param {*} options 填充方式，function || { width: <value>, height: <value>, formatter: <function> }
 */
export function cardRender(data, options) {
    let arr = data;
    if(!Array.isArray(data) && !data) {
        arr = [ data ] ;
    }

    if(!options) {
        options = {};
    }

    let formatter = options.formatter || options;
    formatter = isFunction(formatter) ? formatter : (item, i) => `<div>${i}</div>`;

    let htmlBuilder = [];
    htmlBuilder.push(`<div class="result-content-panel card-view">`);
    for(let i = 0; i < arr.length; i++) {
        let item = arr[i];
        htmlBuilder.push(`<div class="card-item">`);
        htmlBuilder.push(formatter(item, i));
        htmlBuilder.push("</div>");
    }
    htmlBuilder.push("</div>");
    
    resultRender(htmlBuilder.join(""));
}
import { html, htmlCondition, isEmpty, isFunction } from "../../common";
import { resultRender } from "../module-scope";
/**
 * 表格视图
 * @param {*} columns 
 * @param {*} data 
 * @param {*} option 
 */
export function tableRender(columns, data, option) {
    if(arguments.length < 3 && !Array.isArray(data)) {
        option = data;
        data = columns;
        columns = null;
    }

    if(!option) {
        option = {
            // auto | fixed
            layout: "auto"
        };
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

    if(!isFunction(option.renderFn)) {
        option.renderFn = resultRender;
    }

    function formatValue(column, row, val, rowIndex, colIndex) {
        let result = isFunction(column.formatter) 
                ? column.formatter(val, { row: row, column: column, rowIndex: rowIndex, colIndex: colIndex}) 
                : val;
        result = Array.isArray(result) ? result.join("") : result;
        return isEmpty(result) ? "" : result;
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

    return option.renderFn(`
        <div class="result-content-panel result-content-border">
            <table class="table-view" cellspacing="0" cellpadding="0">
                ${colgroup(columns)}
                ${thead(columns)}
                ${tbody(columns, data)}
            </table>
        </div>
        ${htmlCondition(isFunction(option.renderWith), () => `<div class="result-content-panel">${option.renderWith()}</div>`)}
    `);
}
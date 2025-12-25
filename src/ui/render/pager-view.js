
/**
 * 分页按钮
 * @param {*} option { pageIndex, pageCount, pageSize }
 * @returns 
 */
export function pageButtonRender(option) {
    let pageIndex = option.pageIndex || 1;
    let pageCount = option.pageCount || 0;
    let pageSize = option.pageSize || 20;
    if(option.rowCount) {
        pageCount = Math.floor((option.rowCount + pageSize - 1) / pageSize);
    }
    let buttonCount = option.buttonCount || 10;
    const _ex = Math.floor((buttonCount - 1) / 2);

    function pageButtonRender(pageNum) {
        if(pageNum === pageIndex) {
            return `<span class="page-button-selected">${pageNum}</span>`;
        }
        let actionName = option.actionName || "";
        return `<a class="page-button" href="javascript:void(0)" data-action-name="${actionName}" data-page-index="${pageNum}" data-page-size="${pageSize}">${pageNum}</a>`;
    }

    function pageText(text) {
        return `<span class="page-text">${text}</span>`;
    }

    //添加页码按钮
    let start = pageIndex - _ex;
    start = (start < 1) ? 1 : start;
    let end = start + buttonCount - 1;
    end = (end > pageCount) ? pageCount : end;
    if ((end - start + 1) < buttonCount) {
        if ((end - (buttonCount - 1)) > 0) {
            start = end - (buttonCount - 1);
        }
        else {
            start = 1;
        }
    }

    let htmlBuilder = [];

    //当start不是从1开始时显示带有特殊标记的首页
    if (start > 1) {
        htmlBuilder.push(pageButtonRender(1));
        htmlBuilder.push(pageText("..."));
    }
    for (let i = start, btn; i <= end; i++) {
        htmlBuilder.push(pageButtonRender(i));
    }
    //当end不是最后一页时显示带有特殊标记的尾页
    if (end < pageCount) {
        htmlBuilder.push(pageText("..."));
        htmlBuilder.push(pageButtonRender(pageCount));
    }

    return `
        <div class="page-button-panel">
            ${htmlBuilder.join("")}
        </div>
    `;
}
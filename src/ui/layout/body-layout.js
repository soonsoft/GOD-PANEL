import { html, htmlCondition, escapeHtml } from "../../common";
import { renderGridLayoutCssString, collectAreaCells } from "./grid-layout";

function hasProperties(properties) {
    return Array.isArray(properties) && properties.length > 0;
}

// class 渲染器：字符串布局名作为 .body-container 的 CSS class（left-right / top-bottom ...）
function classRenderer(layoutName, ctx) {
    const { properties, scope, formRender } = ctx;
    const formSection = htmlCondition(
        hasProperties(properties),
        formRender(properties, scope),
        html`<section class="form-panel">${0}</section>`
    );
    return `
        <section class="body-container ${layoutName}">
            ${formSection}
            <section class="result-panel"></section>
        </section>
    `;
}

// grid 渲染器：JSON 布局，通过 grid-layout 生成 CSS Grid
function gridRenderer(layoutConfig, ctx) {
    const { properties, scope, formRender } = ctx;
    const layoutStyle = renderGridLayoutCssString(layoutConfig);
    const areaCells = collectAreaCells(layoutConfig);
    // 按角色解析区域（不绑定固定字面名，以便直接使用 layoutBox 等任意 grid 布局）：
    //   - 结果落点：优先 result-panel 命名区域，否则取 size:fill 的主区域；为其打上 result-panel 类供 resultRender 定位
    //   - 表单区域：form-panel 命名区域；有 properties 时注入 formRender
    //   - 其余 area：空格子，留给模块自行填充
    const resultArea = areaCells.find(c => c.area === "result-panel")?.area
        || areaCells.find(c => c.size === "fill")?.area;
    const formArea = areaCells.find(c => c.area === "form-panel")?.area;
    const hasForm = hasProperties(properties) && !!formArea;
    const cellsHtml = areaCells.map(({ area }) => {
        const classes = [area];
        let inner = "";
        if(area === resultArea) {
            classes.push("result-panel");
        }
        if(area === formArea) {
            classes.push("form-panel");
            if(hasForm) {
                inner = formRender(properties, scope);
            }
        }
        return `<section class="${classes.join(" ")}" style="grid-area:${area};">${inner}</section>`;
    }).join("");
    return `
        <section class="body-container" style="${escapeHtml(layoutStyle)} align-content: stretch;">
            ${cellsHtml}
        </section>
    `;
}

// 注册表 + 解析（按 layout 类型派发：string → class，object → grid）
const renderers = { class: classRenderer, grid: gridRenderer };
function resolveRenderer(layout) {
    return typeof layout === "string" ? "class" : "grid";
}

/**
 * 按 layout 定义选择渲染器，生成 .body-container 片段（不含外层 body-panel 与按钮）。
 * @param {string|object} layout - 字符串布局名 或 grid JSON 配置
 * @param {{properties:*, scope:*, formRender:Function}} ctx - 渲染上下文（formRender 由调用方注入）
 * @returns {string} .body-container 的 HTML 片段
 */
export function renderBodyContainer(layout, ctx) {
    const renderer = renderers[resolveRenderer(layout)];
    return renderer(layout, ctx);
}

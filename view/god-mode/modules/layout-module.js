import { renderLayoutHtml, renderGridLayoutCssString, layoutBox } from "../../../src/ui/layout/grid-layout";
import { escapeHtml } from "../../../src/common";
import { resultRender } from "../../../src/ui/module-scope";

/**
 * 布局测试模块
 * 配合 src/ui/layout/grid-layout.js，演示其支持的各种布局形式。
 *
 * 每个动作把一种布局通过 renderGridLayoutCssString 转成真实 CSS，
 * 再渲染成一个「带命名单元格的可视化网格 + 生成的 CSS」预览，
 * 写入当前模块的 result-panel，从而直观验证 grid-layout 的输出是否正确。
 */

// 把一个布局渲染成可视化预览，并写入 result-panel
function previewLayout(layout, title) {
    const orient = layout.type === "row" ? "row · 横向" : "column · 纵向";
    const css = renderGridLayoutCssString(layout);
    const gridHtml = renderLayoutHtml(layout, {
        containerStyle: "flex:1 1 auto;min-height:260px;align-content:stretch;"
    });

    const html =
        `<div class="result-content-panel result-content-border" style="height:100%;padding:14px;display:flex;flex-direction:column;gap:12px;">` +
        `<h3 style="margin:0;flex:none;">${escapeHtml(title)} <small style="font-weight:normal;opacity:.65;">${escapeHtml(orient)}</small></h3>` +
        gridHtml +
        `<details><summary style="cursor:pointer;opacity:.75;">生成的 CSS</summary>` +
        `<pre style="margin:6px 0 0;padding:10px;background:rgba(127,140,170,0.14);border-radius:6px;overflow:auto;font-size:12px;white-space:pre-wrap;">${escapeHtml(css)}</pre>` +
        `</details>` +
        `</div>`;

    // resultRender 默认定位到当前模块（scope 0）的 .result-panel
    resultRender(html);
}

// 经典布局直接复用 grid-layout 提供的 layoutBox（rowTwo / colTwo / single / rowThree / areaMerge）

const layoutModule = {
    menuText: "布局测试",
    layout: layoutBox.single,
    onOpened: ctx => {
        ctx.jsonRender({
            提示: "点击下方按钮预览各种布局",
            说明: "本模块 body 即 layoutBox.single，结果由 fill 区域（content）承担"
        });
    },
    actions: [
        { text: "左右分栏",   action: () => previewLayout(layoutBox.rowTwo,    "左右分栏（row · 2 栏）") },
        { text: "上下分栏",   action: () => previewLayout(layoutBox.colTwo,    "上下分栏（column · 2 栏）") },
        { text: "单列",       action: () => previewLayout(layoutBox.single,    "单列（column · 1 栏）") },
        { text: "左中右三栏", action: () => previewLayout(layoutBox.rowThree,  "左中右三栏（row · 3 栏）") },
        { text: "跨行合并",   action: () => previewLayout(layoutBox.areaMerge, "同名 area 跨行合并（嵌套）") }
    ]
};

export {
    layoutModule
};

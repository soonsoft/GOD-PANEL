import { camelToKebabSinglePass, escapeHtml } from '../../common.js';

/**
 * 极简、可递归的 JSON 布局描述模块
 * 仅使用 row / column / gap / size / area
 * 可 1:1 映射为 CSS Grid（包含 grid-template-areas）
 */

/**
 * 生成布局配置
 * @param {Object} config - 布局配置对象
 * @param {string} config.type - 布局方向：row（横向）或 column（纵向）
 * @param {number} config.gap - 间距
 * @param {Array} config.children - 子节点数组
 * @returns {Object} 处理后的布局配置
 */
export function createGridLayout(config) {
  // 验证必填字段
  if (!config.type || !['row', 'column'].includes(config.type)) {
    throw new Error('布局方向必须为 row 或 column');
  }

  // 默认值处理
  const layout = {
    type: config.type,
    gap: config.gap || 0,
    children: config.children || []
  };

  // 处理子节点
  layout.children = layout.children.map(child => {
    // 递归处理子节点
    if (child.children) {
      return {
        ...child,
        children: createGridLayout(child.children)
      };
    }
    return child;
  });

  return layout;
}

/**
 * 校验布局配置，把「会静默产出错误或空结果」的结构提前变成显式异常。
 * 当前生成器仅支持：row 的子节点全部为叶子（不可嵌套容器）；column 的子节点要么全为叶子、
 * 要么全为 row（且各 row 列数一致以保证矩形）；整体最多两层（根 + 一层 row）。
 * @param {Object} layout - 布局配置
 * @param {number} [depth=1] - 当前容器所在层级，根为 1
 */
export function validateLayout(layout, depth = 1) {
  if (!layout || (layout.type !== 'row' && layout.type !== 'column')) {
    throw new Error('[grid-layout] 每个布局节点的 type 必须是 "row" 或 "column"');
  }
  const children = layout.children;
  if (!Array.isArray(children) || children.length === 0) {
    return;
  }

  if (layout.type === 'row') {
    for (const child of children) {
      if (child && Array.isArray(child.children)) {
        throw new Error('[grid-layout] row 节点不支持嵌套容器子节点（请改用 column 包裹多行）');
      }
    }
    return;
  }

  // column：子节点要么全是叶子，要么全是 row
  const widths = new Set();
  let hasLeaf = false;
  let hasRow = false;
  for (const child of children) {
    if (child && Array.isArray(child.children)) {
      hasRow = true;
      if (child.type !== 'row') {
        throw new Error('[grid-layout] column 内只能嵌套 row（不支持 column-in-column）');
      }
      if (depth >= 2) {
        throw new Error('[grid-layout] 仅支持两层嵌套，检测到第三层及以上的布局');
      }
      for (const gc of child.children) {
        if (gc && Array.isArray(gc.children)) {
          throw new Error('[grid-layout] row 节点不支持嵌套容器子节点');
        }
      }
      widths.add(child.children.length);
    } else {
      hasLeaf = true;
      widths.add(1);
    }
  }
  if (hasLeaf && hasRow) {
    throw new Error('[grid-layout] column 的子节点不能同时包含叶子与 row（会产生非矩形 template-areas）');
  }
  if (hasRow && widths.size > 1) {
    throw new Error('[grid-layout] column 内各 row 的列数必须一致（会产生非矩形 template-areas）');
  }
}

/**
 * 生成 CSS Grid 配置
 * @param {Object} layout - 布局配置对象
 * @returns {Object} CSS Grid 配置
 */
export function generateGridConfig(layout) {
  // 基础配置
  const gridConfig = {
    display: 'grid',
    gap: `${layout.gap}px`,
    gridAutoFlow: layout.type === 'row' ? 'column' : 'row'
  };

  // 生成 grid-template-areas
  const areas = generateGridAreas(layout);
  if (areas.length > 0) {
    gridConfig.gridTemplateAreas = areas.map(row => `"${row}"`).join('\n');
  }

  // 主轴轨道：直接子节点的 size（row→列，column→行）
  // 交叉轴轨道：若直接子节点是嵌套容器，则用其内层子节点的 size 推导（取第一个嵌套子节点）
  const crossTrackSizes = getNestedTrackSizes(layout.children);
  if (layout.type === 'row') {
    gridConfig.gridTemplateColumns = layout.children
      .map(child => mapSizeToCss(child.size))
      .join(' ');
    if (crossTrackSizes) {
      gridConfig.gridTemplateRows = crossTrackSizes.join(' ');
    }
  } else {
    gridConfig.gridTemplateRows = layout.children
      .map(child => mapSizeToCss(child.size))
      .join(' ');
    if (crossTrackSizes) {
      gridConfig.gridTemplateColumns = crossTrackSizes.join(' ');
    }
  }

  return gridConfig;
}

export function renderGridLayoutCssString(config) {
  validateLayout(config);
  const gridConfig = generateGridConfig(config);
  return Object.entries(gridConfig)
    .map(([key, value]) => `${camelToKebabSinglePass(key)}: ${value};`)
    .join('\n');
}

// 默认单元格外观：半透明 + 虚线边框，适配任意底色，插入即可见
const DEFAULT_CELL_STYLE = "min-height:60px;background:rgba(127,140,170,0.15);border:1px dashed rgba(127,140,170,0.55);border-radius:6px;padding:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;";

// 递归收集所有命名 area（同名 area 去重，合并区域只保留首个）
export function collectAreaCells(node, out = [], seen = new Set()) {
  const children = node && node.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child && typeof child.area === 'string' && !seen.has(child.area)) {
        seen.add(child.area);
        out.push(child);
      }
      if (child && Array.isArray(child.children)) {
        collectAreaCells(child, out, seen);
      }
    }
  }
  return out;
}

// 解析单个格子的内容
function resolveCellContent(cell, options) {
  const { area, size } = cell;
  const cellOpt = options.cell;
  if (typeof cellOpt === 'function') {
    return String(cellOpt(area, size) ?? '');
  }
  if (cellOpt && typeof cellOpt === 'object') {
    return cellOpt[area] != null ? String(cellOpt[area]) : '';
  }
  if (typeof cellOpt === 'string') {
    return cellOpt;
  }
  const sizeText = size == null ? '' : String(size);
  return `<b>${escapeHtml(area)}</b>${sizeText ? `<small style="opacity:.7;">${escapeHtml(sizeText)}</small>` : ''}`;
}

/**
 * 根据 layout JSON 生成一个「可直接插入文档」的 HTML 片段。
 * 产出：一个带 grid 样式的容器，内部为每个命名 area 生成一个格子（用 grid-area 定位）。
 * 同名 area 会合并为一格（由 grid-template-areas 自动跨格）。
 *
 * @param {Object} layout - 布局配置
 * @param {Object} [options]
 * @param {string} [options.tag='div'] - 容器标签
 * @param {string} [options.cellTag='section'] - 格子标签
 * @param {string} [options.containerClass] - 容器额外 class
 * @param {string} [options.cellClass] - 格子额外 class
 * @param {string} [options.containerStyle] - 追加到容器的内联样式（拼接在 grid CSS 之后）
 * @param {string} [options.cellStyle] - 追加到每个格子的内联样式（拼接在默认样式之后）
 * @param {Function|string|Object} [options.cell] - 格子内容：
 *        函数 (area, size) => html；对象 { [area]: html }；字符串（所有格子统一）；
 *        省略时默认显示 area 名 + size
 * @returns {string} HTML 片段字符串
 */
export function renderLayoutHtml(layout, options = {}) {
  const css = renderGridLayoutCssString(layout); // 内部已做 validateLayout
  const cells = collectAreaCells(layout);
  const tag = options.tag || 'div';
  const cellTag = options.cellTag || 'section';
  const containerExtra = options.containerStyle ? ` ${options.containerStyle}` : '';
  const cellExtra = options.cellStyle ? ` ${options.cellStyle}` : '';

  const parts = [];
  parts.push(
    `<${tag}${options.containerClass ? ` class="${escapeHtml(options.containerClass)}"` : ''} style="${escapeHtml(css)}${containerExtra}">`
  );
  for (const cell of cells) {
    const content = resolveCellContent(cell, options);
    parts.push(
      `<${cellTag}${options.cellClass ? ` class="${escapeHtml(options.cellClass)}"` : ''} style="grid-area:${escapeHtml(cell.area)};${DEFAULT_CELL_STYLE}${cellExtra}">${content}</${cellTag}>`
    );
  }
  parts.push(`</${tag}>`);
  return parts.join('');
}

/**
 * 映射 size 到 CSS 值
 * @param {string|number} size - 尺寸值：auto、fill 或数字
 * @returns {string} CSS 尺寸值
 */
function mapSizeToCss(size) {
  if (size === 'auto') {
    return 'auto';
  } else if (size === 'fill') {
    return '1fr';
  } else if (typeof size === 'number') {
    return `${size}px`;
  }
  return 'auto'; // 默认值
}

/**
 * 取第一个「嵌套容器」子节点的内层 size 列表，用于推导交叉轴轨道尺寸。
 * 嵌套布局（如跨行/跨列合并）通常各行/列结构一致，故只取第一个嵌套子节点即可。
 * @param {Array} children - 布局子节点数组
 * @returns {Array<string>|null} 内层 size 映射后的 CSS 值数组；无嵌套时返回 null
 */
function getNestedTrackSizes(children) {
  if (!Array.isArray(children)) {
    return null;
  }
  const nested = children.find(child => Array.isArray(child.children));
  if (!nested) {
    return null;
  }
  return nested.children.map(child => mapSizeToCss(child.size));
}

/**
 * 生成 grid-template-areas
 * @param {Object} layout - 布局配置对象
 * @returns {Array} 二维数组表示的网格区域
 */
function generateGridAreas(layout) {
  // 处理叶子节点
  if (!layout.children || layout.children.length === 0) {
    return [];
  }

  // 生成网格区域
  if (layout.type === 'row') {
    // 检查是否所有子节点都有 area 属性
    const hasAreas = layout.children.every(child => child.area);
    if (!hasAreas) {
      return [];
    }
    // 横向布局：一行多列
    return [layout.children.map(child => child.area).join(' ')];
  } else {
    // 纵向布局：多行一列 或 递归处理
    const areas = [];
    
    for (const child of layout.children) {
      if (child.type) {
        // 子节点是一个布局对象，递归处理
        const childAreas = generateGridAreas(child);
        if (childAreas.length > 0) {
          areas.push(...childAreas);
        }
      } else if (child.children) {
        // 子节点有 children 属性，递归处理
        const childAreas = generateGridAreas(child.children);
        if (childAreas.length > 0) {
          areas.push(...childAreas);
        }
      } else {
        // 检查是否有 area 属性
        if (child.area) {
          // 单个节点：一行一列
          areas.push(child.area);
        }
      }
    }
    
    return areas;
  }
}

/**
 * 经典布局集合（box layouts）
 * 每个字段都是一份完整的 layout JSON，可直接传给
 * renderGridLayoutCssString / renderLayoutHtml / generateGridConfig 使用。
 */
export const layoutBox = {
  // 1. 左右两栏：固定宽侧栏 + 自适应主区（row）
  rowTwo: {
    type: 'row', gap: 10,
    children: [
      { area: 'aside', size: 200 },
      { area: 'main', size: 'fill' }
    ]
  },

  // 2. 上下两栏：自适应头部 + 自适应主区（column）
  colTwo: {
    type: 'column', gap: 10,
    children: [
      { area: 'header', size: 'auto' },
      { area: 'main', size: 'fill' }
    ]
  },

  // 3. 单格填满：单个 fill 区域（column）
  single: {
    type: 'column', gap: 0,
    children: [
      { area: 'content', size: 'fill' }
    ]
  },

  // 4. 左中右三栏：左/右固定，中间自适应（row）
  rowThree: {
    type: 'row', gap: 10,
    children: [
      { area: 'left', size: 160 },
      { area: 'main', size: 'fill' },
      { area: 'right', size: 160 }
    ]
  },

  // 5. 侧栏跨行合并：side 在两行重复 → 自动合并为一格（column 嵌套 row）
  areaMerge: {
    type: 'column', gap: 10,
    children: [
      { type: 'row', gap: 10, children: [ { area: 'side', size: 160 }, { area: 'head', size: 'fill' } ] },
      { type: 'row', gap: 10, children: [ { area: 'side', size: 160 }, { area: 'body', size: 'fill' } ] }
    ]
  }
};
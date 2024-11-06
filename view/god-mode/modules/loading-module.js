import { showLoading } from "../../../src/ui/loading";

const loadingModule = {
    menuText: "Loading 效果展示",
    description: "用于展示 Loading 动画效果。开启后，请切换菜单选项关闭。",
    properties: [
        { id: "gid", type: "string", label: "集团号", value: "" }
    ],
    button: [
        {
            text: "开启",
            action: ctx => {
                showLoading();
            }
        }
    ]
};

export {
    loadingModule
};
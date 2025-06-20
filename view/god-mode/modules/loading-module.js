import { showLoading } from "../../../src/ui/loading";

const loadingModule = {
    menuText: "Loading 效果展示",
    description: "用于展示 Loading 动画效果。开启后，请切换菜单选项关闭。",
    icon: "data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgc3R5bGU9IndpZHRoOiAxZW07aGVpZ2h0OiAxZW07dmVydGljYWwtYWxpZ246IG1pZGRsZTtmaWxsOiBjdXJyZW50Q29sb3I7b3ZlcmZsb3c6IGhpZGRlbjsiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBwLWlkPSI2Mzc3Ij48cGF0aCBkPSJNMzg0IDEyOEE2NCA2NCAxMzY4MCAxIDAgNjQwIDEyOCA2NCA2NCAxMzY4MCAxIDAgMzg0IDEyOHpNNjU1LjUzIDI0MC40N0E2NCA2NCAxMzY4MCAxIDAgOTExLjUzIDI0MC40NyA2NCA2NCAxMzY4MCAxIDAgNjU1LjUzIDI0MC40N3pNODMyIDUxMkEzMiAzMiAxMzY4MCAxIDAgOTYwIDUxMiAzMiAzMiAxMzY4MCAxIDAgODMyIDUxMnpNNzE5LjUzIDc4My41M0EzMiAzMiAxMzY4MCAxIDAgODQ3LjUzIDc4My41MyAzMiAzMiAxMzY4MCAxIDAgNzE5LjUzIDc4My41M3pNNDQ4LjAwMiA4OTZBMzIgMzIgMTM2ODAgMSAwIDU3Ni4wMDIgODk2IDMyIDMyIDEzNjgwIDEgMCA0NDguMDAyIDg5NnpNMTc2LjQ3MiA3ODMuNTNBMzIgMzIgMTM2ODAgMSAwIDMwNC40NzIgNzgzLjUzIDMyIDMyIDEzNjgwIDEgMCAxNzYuNDcyIDc4My41M3pNMTQ0LjQ3MiAyNDAuNDdBNDggNDggMTM2ODAgMSAwIDMzNi40NzIgMjQwLjQ3IDQ4IDQ4IDEzNjgwIDEgMCAxNDQuNDcyIDI0MC40N3pNNTYgNTEyQTM2IDM2IDEzNjgwIDEgMCAyMDAgNTEyIDM2IDM2IDEzNjgwIDEgMCA1NiA1MTJ6IiBmaWxsPSIjMDAwMDAwIiBwLWlkPSI2Mzc4Ij48L3BhdGg+PC9zdmc+",
    properties: [
        { id: "gid", type: "string", label: "集团号", value: "" }
    ],
    actions: [
        {
            text: "开启",
            action: ctx => {
                showLoading();
            }
        },
        {
            text: "Toast",
            action: ctx => {
                ctx.toast("我是测试用的Message信息");
            }
        }
    ]
};

export {
    loadingModule
};
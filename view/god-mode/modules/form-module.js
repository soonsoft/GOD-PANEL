import { jsonRender } from "../../../src/ui/panel-ui";
import { httpDownload } from "../../../src/http";

const formModule = {
    menuText: "常规表单系统",
    icon: "data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgc3R5bGU9IndpZHRoOiAxZW07aGVpZ2h0OiAxZW07dmVydGljYWwtYWxpZ246IG1pZGRsZTtmaWxsOiBjdXJyZW50Q29sb3I7b3ZlcmZsb3c6IGhpZGRlbjsiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBwLWlkPSI1NDQwIj48cGF0aCBkPSJNODg4LjgzMiAwSDEzNS4xNjhjLTMyLjI1NiAwLTU4Ljg4IDI2LjExMi01OC44OCA1OC44OHY5MDYuMjRjMCAzMi4yNTYgMjYuMTEyIDU4Ljg4IDU4Ljg4IDU4Ljg4aDc1My4xNTJjMzIuMjU2IDAgNTguODgtMjYuMTEyIDU4Ljg4LTU4Ljg4di05MDYuMjRjMC41MTItMzIuNzY4LTI2LjExMi01OC44OC01OC4zNjgtNTguODh6IG0tMTY0Ljg2NCAxNzYuNjRjMzAuNzIgMCA1NS44MDggMjUuMDg4IDU1LjgwOCA1NS44MDhzLTI1LjA4OCA1NS44MDgtNTUuODA4IDU1LjgwOC01NS44MDgtMjUuMDg4LTU1LjgwOC01NS44MDggMjQuNTc2LTU1LjgwOCA1NS44MDgtNTUuODA4eiBtLTIxMS45NjggMGMzMC43MiAwIDU1LjgwOCAyNS4wODggNTUuODA4IDU1LjgwOFM1NDIuNzIgMjg4LjI1NiA1MTIgMjg4LjI1NnMtNTUuODA4LTI1LjA4OC01NS44MDgtNTUuODA4UzQ4MS4yOCAxNzYuNjQgNTEyIDE3Ni42NHogbS0yMTEuOTY4IDBjMzAuNzIgMCA1NS44MDggMjUuMDg4IDU1LjgwOCA1NS44MDhzLTI1LjA4OCA1NS44MDgtNTUuODA4IDU1LjgwOC01NS44MDgtMjUuMDg4LTU1LjgwOC01NS44MDggMjUuMDg4LTU1LjgwOCA1NS44MDgtNTUuODA4eiBtMjA4Ljg5NiA2MDYuMjA4SDI4NS4xODRjLTI0LjU3NiAwLTQ0LjAzMi0xOS45NjgtNDQuMDMyLTQ0LjAzMiAwLTI0LjU3NiAxOS45NjgtNDQuMDMyIDQ0LjAzMi00NC4wMzJoMjIzLjc0NGMyNC41NzYgMCA0NC4wMzIgMTkuOTY4IDQ0LjAzMiA0NC4wMzIgMCAyNC4wNjQtMTkuNDU2IDQ0LjAzMi00NC4wMzIgNDQuMDMyeiBtMjI5Ljg4OC0yMTEuOTY4SDI4NS4xODRjLTI0LjU3NiAwLTQ0LjAzMi0xOS45NjgtNDQuMDMyLTQ0LjAzMiAwLTI0LjU3NiAxOS45NjgtNDQuMDMyIDQ0LjAzMi00NC4wMzJoNDUzLjEyYzI0LjU3NiAwIDQ0LjAzMiAxOS45NjggNDQuMDMyIDQ0LjAzMiAwLjUxMiAyNC4wNjQtMTkuNDU2IDQ0LjAzMi00My41MiA0NC4wMzJ6IiBmaWxsPSIjMDQwMDAwIiBwLWlkPSI1NDQxIj48L3BhdGg+PC9zdmc+",
    properties: [
        { id: "text1", type: "string", label: "文本框", value: "" },
        { id: "text2", type: "string", label: "必输项", value: "", required: true },
        { id: "textarea1", type: "text", label: "多行文本框", value: "" },
        { id: "number1", type: "number", label: "数字", step: 5 },
        { id: "date1", type: "date", label: "日期" },
        { id: "range1", type: "range", label: "滑动条", min: 0, max: 100, value: 25 },
        { 
            id: "select1", 
            type: "select", 
            label: "请选择国家与地区", 
            options: [
                { value: "CN", text: "中国大陆", selected: true },
                { value: "HK", text: "香港" },
                { value: "SG", text: "新加坡" },
                { value: "US", text: "美国" },
                { value: "UK", text: "英国" },
                { value: "RA", text: "俄罗斯" },
                { value: "FR", text: "法国" }
            ]
        },
        { 
            id: "groupSelect1", 
            type: "select", 
            label: "分组下拉选项", 
            options: [
                { value: "option1"},
                { value: "option2", group: "group1" },
                { value: "option3", group: "group1" },
                { value: "option4", group: "group2" },
                { value: "option5", group: "group3" },
                { value: "option6", group: "group4" },
                { value: "option7", group: "group5" },
                { value: "option8", selected: true }
            ]
        },
        { 
            id: "radio1", 
            type: "radio", 
            label: "请选择", 
            options: [
                { value: "continue", text: "继续", selected: true },
                { value: "break", text: "中断" }
            ]
        },
        { 
            id: "checkbox1", 
            type: "checkbox", 
            label: "选择文件类型", 
            options: [
                { value: "json", text: "Json", selected: true },
                { value: "txt", text: "文本" },
                { value: "exe", text: "可执行文件（通常是指 Microsoft Windows 操作系统中的 .exe 文件，双击后可以允许一个应用程序。）" },
                { value: "app", text: "应用程序" },
                { value: "mp3", text: "音频文件", selected: true },
                { value: "mp4", text: "视频文件" }
            ]
        }
    ],
    button: [
        {
            text: "显示表单数据",
            action: ctx => {
                if(ctx.checkCurrentViewModel().invalid(v => jsonRender(v.messages))) {
                    return;
                }
                let vm = ctx.getCurrentViewModel();
                jsonRender(vm);
            }
        }
    ],
    subModules: [
        {
            menuText: "文件上传",
            properties: [
                { id: "fileName", type: "string", label: "模板文件名称（包含后缀）", required: true, value: "" },
                { 
                    id: "file", 
                    type: "file", 
                    label: "上传", 
                    action: ctx => {
                        if(ctx.checkCurrentViewModel().invalid(v => jsonRender(v.messages))) {
                            return;
                        }
                        let files = ctx.element.files;
                        let vm = ctx.getCurrentViewModel();
                        jsonRender(`开始上传 ${vm.fileName}`);
                    }
                }
            ]
        },
        {
            menuText: "文件下载",
            properties: [
                { id: "fileName", type: "string", label: "文件名称", required: true, value: "" }
            ],
            button: [
                {
                    text: "显示文件列表",
                    action: ctx => {
                        if(ctx.checkCurrentViewModel().invalid(v => jsonRender(v.messages))) {
                            return;
                        }
                        let vm = ctx.getCurrentViewModel();
                        let data = [
                            `<a href="javascript:void(0)" data-action-name="download" data-filename="${vm.fileName}">${vm.fileName}</a>`
                        ];
                        jsonRender(data);
                    }
                },
                {
                    actionName: "download",
                    action: ctx => {
                        let elem = ctx.element;
                        let fileName = elem.dataset.filename;
                        httpDownload("https://wowtabextension.blob.core.windows.net/wowtabwallpapers/2024-09-12.jpg", fileName, "GET")
                            .catch(e => jsonRender(e));
                    }
                }
            ]
        }
    ]
};

export {
    formModule
}
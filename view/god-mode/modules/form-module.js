import { jsonRender } from "../../../src/ui/panel-ui";

const formModule = {
    menuText: "常规表单系统",
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
            id: "checkbox1", 
            type: "checkbox", 
            label: "选择文件类型", 
            options: [
                { value: "json", text: "Json", selected: true },
                { value: "txt", text: "文本" },
                { value: "exe", text: "可执行文件自定义表格自定义表格自定义表格自定义表格自定义表格" },
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
                            `<a href="javascript:void(0)" data-action="download" data-filename="${vm.fileName}">${vm.fileName}</a>`
                        ];
                        jsonRender(data);
                    }
                },
                {
                    actionName: "download",
                    action: ctx => {
                        let elem = ctx.element;
                        let fileName = elem.dataset.filename;
                        jsonRender(`${fileName} 下载完成`);
                    }
                }
            ]
        }
    ]
};

export {
    formModule
}
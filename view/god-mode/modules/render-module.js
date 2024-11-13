import { jsonRender, imageRender, tableRender } from "../../../src/ui/panel-ui";

const renderModule = {
    menuText: "显示结果集",
    icon: "data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgc3R5bGU9IndpZHRoOiAxZW07aGVpZ2h0OiAxZW07dmVydGljYWwtYWxpZ246IG1pZGRsZTtmaWxsOiBjdXJyZW50Q29sb3I7b3ZlcmZsb3c6IGhpZGRlbjsiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBwLWlkPSI3NDkyIj48cGF0aCBkPSJNMTI4IDExNy4zMzMzMzNBOTYgOTYgMCAwIDAgMzIgMjEzLjMzMzMzM3Y1OTcuMzMzMzM0QTk2IDk2IDAgMCAwIDEyOCA5MDYuNjY2NjY3aDc2OEE5NiA5NiAwIDAgMCA5OTIgODEwLjY2NjY2N1YyMTMuMzMzMzMzQTk2IDk2IDAgMCAwIDg5NiAxMTcuMzMzMzMzSDEyOHogbTEwLjY2NjY2NyAyMzQuNjY2NjY3di0xMjhoNzQ2LjY2NjY2NnYxMjhIMTM4LjY2NjY2N3ogbTAgMjEzLjMzMzMzM3YtMTA2LjY2NjY2NmgxNzAuNjY2NjY2djEwNi42NjY2NjZoLTE3MC42NjY2NjZ6IG0yNzcuMzMzMzMzIDB2LTEwNi42NjY2NjZoMTkydjEwNi42NjY2NjZoLTE5MnogbTI5OC42NjY2NjcgMHYtMTA2LjY2NjY2NmgxNzAuNjY2NjY2djEwNi42NjY2NjZoLTE3MC42NjY2NjZ6IG0tNTc2IDIzNC42NjY2Njd2LTEyOGgxNzAuNjY2NjY2djEyOGgtMTcwLjY2NjY2NnogbTI3Ny4zMzMzMzMgMHYtMTI4aDE5MnYxMjhoLTE5MnogbTI5OC42NjY2NjcgMHYtMTI4aDE3MC42NjY2NjZ2MTI4aC0xNzAuNjY2NjY2eiIgZmlsbD0iIzAwMDAwMCIgcC1pZD0iNzQ5MyI+PC9wYXRoPjwvc3ZnPg==",
    properties: [
        { 
            id: "viewMode", 
            type: "select", 
            label: "请选择视图类型", 
            options: [
                { value: "json", text: "Json", selected: true },
                { value: "table", text: "表格" },
                { value: "custom-table", text: "自定义表格" },
                { value: "json-array", text: "Json Array" },
                { value: "text", text: "文本" },
                { value: "image", text: "图片" }
            ]
        }
    ],
    button: [
        {
            text: "显示视图",
            action: ctx => {
                if(ctx.checkCurrentViewModel().invalid(v => jsonRender(v.messages))) {
                    return;
                }
                let vm = ctx.getCurrentViewModel();
                let result, formatter;
                switch(vm.viewMode) {
                    case "image":
                        imageRender(
                            "https://wowtabextension.blob.core.windows.net/wowtabwallpapers/2024-09-28.jpg",
                            "https://wowtabextension.blob.core.windows.net/wowtabwallpapers/2024-09-12.jpg",
                            "https://wowtabextension.blob.core.windows.net/wowtabwallpapers/2024-09-06-9.png"
                        );
                        return;
                    case "json":
                        result = {
                            customerName: "张信哲",
                            customerType: "个人客户",
                            userInfo: {
                                username: "Jeff",
                                cellPhone: "13976117766"
                            },
                            accountInfo: {
                                hkAccount: {
                                    accountNo: "HK0011",
                                    regionCode: "HK",
                                    tradeAccount: [
                                        {
                                            tradeAccountType: "代理人账户",
                                            accountNo: "123456"
                                        },
                                        {
                                            tradeAccountType: "全委账户",
                                            accountNo: "987651"
                                        },
                                        {
                                            tradeAccountType: "小贷账户",
                                            accountNo: "135792"
                                        }
                                    ]
                                },
                                sgAccount: {
                                    accountNo: "SG2211",
                                    regionCode: "SG",
                                    tradeAccount: [
                                        {
                                            tradeAccountType: "直投账户",
                                            accountNo: "665588"
                                        }
                                    ]
                                }
                            }
                        };
                        formatter = {
                            tradeAccount: item => {
                                return [
                                    item.tradeAccountType,
                                    item.accountNo
                                ];
                            }
                        };
                        break;
                    case "table":
                        tableRender([
                            { name: "Jack", age: 30, gender: 1 },
                            { name: "Lucy", age: 18, gender: 0 },
                            { name: "Lily", age: 19, gender: 0 }
                        ]);
                        return;
                    case "custom-table":
                        tableRender(
                            [
                                { text: "#", align: "right", width: 40, formatter: (_, op) => op.rowIndex + 1 },
                                { column: "code", text: "编码", align: "center", width: 100 },
                                { column: "fileName", text: "名称" },
                                { column: "type", text: "类型", width: 50, align: "center" },
                                { column: "count", text: "数量", width: 50, align: "right" },
                                { column: "extInfo", text: "状态", width: 80, align: "center", formatter: val => val.extName === ".pdf" ? "PDF" : "unknown" },
                                { column: "extInfo.updateTime", text: "更新时间", width: 120, align: "center" },
                                { text: "操作", width: 60, align: "center", formatter: (_, op) =>`<a href="javascript:void(0)" data-action-name="download" data-value="${op.row.code}">下载</a>` }
                            ], 
                            [
                                { code: "A001", fileName: "居民身份证.png", type: "703", count: 100, extInfo: { extName: ".png", updateTime: "2024-01-01" } },
                                { code: "A002", fileName: "来往港澳通行证.png", type: "702", count: 87, extInfo: { extName: ".pdf", updateTime: "2024-01-02" } },
                                { code: "A003", fileName: "国际护照.png", type: "711", count: 1, extInfo: { extName: ".png", updateTime: "2024-01-03" } },
                                { code: "A004", fileName: "台湾身份证.png", type: "707", count: 103, extInfo: { extName: ".pdf", updateTime: "2024-01-04" } }
                            ]
                        );
                        return;
                    case "json-array":
                        result = {
                            customerName: "张信哲",
                            customerNameEn: "Jeff",
                            bankcardList: [
                                {
                                    bankName: "渣打银行",
                                    bankAccountName: "张信哲",
                                    bankAccountNo: "6623 8907 9876 1678 123"
                                },
                                {
                                    bankName: "招商银行香港分行",
                                    bankAccountName: "张信哲",
                                    bankAccountNo: "7789 8907 9965 1678 123"
                                }
                            ],
                            certificates: [
                                "中国居民身份证", "港澳往来通行证", "美国护照", "台湾身份证"
                            ]
                        };
                        formatter = {
                            bankcardList: elem => {
                                return [
                                    elem.bankName,
                                    elem.bankAccountName,
                                    elem.bankAccountNo
                                ];
                            }
                        };
                        break;
                    default:
                        result = "显示文本信息";
                        break;
                }
                jsonRender(result, formatter);
            }
        },
        {
            actionName: "download",
            action: ctx => {
                let elem = ctx.element;
                alert(elem.dataset.value);
            }
        }
    ]
};

export {
    renderModule
};
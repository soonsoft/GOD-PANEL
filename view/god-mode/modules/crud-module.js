//#region  DB

const database = [
    { name: "钢铁侠", userName: "Tony", roleName: "CEO", status: "1" },
    { name: "Thomas.A.Anderson", userName: "Neo", roleName: "TheONE", status: "1" }
];
function query(pageIndex, pageSize, param) {
    let startIndex = (pageIndex - 1) * pageSize;
    let endIndex = Math.min(database.length, startIndex + pageSize);
    
    let queryContitions = [];
    if(param) {
        if(param.name) {
            queryContitions.push(i => i.name.includes(param.name));
        }
        if(param.status) {
            queryContitions.push(i => i.status === param.status);
        }
        if(param.userName) {
            queryContitions.push(i => i.userName.includes(param.userName));
        }
        if(param.roleName) {
            queryContitions.push(i => i.roleName.includes(param.roleName));
        }
    }

    let data = []
    for(let i = startIndex; i < endIndex; i++) {
        let item = database[i];
        if(queryContitions.length > 0) {
            let continueFlag = false;
            for(let j = 0; j < queryContitions.length; j++) {
                if(!queryContitions[j](item)) {
                    continueFlag = true;
                    break;
                }
            }
            if(continueFlag) {
                continue;
            }
        }
        data.push(item);
    }
    return data;
}
function saveData(data) {
    database.push(data);
}
function deleteData(data) {
    for(let i = 0; i < database.length; i++) {
        if(data === database[i]) {
            database.splice(i, 1);
            return;
        }
    }
};

//#endregion

function createProperties(data) {
    let properties = [
        { id: "name", type: "string", label: "姓名" },
        { 
            id: "status", 
            type: "select", 
            label: "状态", 
            value: "", 
            options: [
                { value: "1", text: "有效" },
                { value: "0", text: "无效" }
            ],
            required: true
        },
        { id: "userName", type: "string", label: "用户名" },
        { id: "roleName", type: "string", label: "角色" }
    ];
    if(data) {
        properties.forEach(p => {
            let value = data[p.id];
            p.value = value;
        });
    }
    return properties;
}

const crudModule = {
    menuText: "管理页面示例",
    layout: "top-bottom",
    onOpened: ctx => {
        ctx.callAction("query", {
            pageIndex: 1,
            pageSize: 20
        });
    },
    properties: createProperties(),
    actions: [
        {
            actionName: "query",
            text: "查询",
            action: ctx => {
                let pageIndex = ctx.param ? ctx.param.pageIndex : 1;
                let pageSize = ctx.param ? ctx.param.pageSize : 20;

                let queryParam = ctx.getCurrentViewModel();

                let columnData = [
                    { text: "#", align: "right", width: 40, formatter: (_, op) => op.rowIndex + 1 },
                    { text: "姓名", column: "name" },
                    { text: "用户名", column: "userName" },
                    { text: "角色", column: "roleName" },
                    { text: "状态", column: "status", width: 60, align: "center", formatter: (val) => val === "1" ? "🟢" : "🔴" },
                    {
                        text: "操作", 
                        width: 150, 
                        align: "center",
                        formatter: (_, op) => {
                            return [
                                ctx.createLinkButton("detail", "详情", { rowIndex: op.rowIndex }),
                                ctx.createLinkButton("edit", "编辑", { rowIndex: op.rowIndex }),
                                ctx.createLinkButton("delete", "删除", { rowIndex: op.rowIndex })
                            ];
                        }
                    }
                ];
                let rowCount = database.length;
                let tableData = query(pageIndex, pageSize, queryParam);
                ctx.setData("tableData", tableData);
                const actionName = "pageChanged";
                ctx.tableRender(columnData, tableData, {
                    renderWith: () => ctx.pageButtonRender({ pageIndex, pageSize, rowCount, actionName })
                });
            }
        },
        {
            actionName: "pageChanged",
            action: ctx => {
                let elem = ctx.element;
                let pageIndex = parseInt(elem.dataset.pageIndex);
                let pageSize = parseInt(elem.dataset.pageSize);

                ctx.callAction("query", {
                    pageIndex,
                    pageSize
                });
            }
        },
        {
            actionName: "detail",
            action: ctx => {
                let rowIndex = ctx.getElementData("rowIndex");
                let tableData = ctx.getData("tableData");
                let rowData = tableData[rowIndex];
                ctx.showDetailPanel()
                    .then(childCtx => {
                        return childCtx.jsonRender(rowData);
                    });
            }
        },
        {
            actionName: "edit",
            action: ctx => {
                let rowIndex = ctx.getElementData("rowIndex");
                let tableData = ctx.getData("tableData");
                let rowData = tableData[rowIndex];
                ctx.showDetailPanel({
                    properties: createProperties(rowData),
                    actions: [
                        {
                            text: "保存",
                            action: async childCtx => {
                                if(childCtx.checkCurrentViewModel().invalid(v => childCtx.jsonRender(v.messages))) {
                                    return;
                                }

                                let data = childCtx.getCurrentViewModel();
                                rowData.name = data.name;
                                rowData.userName = data.userName;
                                rowData.roleName = data.roleName;
                                rowData.status = data.status;

                                await childCtx.hideDetailPanel();
                                ctx.callAction("query");
                            }
                        },
                        {
                            text: "返回",
                            action: childCtx => {
                                childCtx.hideDetailPanel();
                            }
                        }
                    ]
                });
            }
        },
        {
            actionName: "delete",
            action: ctx => {
                let rowIndex = ctx.getElementData("rowIndex");
                let tableData = ctx.getData("tableData");
                let rowData = tableData[rowIndex];

                if(confirm("删除后数据将无法恢复，是否确定删除？")) {
                    deleteData(rowData);
                    ctx.callAction("query");
                }
            }
        },
        {
            text: "新增",
            action: ctx => {
                ctx.showDetailPanel({
                    properties: createProperties(),
                    actions: [
                        {
                            text: "保存",
                            action: async childCtx => {
                                debugger
                                if(childCtx.checkCurrentViewModel().invalid(v => childCtx.jsonRender(v.messages))) {
                                    return;
                                }
                                let data = childCtx.getCurrentViewModel();
                                saveData(data);
                                await childCtx.hideDetailPanel()
                                ctx.callAction("query");
                            }
                        },
                        {
                            text: "返回",
                            action: childCtx => {
                                childCtx.hideDetailPanel();
                            }
                        }
                    ]
                });
            }
        },
        {
            text: "更新条件",
            action: ctx => {
                ctx.updatePropertyInfo("status", p => p.options.push({value: "2", text: "啊啊"}));
                ctx.updatePropertyInfo("status", p => p.options.push({value: "3", text: "biubiu"}));
                ctx.updatePropertyInfo("roleName", p => p.label = "Roles");
            }
        }
    ]
};

export {
    crudModule
};
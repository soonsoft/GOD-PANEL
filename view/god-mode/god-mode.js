import "./god-mode.css";
import { ready, appendHtml, on, createEventProxy } from "../../src/common";
import { initModules, onClosed, setModuleDisabled } from "../../src/ui/module-manager";
import { onLoadingHidden, onLoadingShown, initLoading, hideLoading } from "../../src/ui/loading";
import { formModule } from "./modules/form-module";
import { loadingModule } from "./modules/loading-module";
import { renderModule } from "./modules/render-module";
import { aboutModule } from "./modules/about-module";
import { crudModule } from "./modules/crud-module";

const moduleList = [
    formModule,
    loadingModule,
    renderModule,
    crudModule,
    aboutModule
];

const godInfo = {
    version: "1.0.0"
};

const backActionIcon = "data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjIyNjQiPjxwYXRoIGQ9Ik0xNTYuNjA4IDQ4Ny44NTkyYzEuMTU2MjY3LTEuMTM3MDY3IDIuNjQ4NTMzLTEuNjIyNCAzLjkxODkzMy0yLjU1ODkzM2wzMDYuNjY2NjY3LTMwMS41NjkwNjdjMTMuMTk1NzMzLTEyLjk3MDY2NyAzNC41ODY2NjctMTIuOTcwNjY3IDQ3Ljc4MTMzMyAwIDEzLjE5NDY2NyAxMi45NzgxMzMgMTMuMTk0NjY3IDM0LjAxMzg2NyAwIDQ2Ljk4NzczM0wyNjMuMzAyNCA0NzguMjEwMTMzbDU3OS4yMDMyIDBjMTguOTc4MTMzIDAgMzQuMzYyNjY3IDE1LjEyODUzMyAzNC4zNjI2NjcgMzMuNzg5ODY3IDAgMTguNjYyNC0xNS4zODQ1MzMgMzMuNzkzMDY3LTM0LjM2MjY2NyAzMy43OTMwNjdMMjYzLjMwMjQgNTQ1Ljc5MzA2N2wyNTEuNjcxNDY3IDI0Ny40ODY5MzNjMTMuMTk0NjY3IDEyLjk3MTczMyAxMy4xOTQ2NjcgMzQuMDEwNjY3IDAgNDYuOTg0NTMzLTEzLjE5NDY2NyAxMi45NzQ5MzMtMzQuNTg2NjY3IDEyLjk3NDkzMy00Ny43ODEzMzMgMGwtMzA2LjY2NjY2Ny0zMDEuNTYxNmMtMS4yNjkzMzMtMC45Mzk3MzMtMi43NjI2NjctMS40MjE4NjctMy45MTg5MzMtMi41NjIxMzMtNi4zMzQ5MzMtNi4yMzA0LTkuMjQwNTMzLTE0LjM0MDI2Ny05LjQ3NzMzMy0yMi41MDI0QzE0Ny4zNjc0NjcgNTAyLjIwMDUzMyAxNTAuMjczMDY3IDQ5NC4wOTA2NjcgMTU2LjYwOCA0ODcuODU5MkwxNTYuNjA4IDQ4Ny44NTkyek0xNTYuNjA4IDQ4Ny44NTkyIiBwLWlkPSIyMjY1Ij48L3BhdGg+PC9zdmc+";
const menuActionIcon = "data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjQwMDEiPjxwYXRoIGQ9Ik03MzYgMzUySDI4OGEzMiAzMiAwIDEgMSAwLTY0aDQ0OGEzMiAzMiAwIDAgMSAwIDY0eiBtMCAxOTJIMjg4YTMyIDMyIDAgMSAxIDAtNjRoNDQ4YTMyIDMyIDAgMCAxIDAgNjR6IG0wIDE5MkgyODhhMzIgMzIgMCAwIDEgMC02NGg0NDhhMzIgMzIgMCAwIDEgMCA2NHoiIHAtaWQ9IjQwMDIiPjwvcGF0aD48L3N2Zz4=";

onClosed(() => hideLoading());

function insertGodPanel() {
    godInfo.app = document.getElementById("app");
    if(godInfo.app) {
        godInfo.app.classList.add("app-default");
    }

    const template = `
        <div id="godPanel" class="god-panel-default">
            <div id="godBackground">
                <div class="rectangle element2"></div>
                <div class="rectangle element1"></div>
                <div class="rectangle element3"></div>
            </div>
            <div id="godContentPanel">
                <div id="godPanelSider">
                    <div class="top-panel">
                        <div class="header-ctrl-panel">
                            <button class="window-button" id="redButton"></button>
                            <button class="window-button" id="yellowButton"></button>
                            <button class="window-button" id="greenButton"></button>
                        </div>
                        <div class="header-action-panel">
                            <button id="backAction" disabled>
                                <img src="${backActionIcon}">
                            </button>
                            <button id="menuAction">
                                <img src="${menuActionIcon}" style="transform:scale3d(1.2, 1.2, 1.2)">
                            </button>
                        </div>
                    </div>
                    <div class="logo-panel">
                        <h1 class="god-text"><span>GOD PANEL</span></h1>
                    </div>
                    <div id="godMenuPanel"></div>
                    <div class="bottom-panel"></div>
                </div>
                <div id="godPanelContainer">
                    <div id="godDetailPanel">
                        <div class="content-panel" style="justify-content:center">
                            <h1 class="primary-color" style="text-align:center;">Welcome to the God Panel</h1>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <a id="godHandle" class="god-handle-default"></a>
    `;

    appendHtml(template);

    godInfo.godBackground = document.getElementById("godBackground");
    godInfo.godContentPanel = document.getElementById("godContentPanel");
    godInfo.godMenuPanel = document.getElementById("godMenuPanel");
    godInfo.godDetailPanel = document.getElementById("godDetailPanel");

    godInfo.clickProxy = createEventProxy(godInfo.godContentPanel, "click");
    godInfo.changeProxy = createEventProxy(godInfo.godContentPanel, "change");
    
    const godPanel = document.getElementById("godPanel");
    const godHandle = document.getElementById("godHandle");

    function godPanelShow() {
        godPanel.classList.add("god-panel-show");
        godHandle.classList.remove("god-handle-show");
        if(godInfo.app) {
            godInfo.app.classList.add("app-hide");
        }
    }

    function godPanelHide() {
        godPanel.classList.remove("god-panel-show");
        godHandle.classList.add("god-handle-show");
        if(godInfo.app) {
            requestAnimationFrame(() => {
                godInfo.app.classList.remove("app-hide");
            }, 320);
        }
    }

    if(godPanel && godHandle) {
        const appDisplayValue = godInfo.app ? godInfo.app.style.display : "block";
        // transitionend, transitionstart, transitioncancel
        on(godPanel, "transitionstart", event => {
            if(!godPanel.classList.contains("god-panel-show")) {
                if(godInfo.app) {
                    godInfo.app.style.display = appDisplayValue;
                }
            }
        });
        on(godPanel, "transitionend", event => {
            if(godPanel.classList.contains("god-panel-show")) {
                if(godInfo.app) {
                    godInfo.app.style.display = "none";
                }
            }
        });
        requestAnimationFrame(() => godPanelShow());

        on(godHandle, "click", e => godPanelShow());
        godInfo.clickProxy.on((elem, e) => {
            let id = elem.id;
            switch(id) {
                case "redButton":
                    godPanelHide();
                    break;
                case "yellowButton":
                    alert(id);
                    break;
                case "greenButton":
                    alert(id);
                    break;
                default:
                    return;
            }
        });
    }
}

function loadingInitial() {
    onLoadingShown(() => setModuleDisabled(true));
    onLoadingHidden(() => setModuleDisabled(false));
    initLoading();
}

ready(() => {
    insertGodPanel();
    loadingInitial();
    initModules(moduleList, godInfo);
});


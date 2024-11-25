import "./god-mode.css";
import { ready, appendHtml, on } from "../../src/common";
import { initModules, onClosed, setModuleDisabled } from "../../src/ui/module-manager";
import { onLoadingHidden, onLoadingShown, initLoading, hideLoading } from "../../src/ui/loading";
import { formModule } from "./modules/form-module";
import { loadingModule } from "./modules/loading-module";
import { renderModule } from "./modules/render-module";
import { aboutModule } from "./modules/about-module";

const moduleList = [
    formModule,
    loadingModule,
    renderModule,
    aboutModule
];

const godInfo = {
    version: "1.0.0"
};

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
                <div id="godPanelHeader">
                    <button id="closeButton"></button>
                    <span class="god-text">I AM THE GOD PANEL</span>
                </div>
                <div id="godPanelContainer">
                    <div id="godMenuPanel"></div>
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
            setTimeout(() => {
                godInfo.app.classList.remove("app-hide");
            }, 320);
        }
    }

    if(godPanel && godHandle) {
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
        setTimeout(() => godPanelShow());

        on(godHandle, "click", e => godPanelShow());

        const closeButton = document.getElementById("closeButton");
        if(closeButton) {
            on(closeButton, "click", e => godPanelHide());
        }
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


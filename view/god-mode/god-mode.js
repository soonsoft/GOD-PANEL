import "./god-mode.css";
import { ready, appendHtml, on, html, htmlCondition } from "../../src/common";
import { initModules, onClosed, setModuleDisabled } from "./modules/module-manager";
import { onLoadingHidden, onLoadingShown, initLoading } from "../../src/ui/loading";

const godInfo = {
};

onClosed(() => godInfo.loading = false);

function insertGodPanel() {
    godInfo.app = document.getElementById("app");
    if(godInfo.app) {
        godInfo.app.classList.add("app-default");
    }

    const template = `
        <div id="godPanel" class="god-panel-default">
            <div id="godBackground"></div>
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
        on(godPanel, "transitionend", event => {
            if(godPanel.classList.contains("god-panel-show")) {
                if(godInfo.app) {
                    godInfo.app.style.display = "none";
                }
            } else {
                if(godInfo.app) {
                    godInfo.app.style.display = appDisplayValue;
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
    initModules(godInfo.godMenuPanel, godInfo.godDetailPanel);
});


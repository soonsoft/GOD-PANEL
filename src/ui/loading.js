import { isFunction } from "../common";
import { addEventListener, dispatchEvent } from "../event";

let handle = {
    init: false
};

function showLoading() {
    if(handle.init) {
        handle.loading = true;
    }
}

function hideLoading() {
    if(handle.init) {
        handle.loading = false;
    }
}

function onLoadingShown(fn) {
    if(isFunction(fn)) {
        addEventListener("loading-shown", fn);
    } else {
        dispatchEvent("loading-shown");
    }
}

function onLoadingHidden(fn) {
    if(isFunction(fn)) {
        addEventListener("loading-hidden", fn);
    } else {
        dispatchEvent("loading-hidden");
    }
}

function initLoading() {
    let loadingValue = 0;
    let loadingTimeout = null;
    Object.defineProperty(handle, "loading", {
        configurable: true,
        enumerable: true,
        get: () => {
            return loadingValue > 0;
        },
        set: val => {
            if(!!val) {
                loadingValue++;
                if(loadingValue === 1) {
                    loadingTimeout = setTimeout(() => {
                        loadingTimeout = null;
                        document.getElementById("loadingElement")?.classList.add("loading-show");
                        document.getElementById("detailContentPanel")?.classList.add("content-panel-disabled");
                        onLoadingShown();
                    }, 1000);
                }
            } else {
                if(loadingValue > 0) {
                    loadingValue--;
                    if(loadingValue === 0) {
                        if(loadingTimeout) {
                            clearTimeout(loadingTimeout);
                            loadingTimeout = null;
                        }
                        document.getElementById("loadingElement")?.classList.remove("loading-show");
                        document.getElementById("detailContentPanel")?.classList.remove("content-panel-disabled");
                        onLoadingHidden();
                    }
                }
            }
        }
    });
    handle.init = true;
}

export {
    showLoading,
    hideLoading,
    onLoadingShown,
    onLoadingHidden,
    initLoading
};
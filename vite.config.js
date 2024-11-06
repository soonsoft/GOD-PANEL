import { resolve } from "path";
import { defineConfig } from "vite";
import { loadHtmlEntry } from "./config/html-entry";

const viewRootPath = resolve(__dirname, "view");
const htmlEntry = loadHtmlEntry(viewRootPath);
// console.log(htmlEntry);

const config = {
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                ...htmlEntry
            }
        }
    }
};

export default defineConfig(config);
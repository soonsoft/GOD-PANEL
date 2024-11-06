import { join, extname, basename } from "path";
import * as fs from "fs";

function loadEntry(dirPath, predicate) {
    if(!dirPath) {
        throw new TypeError("the parameter dirPath is required.");
    }
    if(typeof predicate !== "function") {
        throw new TypeError("the parameter predicate is required.");
    }

    const entry = {};
    const stack = [dirPath];

    function processFile(filename) {
        if(predicate(filename)) {
            let extendName = extname(filename);
            let name = basename(filename, extendName);
            entry[name] = filename;
        }
    }

    while(stack.length > 0) {
        const filename = stack.pop();
        const fileInfo = fs.statSync(filename);
        if(fileInfo.isDirectory()) {
            const subDirents = fs.readdirSync(filename, { withFileTypes: true });
            subDirents.forEach(subDirent => stack.push(join(filename, subDirent.name)));
        }

        if(fileInfo.isFile()) {
            processFile(filename);
        }
    }
    return entry;
}

function loadEntryByExtname(dirPath, extendName) {
    let extPredicate = null;
    if(typeof extendName === "string") {
        const lowerExtName = extendName.toLowerCase();
        extPredicate = filename => extname(filename).toLowerCase() === lowerExtName;
    } else if(Array.isArray(extendName)) {
        const extArray = [];
        extendName.forEach(e => {
            if(e) {
                extArray.push((e + "").toLowerCase());
            }
        });
        extPredicate = filename => {
            const ext = extname(filename).toLowerCase();
            for(let i = 0; i < extArray.length; i++) {
                if(extArray[i] === ext) {
                    return true;
                }
            }
            return false;
        };
    }

    return loadEntry(dirPath, extPredicate);
}

function loadHtmlEntry(dirPath) {
    return loadEntryByExtname(dirPath, ".html");
}

export {
    loadHtmlEntry
};
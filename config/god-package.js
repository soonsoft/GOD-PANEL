//import { readFilesContent, replaceInFiles, saveFile } from './file-loader.js';
const path = require('path');
const fileUtils = require('./file-loader.js');

const GodModeTemplatePath = path.resolve(__dirname, '../god-mode/template/god-mode-template.js');
let templateContent = fileUtils.readFile(GodModeTemplatePath);

//#region resources

const ResourcesPath = path.resolve(__dirname, '../god-mode/common/resources.js');
let resourceContents = fileUtils.readFilesContent([ ResourcesPath ]);
templateContent = templateContent.replace('// {{resources}} //', resourceContents);

//#endregion

//#region http

const HttpPath = path.resolve(__dirname, '../god-mode/common/http.js');
let httpContents = fileUtils.readFilesContent([ HttpPath ]);
templateContent = templateContent.replace('// {{http}} //', httpContents);

//#endregion

//#region modules

const GodModulePath = path.resolve(__dirname, '../god-mode/modules');
let modulePaths = fileUtils.getAllFilePaths(GodModulePath);
let moduleContents = fileUtils.readFilesContent(modulePaths, ';\r\n\r\n');
templateContent = templateContent.replace('// {{modules}} //', moduleContents);

//#endregion

//#region style

const GodStylePath = path.resolve(__dirname, '../god-mode/style/style.css');
let styleContent = fileUtils.readFile(GodStylePath);
styleContent = "style.textContent = `\r\n" + styleContent + "\r\n`;";
templateContent = templateContent.replace('// {{css-style}} //', styleContent);

//#endregion

const DistPath = path.resolve(__dirname, '../god-mode/dist/god-mode.js');
fileUtils.saveFile(DistPath, templateContent);

console.log("package is done.")

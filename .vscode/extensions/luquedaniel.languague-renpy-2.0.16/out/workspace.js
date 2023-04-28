// Workspace and file functions
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNavigationJsonFilepath = exports.getAudioFolder = exports.getImagesFolder = exports.getFileWithPath = exports.cleanUpPath = exports.getWorkspaceFolder = exports.stripWorkspaceFromFile = exports.extractFilenameWithoutExtension = exports.extractFilename = void 0;
const vscode_1 = require("vscode");
const fs = __importStar(require("fs"));
/**
 * Returns the filename.extension for the given fully qualified path
 * @param str - The full path and filename of the file
 * @returns The filename.ext of the filepath
 */
function extractFilename(str) {
    if (str) {
        str = str.replace(/\\/g, "/");
        return str.split("/").pop();
    }
    return null;
}
exports.extractFilename = extractFilename;
/**
 * Returns the filename without the path and extension for the given fully qualified path
 * @param str - The full path and filename of the file
 * @returns The filename of the filepath
 */
function extractFilenameWithoutExtension(str) {
    if (str) {
        str = str.replace(/\\/g, "/");
        const filename = str.split("/").pop();
        if (filename) {
            return filename.replace(/\.[^/.]+$/, "");
        }
    }
    return null;
}
exports.extractFilenameWithoutExtension = extractFilenameWithoutExtension;
/**
 * Strips the workspace path from the file, leaving the path relative to the workspace plus filename (e.g., `game/script.rpy`)
 * @param str - The full path and filename of the file
 * @returns The filename of the filepath (e.g., `game/script.rpy`)
 */
function stripWorkspaceFromFile(str) {
    const wf = getWorkspaceFolder();
    let filename = cleanUpPath(str);
    if (filename.toLowerCase().startsWith(wf.toLowerCase())) {
        filename = filename.substring(wf.length + 1);
    }
    while (filename.startsWith("/")) {
        filename = filename.substring(1);
    }
    return filename;
}
exports.stripWorkspaceFromFile = stripWorkspaceFromFile;
/**
 * Gets the workspace folder path (i.e., the Ren'Py base folder)
 * @returns The path of the workspace (i.e., the Ren'Py base folder)
 */
function getWorkspaceFolder() {
    if (vscode_1.workspace.workspaceFolders && vscode_1.workspace.workspaceFolders.length > 0) {
        let wf = vscode_1.workspace.workspaceFolders[0].uri.path;
        wf = cleanUpPath(wf);
        return wf;
    }
    return "";
}
exports.getWorkspaceFolder = getWorkspaceFolder;
/**
 * Gets the full path and filename of the file with invalid characters removed
 * @remarks
 * This removes the leading `/` character that appears before the path on Windows systems (e.g., `/c:/user/Documents/renpy/game/script.rpy`)
 * @param path - The full path and filename of the file
 * @returns The full path and filename of the file with invalid characters removed
 */
function cleanUpPath(path) {
    if (path.startsWith("/") && path.startsWith(":/", 2)) {
        // windows is reporting the path as "/c:/xxx"
        path = path.substring(1);
    }
    return path;
}
exports.cleanUpPath = cleanUpPath;
/**
 * Returns the filename path including the workspace folder
 * @param filename - The filename
 * @returns The filename path including the workspace folder
 */
function getFileWithPath(filename) {
    const wf = getWorkspaceFolder();
    if (wf && wf.length > 0) {
        if (filename.startsWith(wf)) {
            return filename;
        }
        let path = wf + "/game/" + filename;
        if (!fs.existsSync(path)) {
            path = wf + "/" + filename;
        }
        return path;
    }
    else {
        return filename;
    }
}
exports.getFileWithPath = getFileWithPath;
/**
 * Returns the path to the images folder including the workspace folder
 * @returns The full path to the game/images folder
 */
function getImagesFolder() {
    const workspaceFolder = getWorkspaceFolder();
    let path = workspaceFolder + "/game/images";
    if (!fs.existsSync(path)) {
        path = workspaceFolder + "/images";
    }
    return path;
}
exports.getImagesFolder = getImagesFolder;
/**
 * Returns the path to the audio folder including the workspace folder
 * @returns The full path to the game/audio folder
 */
function getAudioFolder() {
    const workspaceFolder = getWorkspaceFolder();
    let path = workspaceFolder + "/game/audio";
    if (!fs.existsSync(path)) {
        path = workspaceFolder + "/audio";
    }
    return path;
}
exports.getAudioFolder = getAudioFolder;
/**
 * Returns the path to the game/saves/navigation.json file including the workspace folder
 * @returns The full path to the navigation.json file
 */
function getNavigationJsonFilepath() {
    const filename = "saves/navigation.json";
    const filepath = getFileWithPath(filename);
    return filepath;
}
exports.getNavigationJsonFilepath = getNavigationJsonFilepath;
//# sourceMappingURL=workspace.js.map
// Completion Provider
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAutoCompleteKeywords = exports.getAutoCompleteList = exports.getCompletionList = void 0;
const vscode_1 = require("vscode");
const hover_1 = require("./hover");
const navigation_1 = require("./navigation");
const navigationdata_1 = require("./navigationdata");
/**
 * Returns an array of auto-complete items related to the keyword at the given document/position
 * @param document - The current TextDocument
 * @param position - The current Position
 * @param context - The current CompletionContext
 * @returns An array of CompletionItem
 */
function getCompletionList(document, position, context) {
    if (context.triggerKind === vscode_1.CompletionTriggerKind.TriggerCharacter) {
        const line = document.lineAt(position).text;
        const linePrefix = line.substring(0, position.character);
        if (!navigationdata_1.NavigationData.positionIsCleanForCompletion(line, position)) {
            return;
        }
        if (linePrefix.endsWith("renpy.")) {
            return navigationdata_1.NavigationData.renpyAutoComplete;
        }
        else if (linePrefix.endsWith("config.")) {
            return navigationdata_1.NavigationData.configAutoComplete;
        }
        else if (linePrefix.endsWith("gui.")) {
            return navigationdata_1.NavigationData.guiAutoComplete;
        }
        else if (linePrefix.endsWith("renpy.music.")) {
            return getAutoCompleteList("renpy.music.");
        }
        else if (linePrefix.endsWith("renpy.audio.")) {
            return getAutoCompleteList("renpy.audio.");
        }
        else {
            const prefixPosition = new vscode_1.Position(position.line, position.character - 1);
            const range = document.getWordRangeAtPosition(prefixPosition);
            const parentContext = (0, navigation_1.getCurrentContext)(document, position);
            if (range) {
                const parentPosition = new vscode_1.Position(position.line, line.length - line.trimLeft().length);
                const parent = document.getText(document.getWordRangeAtPosition(parentPosition));
                const kwPrefix = document.getText(range);
                return getAutoCompleteList(kwPrefix, parent, parentContext);
            }
            else if (context.triggerCharacter === "-" || context.triggerCharacter === "@" || context.triggerCharacter === "=" || context.triggerCharacter === " ") {
                const parentPosition = new vscode_1.Position(position.line, line.length - line.trimLeft().length);
                const parent = document.getText(document.getWordRangeAtPosition(parentPosition));
                if (parent) {
                    if (context.triggerCharacter === "=") {
                        return getAutoCompleteList(parent);
                    }
                    else {
                        return getAutoCompleteList(context.triggerCharacter, parent, parentContext);
                    }
                }
            }
        }
    }
    return undefined;
}
exports.getCompletionList = getCompletionList;
/**
 * Returns a list of CompletionItem objects for the previous keyword/statement before the current position
 * @param prefix - The previous keyword/statement
 * @param parent - The parent statement
 * @param context - The context of this keyword
 * @returns A list of CompletionItem objects
 */
function getAutoCompleteList(prefix, parent = "", context = "") {
    const newlist = [];
    const channels = getAudioChannels();
    const characters = Object.keys(navigationdata_1.NavigationData.gameObjects["characters"]);
    if (prefix === "renpy.music." || prefix === "renpy.audio.") {
        prefix = prefix.replace("renpy.", "").trim();
        const list = navigationdata_1.NavigationData.renpyAutoComplete.filter((item) => {
            if (typeof item.label === "string") {
                item.label.startsWith(prefix);
            }
        });
        for (const item of list) {
            if (typeof item.label === "string") {
                newlist.push(new vscode_1.CompletionItem(item.label.replace(prefix, ""), item.kind));
            }
        }
        return newlist;
    }
    else if (prefix === "persistent") {
        // get list of persistent definitions
        const gameObjects = navigationdata_1.NavigationData.data.location["persistent"];
        for (const key in gameObjects) {
            newlist.push(new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Value));
        }
        return newlist;
    }
    else if (prefix === "store") {
        // get list of default variables
        const defaults = navigationdata_1.NavigationData.gameObjects["define_types"];
        const filtered = Object.keys(defaults).filter((key) => defaults[key].define === "default");
        for (const key of filtered) {
            newlist.push(new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Variable));
        }
        return newlist;
    }
    else if (channels.includes(prefix)) {
        // get list of audio definitions
        if (parent && parent === "stop") {
            newlist.push(new vscode_1.CompletionItem("fadeout", vscode_1.CompletionItemKind.Keyword));
        }
        else {
            const category = navigationdata_1.NavigationData.data.location["define"];
            const audio = Object.keys(category).filter((key) => key.startsWith("audio."));
            for (const key of audio) {
                newlist.push(new vscode_1.CompletionItem(key.substring(6), vscode_1.CompletionItemKind.Variable));
            }
        }
        return newlist;
    }
    else if (navigationdata_1.NavigationData.isClass(prefix)) {
        const className = navigationdata_1.NavigationData.isClass(prefix);
        if (className) {
            return navigationdata_1.NavigationData.getClassAutoComplete(className);
        }
    }
    else if (isNamedStore(prefix)) {
        return getNamedStoreAutoComplete(prefix);
    }
    else if (isCallableContainer(prefix)) {
        return getCallableAutoComplete(prefix);
    }
    else if (isInternalClass(prefix)) {
        return getInternalClassAutoComplete(prefix);
    }
    else if (context === "label" && characters.includes(parent)) {
        // get attributes for character if we're in the context of a label
        const category = navigationdata_1.NavigationData.gameObjects["attributes"][parent];
        if (category) {
            for (const key of category) {
                newlist.push(new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Value));
            }
        }
    }
    else if (isPythonType(prefix)) {
        const defType = navigationdata_1.NavigationData.gameObjects["define_types"][prefix];
        if (defType) {
            return getAutoCompleteKeywords(defType.type, "", "python");
        }
    }
    else {
        return getAutoCompleteKeywords(prefix, parent, context);
    }
    return newlist;
}
exports.getAutoCompleteList = getAutoCompleteList;
/**
 * Returns a list of CompletionItem objects for the given keyword
 * @param keyword - The keyword to search
 * @param parent - The keyword's parent keyword
 * @param context - The context of the keyword
 * @returns A list of CompletionItem objects
 */
function getAutoCompleteKeywords(keyword, parent, context) {
    let newlist = [];
    let enumerations;
    if (context) {
        enumerations = navigationdata_1.NavigationData.autoCompleteKeywords[`${context}.${keyword}`];
    }
    if (!enumerations) {
        enumerations = navigationdata_1.NavigationData.autoCompleteKeywords[keyword];
    }
    if (enumerations) {
        const split = enumerations.split("|");
        for (const index in split) {
            if (split[index].startsWith("{")) {
                let gameDataKey = split[index].replace("{", "").replace("}", "");
                let quoted = false;
                let args = 0;
                if (gameDataKey.indexOf("!") > 0) {
                    const split = gameDataKey.split("!");
                    gameDataKey = split[0];
                    quoted = split[1] === "q";
                    if (isNormalInteger(split[1])) {
                        args = Math.floor(Number(split[1]));
                    }
                }
                if (gameDataKey === "action") {
                    // get list of screen Actions
                    const category = navigationdata_1.NavigationData.renpyFunctions.internal;
                    const transitions = Object.keys(category).filter((key) => category[key][4] === "Action");
                    if (transitions) {
                        for (const key of transitions) {
                            const detail = category[key][2];
                            newlist.push(new vscode_1.CompletionItem({ label: key, detail: detail }, vscode_1.CompletionItemKind.Value));
                        }
                    }
                    continue;
                }
                else if (gameDataKey === "function") {
                    // get list of callable functions
                    const callables = navigationdata_1.NavigationData.data.location["callable"];
                    if (callables) {
                        const filtered = Object.keys(callables).filter((key) => key.indexOf(".") === -1);
                        for (const key of filtered) {
                            const callable = callables[key];
                            const navigation = (0, hover_1.getDefinitionFromFile)(callable[0], callable[1]);
                            let detail = "";
                            if (navigation) {
                                detail = navigation.args;
                                if (args > 0) {
                                    if (navigation.args.split(",").length !== args) {
                                        continue;
                                    }
                                }
                            }
                            newlist.push(new vscode_1.CompletionItem({ label: key, detail: detail }, vscode_1.CompletionItemKind.Function));
                        }
                    }
                }
                else if (gameDataKey === "layer") {
                    const layers = getLayerConfiguration(quoted);
                    if (layers) {
                        for (const key of layers) {
                            newlist.push(key);
                        }
                    }
                    continue;
                }
                else if (gameDataKey === "screens") {
                    // get list of screens
                    const category = navigationdata_1.NavigationData.data.location["screen"];
                    for (let key in category) {
                        if (quoted) {
                            key = '"' + key + '"';
                        }
                        newlist.push(new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Variable));
                    }
                    return newlist;
                }
                else if (gameDataKey === "label") {
                    newlist.push(new vscode_1.CompletionItem("expression", vscode_1.CompletionItemKind.Keyword));
                    const category = navigationdata_1.NavigationData.data.location["label"];
                    for (let key in category) {
                        if (quoted) {
                            key = '"' + key + '"';
                        }
                        newlist.push(new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Value));
                    }
                    return newlist;
                }
                else if (gameDataKey === "outlines") {
                    let gameObjects = [];
                    if (navigationdata_1.NavigationData.data.location[gameDataKey]) {
                        gameObjects = navigationdata_1.NavigationData.data.location[gameDataKey]["array"] || [];
                        if (gameObjects) {
                            for (const key of gameObjects) {
                                const ci = new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Value);
                                ci.sortText = "1" + key;
                                newlist.push(ci);
                            }
                        }
                        else {
                            gameObjects = [];
                        }
                    }
                    if (!gameObjects.includes('[(1, "#000000", 0, 0)]')) {
                        newlist.push(new vscode_1.CompletionItem('[(1, "#000000", 0, 0)]', vscode_1.CompletionItemKind.Value));
                    }
                    if (!gameObjects.includes('[(1, "#000000", 1, 1)]')) {
                        newlist.push(new vscode_1.CompletionItem('[(1, "#000000", 1, 1)]', vscode_1.CompletionItemKind.Value));
                    }
                    newlist.push(new vscode_1.CompletionItem('[(absolute(1), "#000000", absolute(1), absolute(1))]', vscode_1.CompletionItemKind.Value));
                    newlist.push(new vscode_1.CompletionItem("[(size, color, xoffset, yoffset)]", vscode_1.CompletionItemKind.Value));
                    continue;
                }
                else if (gameDataKey === "displayable") {
                    const display = getDisplayableAutoComplete(quoted);
                    if (display) {
                        for (const ci of display) {
                            newlist.push(ci);
                        }
                    }
                    continue;
                }
                else if (gameDataKey === "audio") {
                    // get defined audio variables
                    const category = navigationdata_1.NavigationData.data.location["define"];
                    const audio = Object.keys(category).filter((key) => key.startsWith("audio."));
                    for (const key of audio) {
                        const ci = new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Variable);
                        ci.sortText = "0" + key;
                        newlist.push(ci);
                    }
                    // get auto detected audio variables
                    const gameObjects = navigationdata_1.NavigationData.gameObjects["audio"];
                    if (gameObjects) {
                        for (const key in gameObjects) {
                            if (!newlist.some((e) => e.label === key)) {
                                const obj = gameObjects[key];
                                let ci;
                                if (obj.startsWith('"')) {
                                    ci = new vscode_1.CompletionItem(gameObjects[key], vscode_1.CompletionItemKind.Folder);
                                    ci.sortText = "2" + key;
                                }
                                else {
                                    ci = new vscode_1.CompletionItem(gameObjects[key], vscode_1.CompletionItemKind.Value);
                                    ci.sortText = "1" + key;
                                }
                                newlist.push(ci);
                            }
                        }
                    }
                    continue;
                }
                else if (gameDataKey === "transforms") {
                    // get the Renpy default Transforms
                    const internal = navigationdata_1.NavigationData.renpyFunctions.internal;
                    const transforms = Object.keys(internal).filter((key) => internal[key][0] === "transforms");
                    for (const key of transforms) {
                        const detail = internal[key][2];
                        newlist.push(new vscode_1.CompletionItem({ label: key, detail: detail }, vscode_1.CompletionItemKind.Value));
                    }
                    // get list of defined Transforms
                    const category = navigationdata_1.NavigationData.data.location["transform"];
                    for (const key in category) {
                        const defType = navigationdata_1.NavigationData.gameObjects["define_types"][key];
                        if (defType) {
                            newlist.push(new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Value));
                        }
                    }
                    continue;
                }
                else if (gameDataKey === "transitions") {
                    // get list of Transitions
                    const category = navigationdata_1.NavigationData.renpyFunctions.internal;
                    newlist.push(new vscode_1.CompletionItem("None", vscode_1.CompletionItemKind.Value));
                    // get the Renpy default transitions and Transition classes
                    const transitions = Object.keys(category).filter((key) => category[key][0] === "transitions");
                    for (const key of transitions) {
                        const detail = category[key][2];
                        newlist.push(new vscode_1.CompletionItem({ label: key, detail: detail }, vscode_1.CompletionItemKind.Value));
                    }
                    // get the user define transitions
                    const defines = navigationdata_1.NavigationData.gameObjects["define_types"];
                    const deftransitions = Object.keys(defines).filter((key) => defines[key].type === "transitions");
                    for (const key of deftransitions) {
                        newlist.push(new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Value));
                    }
                    continue;
                }
                const gameObjects = navigationdata_1.NavigationData.gameObjects[gameDataKey];
                if (gameObjects) {
                    for (let key in gameObjects) {
                        if (quoted) {
                            key = '"' + key + '"';
                        }
                        const ci = new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Value);
                        ci.sortText = quoted ? "2" + key : "1" + key;
                        newlist.push(ci);
                    }
                }
                else {
                    const navObjects = navigationdata_1.NavigationData.data.location[gameDataKey];
                    if (navObjects) {
                        for (let key in navObjects) {
                            if (quoted) {
                                key = '"' + key + '"';
                            }
                            const ci = new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Value);
                            ci.sortText = quoted ? "2" + key : "1" + key;
                            newlist.push(ci);
                        }
                    }
                }
            }
            else {
                let ci = new vscode_1.CompletionItem(split[index], vscode_1.CompletionItemKind.Constant);
                if (split[index].indexOf("(") > 0) {
                    const key = split[index].substring(0, split[index].indexOf("("));
                    const detail = split[index].substring(split[index].indexOf("("));
                    ci = new vscode_1.CompletionItem({ label: key, detail: detail }, vscode_1.CompletionItemKind.Method);
                }
                ci.sortText = "0" + split[index];
                newlist.push(ci);
            }
        }
    }
    if (newlist.length === 0 && parent.length > 0) {
        newlist = getAutoCompleteKeywords(`parent.${context}.${parent}`, "", "");
        if (newlist.length > 0) {
            return newlist;
        }
        return getAutoCompleteKeywords(`parent.${parent}`, "", "");
    }
    return newlist;
}
exports.getAutoCompleteKeywords = getAutoCompleteKeywords;
/**
 * Determines if the given string is a normal integer number
 * @param str - The string containing a numeric value
 * @returns - True if the given string is a normal integer number
 */
function isNormalInteger(str) {
    const n = Math.floor(Number(str));
    return n !== Infinity && String(n) === str && n >= 0;
}
/**
 * Returns a list of the audio channels, both system and user-defined
 * @returns An array of strings containing the names of the available audio channels
 */
function getAudioChannels() {
    const newlist = [];
    const enumerations = navigationdata_1.NavigationData.autoCompleteKeywords["play"];
    if (enumerations) {
        const split = enumerations.split("|");
        for (const index in split) {
            if (split[index].startsWith("{")) {
                const gameDataKey = split[index].replace("{", "").replace("}", "");
                const gameObjects = navigationdata_1.NavigationData.gameObjects[gameDataKey];
                for (const key in gameObjects) {
                    newlist.push(key);
                }
            }
            else {
                newlist.push(split[index]);
            }
        }
    }
    return newlist;
}
/**
 * Returns an array containing the `config.layer` definitions
 * @remarks
 * This method looks for a user configured `define config.layers` definition, or else it returns the default config.layers definition
 *
 * @returns The config.layer configuration as string[] (e.g, `[ 'master', 'transient', 'screens', 'overlay']`)
 */
function getLayerConfiguration(quoted = false) {
    const newlist = [];
    const layers = navigationdata_1.NavigationData.find("config.layers");
    if (layers) {
        for (const layer of layers) {
            if (layer.args) {
                const args = layer.args.replace(/ /g, "").replace(/'/g, '"').replace("=", "").trim();
                const defaultLayers = JSON.parse(args);
                if (defaultLayers) {
                    for (let l of defaultLayers) {
                        if (quoted) {
                            l = '"' + l + '"';
                        }
                        newlist.push(new vscode_1.CompletionItem(l, vscode_1.CompletionItemKind.Variable));
                    }
                    return newlist;
                }
            }
            else {
                const docs = (0, hover_1.getDefinitionFromFile)(layer.filename, layer.location);
                const args = docs === null || docs === void 0 ? void 0 : docs.keyword.replace(/ /g, "").replace(/'/g, '"').replace("defineconfig.layers=", "");
                if (args) {
                    const userLayers = JSON.parse(args);
                    for (let l of userLayers) {
                        if (quoted) {
                            l = '"' + l + '"';
                        }
                        newlist.push(new vscode_1.CompletionItem(l, vscode_1.CompletionItemKind.Variable));
                    }
                    return newlist;
                }
            }
        }
    }
    return;
}
function getDisplayableAutoComplete(quoted = false) {
    if (navigationdata_1.NavigationData.displayableAutoComplete === undefined ||
        navigationdata_1.NavigationData.displayableAutoComplete.length === 0 ||
        navigationdata_1.NavigationData.displayableQuotedAutoComplete === undefined ||
        navigationdata_1.NavigationData.displayableQuotedAutoComplete.length === 0) {
        navigationdata_1.NavigationData.displayableAutoComplete = [];
        navigationdata_1.NavigationData.displayableQuotedAutoComplete = [];
        const config = vscode_1.workspace.getConfiguration("renpy");
        let showAutoImages = true;
        if (config && !config.showAutomaticImagesInCompletion) {
            showAutoImages = false;
        }
        const category = navigationdata_1.NavigationData.data.location["displayable"];
        for (const key in category) {
            const display = category[key];
            if (display.location < 0 && showAutoImages) {
                let ci = new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Folder);
                ci.sortText = "1" + key;
                navigationdata_1.NavigationData.displayableAutoComplete.push(ci);
                ci = new vscode_1.CompletionItem('"' + key + '"', vscode_1.CompletionItemKind.Folder);
                ci.sortText = "1" + key;
                navigationdata_1.NavigationData.displayableQuotedAutoComplete.push(ci);
            }
            else if (display.location >= 0) {
                let ci = new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Value);
                ci.sortText = "0" + key;
                navigationdata_1.NavigationData.displayableAutoComplete.push(ci);
                ci = new vscode_1.CompletionItem('"' + key + '"', vscode_1.CompletionItemKind.Value);
                ci.sortText = "0" + key;
                navigationdata_1.NavigationData.displayableQuotedAutoComplete.push(ci);
            }
        }
        if (!navigationdata_1.NavigationData.displayableAutoComplete.some((e) => e.label === "black")) {
            const black = new vscode_1.CompletionItem("black", vscode_1.CompletionItemKind.Value);
            black.sortText = "0black";
            navigationdata_1.NavigationData.displayableAutoComplete.push(black);
        }
        if (!navigationdata_1.NavigationData.displayableQuotedAutoComplete.some((e) => e.label === "black")) {
            const black = new vscode_1.CompletionItem('"black"', vscode_1.CompletionItemKind.Value);
            black.sortText = "0black";
            navigationdata_1.NavigationData.displayableQuotedAutoComplete.push(black);
        }
    }
    if (quoted) {
        return navigationdata_1.NavigationData.displayableQuotedAutoComplete;
    }
    else {
        return navigationdata_1.NavigationData.displayableAutoComplete;
    }
}
function isCallableContainer(keyword) {
    const prefix = keyword + ".";
    const callables = navigationdata_1.NavigationData.data.location["callable"];
    if (callables) {
        return Object.keys(callables).some((key) => key.indexOf(prefix) === 0);
    }
    return false;
}
function getCallableAutoComplete(keyword) {
    const newlist = [];
    const prefix = keyword + ".";
    // get the list of callables
    const callables = navigationdata_1.NavigationData.data.location["callable"];
    if (callables) {
        const filtered = Object.keys(callables).filter((key) => key.indexOf(prefix) === 0);
        if (filtered) {
            for (const key in filtered) {
                const label = filtered[key].substring(prefix.length);
                newlist.push(new vscode_1.CompletionItem(label, vscode_1.CompletionItemKind.Method));
            }
        }
    }
    return newlist;
}
function isInternalClass(keyword) {
    const prefix = keyword + ".";
    const callables = navigationdata_1.NavigationData.renpyFunctions.internal;
    if (callables) {
        return Object.keys(callables).some((key) => key.indexOf(prefix) === 0);
    }
    return false;
}
function getInternalClassAutoComplete(keyword) {
    const newlist = [];
    const prefix = keyword + ".";
    // get the list of callables
    const callables = navigationdata_1.NavigationData.renpyFunctions.internal;
    if (callables) {
        const filtered = Object.keys(callables).filter((key) => key.indexOf(prefix) === 0);
        if (filtered) {
            for (const key in filtered) {
                const label = filtered[key].substring(prefix.length);
                newlist.push(new vscode_1.CompletionItem(label, vscode_1.CompletionItemKind.Method));
            }
        }
    }
    return newlist;
}
function isNamedStore(keyword) {
    const stores = navigationdata_1.NavigationData.gameObjects["stores"][keyword];
    if (stores) {
        return true;
    }
    return false;
}
function getNamedStoreAutoComplete(keyword) {
    const newlist = [];
    // get the list of callables
    const callables = getCallableAutoComplete(keyword);
    if (callables) {
        for (const callable of callables) {
            newlist.push(callable);
        }
    }
    const objKey = `store.${keyword}`;
    if (navigationdata_1.NavigationData.gameObjects["fields"][objKey] !== undefined) {
        const fields = navigationdata_1.NavigationData.gameObjects["fields"][objKey];
        for (const field of fields) {
            const split = field.keyword.split(".");
            if (split.length === 2) {
                const label = split[1];
                newlist.push(new vscode_1.CompletionItem(label, vscode_1.CompletionItemKind.Variable));
            }
        }
    }
    return newlist;
}
function isPythonType(keyword) {
    const defaults = navigationdata_1.NavigationData.gameObjects["define_types"];
    if (defaults) {
        const defType = defaults[keyword];
        if (defType) {
            return defType.type !== "";
        }
    }
    return false;
}
//# sourceMappingURL=completion.js.map
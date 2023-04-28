// Document Symbol (Outline) Provider
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentSymbols = void 0;
const vscode_1 = require("vscode");
const navigation_1 = require("./navigation");
const navigationdata_1 = require("./navigationdata");
const workspace_1 = require("./workspace");
/**
 * Gets an array of Document Symbols for the given TextDocument used to populate the editor's Outline view
 * @param document - The current TextDocument
 * @returns An array of DocumentSymbol
 */
function getDocumentSymbols(document) {
    if (!document) {
        return;
    }
    const uri = vscode_1.Uri.file(document.fileName);
    const documentFilename = (0, workspace_1.stripWorkspaceFromFile)(uri.path);
    const results = [];
    const range = new vscode_1.Range(0, 0, 0, 0);
    for (const type in navigationdata_1.NavigationData.data.location) {
        const category = navigationdata_1.NavigationData.data.location[type];
        const parentSymbol = new vscode_1.DocumentSymbol(type, "", getDocumentSymbolKind(type, false), range, range);
        for (const key in category) {
            if (category[key] instanceof navigation_1.Navigation) {
                if (category[key].filename === documentFilename) {
                    const childRange = new vscode_1.Range(category[key].location - 1, 0, category[key].location - 1, 0);
                    const classParent = new vscode_1.DocumentSymbol(key, `:${category[key].location}`, getDocumentSymbolKind(type, true), childRange, childRange);
                    if (type === "class") {
                        getClassDocumentSymbols(classParent, key);
                    }
                    parentSymbol.children.push(classParent);
                }
            }
            else {
                if (category[key][0] === documentFilename) {
                    const childRange = new vscode_1.Range(category[key][1] - 1, 0, category[key][1] - 1, 0);
                    const classParent = new vscode_1.DocumentSymbol(key, `:${category[key][1]}`, getDocumentSymbolKind(type, true), childRange, childRange);
                    if (type === "class") {
                        getClassDocumentSymbols(classParent, key);
                    }
                    parentSymbol.children.push(classParent);
                }
            }
        }
        if (parentSymbol.children.length > 0) {
            if (type === "class") {
                // put class at the top (before callable)
                results.unshift(parentSymbol);
            }
            else {
                results.push(parentSymbol);
            }
        }
    }
    const stores = navigationdata_1.NavigationData.gameObjects["stores"];
    if (stores) {
        const parentSymbol = new vscode_1.DocumentSymbol("store", "", getDocumentSymbolKind("store", false), range, range);
        for (const key in stores) {
            const store = stores[key];
            if (store instanceof navigation_1.Navigation) {
                if (store.filename === documentFilename) {
                    const childRange = new vscode_1.Range(store.location - 1, 0, store.location - 1, 0);
                    const classParent = new vscode_1.DocumentSymbol(key, `:${store.location}`, getDocumentSymbolKind("store", true), childRange, childRange);
                    getStoreDocumentSymbols(classParent, key);
                    parentSymbol.children.push(classParent);
                }
            }
            else {
                if (store[0] === documentFilename) {
                    const childRange = new vscode_1.Range(store[1] - 1, 0, store[1] - 1, 0);
                    const classParent = new vscode_1.DocumentSymbol(key, `:${store[1]}`, getDocumentSymbolKind("store", true), childRange, childRange);
                    getStoreDocumentSymbols(classParent, key);
                    parentSymbol.children.push(classParent);
                }
            }
        }
        if (parentSymbol.children.length > 0) {
            results.push(parentSymbol);
        }
    }
    return results;
}
exports.getDocumentSymbols = getDocumentSymbols;
/**
 * Returns the Symbol Kind for the given Ren'Py navigation category
 * @param category - The Ren'Py category
 * @param child - Used to return either the child kind or the parent kind
 * @returns SymbolKind enumeration
 */
function getDocumentSymbolKind(category, child) {
    switch (category) {
        case "callable":
            return child ? vscode_1.SymbolKind.Method : vscode_1.SymbolKind.Module;
        case "screen":
            return child ? vscode_1.SymbolKind.Struct : vscode_1.SymbolKind.Module;
        case "define":
            return child ? vscode_1.SymbolKind.Variable : vscode_1.SymbolKind.Module;
        case "transform":
            return child ? vscode_1.SymbolKind.Variable : vscode_1.SymbolKind.Module;
        case "label":
            return child ? vscode_1.SymbolKind.String : vscode_1.SymbolKind.Module;
        case "class":
            return child ? vscode_1.SymbolKind.Class : vscode_1.SymbolKind.Module;
        case "displayable":
            return child ? vscode_1.SymbolKind.File : vscode_1.SymbolKind.Module;
        case "persistent":
            return child ? vscode_1.SymbolKind.Constant : vscode_1.SymbolKind.Module;
        case "store":
            return child ? vscode_1.SymbolKind.Module : vscode_1.SymbolKind.Module;
        default:
            return vscode_1.SymbolKind.Variable;
    }
}
function getClassDocumentSymbols(classParent, key) {
    const callables = navigationdata_1.NavigationData.data.location["callable"];
    if (callables) {
        const filtered = Object.keys(callables).filter((k) => k.indexOf(key + ".") === 0);
        if (filtered) {
            for (const callable of filtered) {
                const label = callable.substring(key.length + 1);
                const line = callables[callable][1];
                const childRange = new vscode_1.Range(line - 1, 0, line - 1, 0);
                classParent.children.push(new vscode_1.DocumentSymbol(label, `:${line}`, vscode_1.SymbolKind.Method, childRange, childRange));
            }
        }
    }
    const fields = navigationdata_1.NavigationData.gameObjects["fields"][key];
    if (fields) {
        for (const f of fields) {
            const childRange = new vscode_1.Range(f.location - 1, 0, f.location - 1, 0);
            classParent.children.push(new vscode_1.DocumentSymbol(f.keyword, `:${f.location}`, vscode_1.SymbolKind.Field, childRange, childRange));
        }
    }
    const props = navigationdata_1.NavigationData.gameObjects["properties"][key];
    if (props) {
        for (const p of props) {
            const childRange = new vscode_1.Range(p.location - 1, 0, p.location - 1, 0);
            classParent.children.push(new vscode_1.DocumentSymbol(p.keyword, `:${p.location}`, vscode_1.SymbolKind.Property, childRange, childRange));
        }
    }
}
function getStoreDocumentSymbols(classParent, key) {
    const callables = navigationdata_1.NavigationData.data.location["callable"];
    if (callables) {
        const filtered = Object.keys(callables).filter((k) => k.indexOf(key + ".") === 0);
        if (filtered) {
            for (const callable of filtered) {
                const label = callable.substring(key.length + 1);
                const line = callables[callable][1];
                const childRange = new vscode_1.Range(line - 1, 0, line - 1, 0);
                classParent.children.push(new vscode_1.DocumentSymbol(label, `:${line}`, vscode_1.SymbolKind.Method, childRange, childRange));
            }
        }
    }
    const fields = navigationdata_1.NavigationData.gameObjects["fields"][`store.${key}`];
    if (fields) {
        for (const f of fields) {
            const childRange = new vscode_1.Range(f.location - 1, 0, f.location - 1, 0);
            classParent.children.push(new vscode_1.DocumentSymbol(f.keyword.substring(key.length + 1), `:${f.location}`, vscode_1.SymbolKind.Field, childRange, childRange));
        }
    }
}
//# sourceMappingURL=outline.js.map
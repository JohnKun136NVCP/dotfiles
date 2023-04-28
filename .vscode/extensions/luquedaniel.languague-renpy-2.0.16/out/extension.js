// Based on https://raw.githubusercontent.com/Microsoft/vscode/master/extensions/python/src/pythonMain.ts from Microsoft vscode
//
// Licensed under MIT License. See LICENSE in the project root for license information.
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKeywordPrefix = exports.deactivate = exports.activate = void 0;
const cp = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const vscode_1 = require("vscode");
const color_1 = require("./color");
const completion_1 = require("./completion");
const definition_1 = require("./definition");
const diagnostics_1 = require("./diagnostics");
const hover_1 = require("./hover");
const navigationdata_1 = require("./navigationdata");
const outline_1 = require("./outline");
const references_1 = require("./references");
const semantics_1 = require("./semantics");
const signature_1 = require("./signature");
const workspace_1 = require("./workspace");
let myStatusBarItem;
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Ren'Py extension activated");
        vscode_1.languages.setLanguageConfiguration("renpy", {
            onEnterRules: [
                {
                    // indentation for Ren'Py and Python blocks
                    beforeText: /^\s*(?:def|class|for|if|elif|else|while|try|with|finally|except|label|menu|init|":|':|python|).*?:\s*$/,
                    action: { indentAction: vscode_1.IndentAction.Indent },
                },
            ],
        });
        const filepath = (0, workspace_1.getNavigationJsonFilepath)();
        const jsonFileExists = fs.existsSync(filepath);
        if (!jsonFileExists) {
            console.log("Navigation.json file is missing.");
        }
        // hide rpyc files if the setting is enabled
        const config = vscode_1.workspace.getConfiguration("renpy");
        if (config === null || config === void 0 ? void 0 : config.excludeCompiledFilesFromWorkspace) {
            excludeCompiledFilesConfig();
        }
        // Listen to configuration changes
        context.subscriptions.push(vscode_1.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration("renpy.excludeCompiledFilesFromWorkspace")) {
                if (vscode_1.workspace.getConfiguration("renpy").get("excludeCompiledFilesFromWorkspace")) {
                    excludeCompiledFilesConfig();
                }
            }
        }));
        // hover provider for code tooltip
        const hoverProvider = vscode_1.languages.registerHoverProvider("renpy", new (class {
            provideHover(document, position, token) {
                return __awaiter(this, void 0, void 0, function* () {
                    return (0, hover_1.getHover)(document, position);
                });
            }
        })());
        context.subscriptions.push(hoverProvider);
        // provider for Go To Definition
        const definitionProvider = vscode_1.languages.registerDefinitionProvider("renpy", new (class {
            provideDefinition(document, position, token) {
                return (0, definition_1.getDefinition)(document, position);
            }
        })());
        context.subscriptions.push(definitionProvider);
        // provider for Outline view
        const symbolProvider = vscode_1.languages.registerDocumentSymbolProvider("renpy", new (class {
            provideDocumentSymbols(document, token) {
                return (0, outline_1.getDocumentSymbols)(document);
            }
        })());
        context.subscriptions.push(symbolProvider);
        // provider for Method Signature Help
        const signatureProvider = vscode_1.languages.registerSignatureHelpProvider("renpy", new (class {
            provideSignatureHelp(document, position, token, context) {
                return (0, signature_1.getSignatureHelp)(document, position, context);
            }
        })(), "(", ",", "=");
        context.subscriptions.push(signatureProvider);
        // Completion provider
        const completionProvider = vscode_1.languages.registerCompletionItemProvider("renpy", new (class {
            provideCompletionItems(document, position, token, context) {
                return (0, completion_1.getCompletionList)(document, position, context);
            }
        })(), ".", " ", "@", "-", "(");
        context.subscriptions.push(completionProvider);
        // Color Provider
        const colorProvider = vscode_1.languages.registerColorProvider("renpy", new color_1.RenpyColorProvider());
        context.subscriptions.push(colorProvider);
        // Find All References provider
        const references = vscode_1.languages.registerReferenceProvider("renpy", new (class {
            provideReferences(document, position, context, token) {
                return __awaiter(this, void 0, void 0, function* () {
                    return yield (0, references_1.findAllReferences)(document, position, context);
                });
            }
        })());
        context.subscriptions.push(references);
        const tokenTypes = ["class", "parameter", "variable", "keyword"];
        const tokenModifiers = ["declaration", "defaultLibrary"];
        const legend = new vscode_1.SemanticTokensLegend(tokenTypes, tokenModifiers);
        // Semantic Token Provider
        const semanticTokens = vscode_1.languages.registerDocumentSemanticTokensProvider("renpy", new (class {
            provideDocumentSemanticTokens(document, token) {
                if (document.languageId !== "renpy") {
                    return;
                }
                else {
                    return (0, semantics_1.getSemanticTokens)(document, legend);
                }
            }
        })(), legend);
        context.subscriptions.push(semanticTokens);
        // A TextDocument was changed
        context.subscriptions.push(vscode_1.workspace.onDidSaveTextDocument((document) => {
            if (document.languageId !== "renpy") {
                return;
            }
            const filesConfig = vscode_1.workspace.getConfiguration("files");
            if (filesConfig.get("autoSave") === undefined || filesConfig.get("autoSave") !== "off") {
                // only trigger document refreshes if file autoSave is off
                return;
            }
            const config = vscode_1.workspace.getConfiguration("renpy");
            if (config && config.compileOnDocumentSave) {
                if (!navigationdata_1.NavigationData.isCompiling) {
                    ExecuteRenpyCompile();
                }
            }
            if (!navigationdata_1.NavigationData.isImporting) {
                updateStatusBar("$(sync~spin) Initializing Ren'Py static data...");
                const uri = vscode_1.Uri.file(document.fileName);
                const filename = (0, workspace_1.stripWorkspaceFromFile)(uri.path);
                navigationdata_1.NavigationData.clearScannedDataForFile(filename);
                navigationdata_1.NavigationData.scanDocumentForClasses(filename, document);
                updateStatusBar((0, navigationdata_1.getStatusBarText)());
            }
        }));
        // diagnostics (errors and warnings)
        const diagnostics = vscode_1.languages.createDiagnosticCollection("renpy");
        context.subscriptions.push(diagnostics);
        (0, diagnostics_1.subscribeToDocumentChanges)(context, diagnostics);
        // custom command - refresh data
        const refreshCommand = vscode_1.commands.registerCommand("renpy.refreshNavigationData", () => __awaiter(this, void 0, void 0, function* () {
            updateStatusBar("$(sync~spin) Refreshing Ren'Py navigation data...");
            try {
                yield navigationdata_1.NavigationData.refresh(true);
            }
            catch (error) {
                console.log(error);
            }
            finally {
                updateStatusBar((0, navigationdata_1.getStatusBarText)());
            }
        }));
        context.subscriptions.push(refreshCommand);
        // custom command - jump to location
        const gotoFileLocationCommand = vscode_1.commands.registerCommand("renpy.jumpToFileLocation", (args) => {
            const uri = vscode_1.Uri.file((0, workspace_1.cleanUpPath)(args.uri.path));
            const range = new vscode_1.Range(args.range[0].line, args.range[0].character, args.range[0].line, args.range[0].character);
            try {
                vscode_1.window.showTextDocument(uri, { selection: range });
            }
            catch (error) {
                vscode_1.window.showWarningMessage(`Could not jump to the location (error: ${error})`);
            }
        });
        context.subscriptions.push(gotoFileLocationCommand);
        // custom command - refresh diagnositcs
        const refreshDiagnosticsCommand = vscode_1.commands.registerCommand("renpy.refreshDiagnostics", () => {
            if (vscode_1.window.activeTextEditor) {
                (0, diagnostics_1.refreshDiagnostics)(vscode_1.window.activeTextEditor.document, diagnostics);
            }
        });
        context.subscriptions.push(refreshDiagnosticsCommand);
        // custom command - call renpy to compile
        const compileCommand = vscode_1.commands.registerCommand("renpy.compileNavigationData", () => {
            // check Settings has the path to Ren'Py executable
            // Call Ren'Py with the workspace folder and the json-dump argument
            const config = vscode_1.workspace.getConfiguration("renpy");
            if (!config) {
                vscode_1.window.showErrorMessage("Ren'Py executable location not configured or is invalid.");
            }
            else {
                if (isValidExecutable(config.renpyExecutableLocation)) {
                    // call renpy
                    const result = ExecuteRenpyCompile();
                    if (result) {
                        vscode_1.window.showInformationMessage("Ren'Py compilation has completed.");
                    }
                }
                else {
                    vscode_1.window.showErrorMessage("Ren'Py executable location not configured or is invalid.");
                }
            }
        });
        context.subscriptions.push(compileCommand);
        // Custom status bar
        myStatusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 100);
        context.subscriptions.push(myStatusBarItem);
        myStatusBarItem.text = "$(sync~spin) Initializing Ren'Py static data...";
        myStatusBarItem.show();
        // Detect file system change to the navigation.json file and trigger a refresh
        updateStatusBar("$(sync~spin) Initializing Ren'Py static data...");
        yield navigationdata_1.NavigationData.init(context.extensionPath);
        updateStatusBar((0, navigationdata_1.getStatusBarText)());
        try {
            fs.watch((0, workspace_1.getNavigationJsonFilepath)(), (event, filename) => __awaiter(this, void 0, void 0, function* () {
                if (filename) {
                    console.log(`${filename} changed`);
                    updateStatusBar("$(sync~spin) Refreshing Ren'Py navigation data...");
                    try {
                        yield navigationdata_1.NavigationData.refresh();
                    }
                    catch (error) {
                        console.log(`${Date()}: error refreshing NavigationData: ${error}`);
                    }
                    finally {
                        updateStatusBar((0, navigationdata_1.getStatusBarText)());
                    }
                }
            }));
        }
        catch (error) {
            console.log(`Watch navigation.json file error: ${error}`);
        }
        if (config && config.watchFoldersForChanges) {
            console.log("Starting Watcher for images folder.");
            try {
                fs.watch((0, workspace_1.getImagesFolder)(), { recursive: true }, (event, filename) => __awaiter(this, void 0, void 0, function* () {
                    if (filename && event === "rename") {
                        console.log(`${filename} created/deleted`);
                        yield navigationdata_1.NavigationData.scanForImages();
                    }
                }));
            }
            catch (error) {
                console.log(`Watch image folder error: ${error}`);
            }
            console.log("Starting Watcher for audio folder.");
            try {
                fs.watch((0, workspace_1.getAudioFolder)(), { recursive: true }, (event, filename) => __awaiter(this, void 0, void 0, function* () {
                    if (filename && event === "rename") {
                        console.log(`${filename} created/deleted`);
                        yield navigationdata_1.NavigationData.scanForAudio();
                    }
                }));
            }
            catch (error) {
                console.log(`Watch audio folder error: ${error}`);
            }
        }
    });
}
exports.activate = activate;
function deactivate() {
    console.log("Ren'Py extension deactivating");
    fs.unwatchFile((0, workspace_1.getNavigationJsonFilepath)());
}
exports.deactivate = deactivate;
function getKeywordPrefix(document, position, range) {
    if (range.start.character <= 0) {
        return;
    }
    const rangeBefore = new vscode_1.Range(new vscode_1.Position(range.start.line, range.start.character - 1), new vscode_1.Position(range.end.line, range.start.character));
    const spaceBefore = document.getText(rangeBefore);
    if (spaceBefore === ".") {
        const prevPosition = new vscode_1.Position(position.line, range.start.character - 1);
        const prevRange = document.getWordRangeAtPosition(prevPosition);
        if (prevRange) {
            const prevWord = document.getText(prevRange);
            if (prevWord === "music" || prevWord === "sound") {
                // check for renpy.music.* or renpy.sound.*
                const newPrefix = getKeywordPrefix(document, prevPosition, prevRange);
                if (newPrefix === "renpy") {
                    return `${newPrefix}.${prevWord}`;
                }
            }
            if (prevWord !== "store") {
                return prevWord;
            }
        }
    }
    return;
}
exports.getKeywordPrefix = getKeywordPrefix;
function updateStatusBar(text) {
    if (text === "") {
        myStatusBarItem.hide();
    }
    else {
        myStatusBarItem.text = text;
        myStatusBarItem.show();
    }
}
function excludeCompiledFilesConfig() {
    const renpyExclude = ["**/*.rpyc", "**/*.rpa", "**/*.rpymc", "**/cache/"];
    const config = vscode_1.workspace.getConfiguration("files");
    const workspaceExclude = config.inspect("exclude");
    const exclude = Object.assign({}, workspaceExclude === null || workspaceExclude === void 0 ? void 0 : workspaceExclude.workspaceValue);
    renpyExclude.forEach((element) => {
        if (!(element in exclude)) {
            Object.assign(exclude, { [element]: true });
        }
    });
    config.update("exclude", exclude, vscode_1.ConfigurationTarget.Workspace);
}
function isValidExecutable(renpyExecutableLocation) {
    if (!renpyExecutableLocation || renpyExecutableLocation === "") {
        return false;
    }
    return fs.existsSync(renpyExecutableLocation);
}
function ExecuteRenpyCompile() {
    const config = vscode_1.workspace.getConfiguration("renpy");
    const renpy = config.renpyExecutableLocation;
    if (isValidExecutable(renpy)) {
        const renpyPath = (0, workspace_1.cleanUpPath)(vscode_1.Uri.file(renpy).path);
        const cwd = renpyPath.substring(0, renpyPath.lastIndexOf("/"));
        let wf = (0, workspace_1.getWorkspaceFolder)();
        if (wf.endsWith("/game")) {
            wf = wf.substring(0, wf.length - 5);
        }
        const navData = (0, workspace_1.getNavigationJsonFilepath)();
        //const args = `${wf} compile --json-dump ${navData}`;
        const args = [`${wf}`, "compile", "--json-dump", `${navData}`];
        try {
            navigationdata_1.NavigationData.isCompiling = true;
            updateStatusBar("$(sync~spin) Compiling Ren'Py navigation data...");
            const result = cp.spawnSync(renpy, args, { cwd: `${cwd}`, env: { PATH: process.env.PATH }, encoding: "utf-8", windowsHide: true });
            if (result.error) {
                console.log(`renpy spawn error: ${result.error}`);
                return false;
            }
            if (result.stderr && result.stderr.length > 0) {
                console.log(`renpy spawn stderr: ${result.stderr}`);
                return false;
            }
        }
        catch (error) {
            console.log(`renpy spawn error: ${error}`);
            return false;
        }
        finally {
            navigationdata_1.NavigationData.isCompiling = false;
            updateStatusBar((0, navigationdata_1.getStatusBarText)());
        }
        return true;
    }
    return false;
}
//# sourceMappingURL=extension.js.map
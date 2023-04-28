"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const CodeParserController_1 = require("./CodeParserController");
const DoxygenCompletionItemProvider_1 = require("./DoxygenCompletionItemProvider");
var Version;
(function (Version) {
    Version["CURRENT"] = "1.4.0";
    Version["PREVIOUS"] = "1.3.2";
    Version["KEY"] = "doxdocgen_version";
})(Version || (Version = {}));
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const parser = new CodeParserController_1.default();
    context.subscriptions.push(parser);
    const version = context.globalState.get(Version.KEY);
    if (version === undefined) {
        context.globalState.update(Version.KEY, Version.CURRENT);
    }
    else if (version !== Version.CURRENT) {
        context.globalState.update(Version.KEY, Version.CURRENT);
    }
    /*register doxygen commands intellisense */
    if (vscode.workspace.getConfiguration("doxdocgen.generic").get("commandSuggestion")) {
        // tslint:disable-next-line: max-line-length
        vscode.languages.registerCompletionItemProvider({ language: "cpp", scheme: "file" }, new DoxygenCompletionItemProvider_1.default(), "@", "\\");
    }
    // After the CompletionItemProvider is registered, it cannot be unregistered
    // Check the settings everytime when it is triggered would be inefficient
    // So just prompt the user to restart to take effect
    vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("doxdocgen.generic.commandSuggestion")) {
            vscode.window.showWarningMessage("Please restart vscode to apply the changes!");
        }
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map
// Definition Provider
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefinition = void 0;
const vscode_1 = require("vscode");
const extension_1 = require("./extension");
const navigation_1 = require("./navigation");
const navigationdata_1 = require("./navigationdata");
const workspace_1 = require("./workspace");
function getDefinition(document, position) {
    const range = document.getWordRangeAtPosition(position);
    if (!range) {
        return;
    }
    // check if this range is a semantic token
    const filename = (0, workspace_1.stripWorkspaceFromFile)(document.uri.path);
    const rangeKey = (0, navigation_1.rangeAsString)(filename, range);
    const navigation = navigationdata_1.NavigationData.gameObjects["semantic"][rangeKey];
    if (navigation) {
        const uri = vscode_1.Uri.file((0, workspace_1.getFileWithPath)(navigation.filename));
        return new vscode_1.Location(uri, navigation.toRange());
    }
    const line = document.lineAt(position).text;
    if (!navigationdata_1.NavigationData.positionIsCleanForCompletion(line, new vscode_1.Position(position.line, range.start.character))) {
        return undefined;
    }
    let word = document.getText(range);
    if (range && position.character > 2) {
        const prefix = (0, extension_1.getKeywordPrefix)(document, position, range);
        if (prefix) {
            word = `${prefix}.${word}`;
        }
    }
    const definitions = [];
    const locations = navigationdata_1.NavigationData.getNavigationDumpEntries(word);
    if (locations) {
        for (const location of locations) {
            if (location.filename !== "") {
                const uri = vscode_1.Uri.file((0, workspace_1.getFileWithPath)(location.filename));
                definitions.push(new vscode_1.Location(uri, location.toRange()));
            }
        }
    }
    return definitions;
}
exports.getDefinition = getDefinition;
//# sourceMappingURL=definition.js.map
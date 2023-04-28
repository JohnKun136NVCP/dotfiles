// Signature Provider
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignatureHelp = void 0;
const vscode_1 = require("vscode");
const extension_1 = require("./extension");
const navigation_1 = require("./navigation");
const navigationdata_1 = require("./navigationdata");
/**
 * Gets method signature help for the keyword at the given position in the given document
 * @param document - The current TextDocument
 * @param position - The current position
 * @param context - The current context
 * @returns A SignatureHelp that describes the current method and the current argument
 */
function getSignatureHelp(document, position, context) {
    let triggerWord = "";
    //find the keyword before the last '(' character before the current position
    const currentLine = document.lineAt(position.line).text;
    const currentLinePrefix = currentLine.substring(0, position.character);
    const openParenthesis = currentLinePrefix.lastIndexOf("(");
    if (openParenthesis) {
        const prevPosition = new vscode_1.Position(position.line, openParenthesis - 1);
        const prevRange = document.getWordRangeAtPosition(prevPosition);
        if (!prevRange) {
            return;
        }
        triggerWord = document.getText(prevRange);
        const prefix = (0, extension_1.getKeywordPrefix)(document, position, prevRange);
        if (prefix) {
            triggerWord = `${prefix}.${triggerWord}`;
        }
    }
    // show the documentation for the keyword that triggered this signature
    const signatureHelp = new vscode_1.SignatureHelp();
    const locations = navigationdata_1.NavigationData.getNavigationDumpEntries(triggerWord);
    if (locations) {
        for (let location of locations) {
            if (!location.args || location.args.length === 0) {
                location = navigationdata_1.NavigationData.getClassData(location);
            }
            if (location.args && location.args.length > 0) {
                const signature = (0, navigation_1.getArgumentParameterInfo)(location, currentLine, position.character);
                signatureHelp.activeParameter = 0;
                signatureHelp.activeSignature = 0;
                signatureHelp.signatures.push(signature);
            }
        }
    }
    return signatureHelp;
}
exports.getSignatureHelp = getSignatureHelp;
//# sourceMappingURL=signature.js.map
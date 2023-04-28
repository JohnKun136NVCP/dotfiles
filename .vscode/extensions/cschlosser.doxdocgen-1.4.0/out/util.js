"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvVars = exports.getIndentation = exports.inComment = void 0;
const env = require("env-var");
const vscode = require("vscode");
/**
 * Check if a specific line will be inside a comment block if comment block is inserted,
 * that is a line before the active line
 * @param activeEditor the active editor
 * @param activeLine the !previous! line to be checked
 */
function inComment(activeEditor, activeLine) {
    if (activeLine === 0) {
        return false;
    }
    const txt = activeEditor.document.lineAt(activeLine - 1).text.trim();
    if (!txt.startsWith("///") && !txt.startsWith("*") &&
        !txt.startsWith("/**") && !txt.startsWith("/*!")) {
        return false;
    }
    else {
        return true;
    }
}
exports.inComment = inComment;
/**
 * Get the indentation string for the current line (line at the current cursor position)
 */
function getIndentation(editor = vscode.window.activeTextEditor) {
    return editor.document.lineAt(editor.selection.start.line).text.match("^\\s*")[0];
}
exports.getIndentation = getIndentation;
/**
 * Expand environment variables in the string
 * @param replace string containing environment variables
 * @returns new string with expanded environment variables
 */
function getEnvVars(replace) {
    let replacement = replace;
    const regex = /\$\{env\:([\w|\d|_]+)\}/m;
    let match;
    // tslint:disable-next-line:no-conditional-assignment
    while ((match = regex.exec(replacement)) !== null) {
        if (match.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        const m = match[1];
        const envVar = env.get(m, m).asString();
        replacement = replacement.replace("${env:" + m + "}", envVar);
    }
    return replacement;
}
exports.getEnvVars = getEnvVars;
//# sourceMappingURL=util.js.map
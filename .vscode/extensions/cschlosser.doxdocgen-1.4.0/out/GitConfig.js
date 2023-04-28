"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simple_git_1 = require("simple-git");
const vscode_1 = require("vscode");
class GitConfig {
    constructor() {
        var _a;
        let git;
        try {
            git = simple_git_1.default((_a = vscode_1.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0].uri.fsPath);
        }
        catch (error) {
            git = simple_git_1.default();
        }
        git.listConfig().then((result) => {
            this.gitConfig = result.all;
        });
    }
    /** git config --get user.name */
    get UserName() {
        try {
            return this.gitConfig["user.name"].toString();
        }
        catch (error) {
            return "";
        }
    }
    /** git config --get user.email */
    get UserEmail() {
        try {
            return this.gitConfig["user.email"].toString();
        }
        catch (error) {
            return "";
        }
    }
}
exports.default = GitConfig;
//# sourceMappingURL=GitConfig.js.map
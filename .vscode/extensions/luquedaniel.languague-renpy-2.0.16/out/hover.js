// Hover Provider
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
exports.getDefinitionFromFile = exports.getHoverMarkdownString = exports.getHover = void 0;
const vscode_1 = require("vscode");
const extension_1 = require("./extension");
const navigation_1 = require("./navigation");
const navigationdata_1 = require("./navigationdata");
const workspace_1 = require("./workspace");
const fs = __importStar(require("fs"));
function getHover(document, position) {
    let range = document.getWordRangeAtPosition(position);
    if (!range) {
        return undefined;
    }
    const line = document.lineAt(position).text;
    if (!navigationdata_1.NavigationData.positionIsCleanForCompletion(line, new vscode_1.Position(position.line, range.start.character))) {
        return undefined;
    }
    let word = document.getText(range);
    if (word === "kwargs" && range.start.character > 2) {
        const newRange = new vscode_1.Range(range.start.line, range.start.character - 2, range.end.line, range.end.character);
        if (document.getText(newRange) === "**kwargs") {
            range = newRange;
            word = document.getText(range);
        }
    }
    // check if the hover is a Semantic Token
    const filename = (0, workspace_1.stripWorkspaceFromFile)(document.uri.path);
    const rangeKey = (0, navigation_1.rangeAsString)(filename, range);
    const navigation = navigationdata_1.NavigationData.gameObjects["semantic"][rangeKey];
    if (navigation) {
        const contents = new vscode_1.MarkdownString();
        if (navigation && navigation instanceof navigation_1.Navigation) {
            const args = [{ uri: document.uri, range: navigation.toRange() }];
            const commandUri = vscode_1.Uri.parse(`command:renpy.jumpToFileLocation?${encodeURIComponent(JSON.stringify(args))}`);
            contents.appendMarkdown(`(${navigation.source}) **${document.getText(range)}** [${(0, workspace_1.extractFilename)(filename)}:${navigation.location}](${commandUri})`);
            if (navigation.documentation.length > 0) {
                contents.appendMarkdown("\n\n---\n\n");
                contents.appendCodeblock(navigation.documentation);
            }
            contents.isTrusted = true;
        }
        else {
            contents.appendMarkdown(`(${navigation.source}) **${document.getText(range)}**`);
        }
        return new vscode_1.Hover(contents);
    }
    // search the Navigation dump entries
    if (range && position.character > 2) {
        const prefix = (0, extension_1.getKeywordPrefix)(document, position, range);
        if (prefix && prefix !== "store") {
            word = `${prefix}.${word}`;
        }
    }
    const locations = navigationdata_1.NavigationData.getNavigationDumpEntries(word);
    if (locations) {
        const contents = getHoverMarkdownString(locations);
        return new vscode_1.Hover(contents);
    }
    return undefined;
}
exports.getHover = getHover;
function getHoverMarkdownString(locations) {
    const contents = new vscode_1.MarkdownString();
    let index = 0;
    for (const location of locations) {
        index++;
        if (index > 1) {
            contents.appendMarkdown("\n\n---\n\n");
            if (location.keyword.startsWith("gui.") || location.keyword.startsWith("config.")) {
                if (location.documentation && location.documentation.length > 0) {
                    contents.appendMarkdown((0, navigation_1.formatDocumentationAsMarkdown)(location.documentation));
                    continue;
                }
            }
        }
        let source = "";
        if (location.filename && location.filename.length > 0 && location.location >= 0) {
            source = `: ${(0, workspace_1.extractFilename)(location.filename)}:${location.location}`;
        }
        let documentation = location.documentation;
        let fileContents = "";
        if (documentation === "" && location.filename !== "" && location.location >= 0) {
            const fileData = getDefinitionFromFile(location.filename, location.location);
            if (fileData) {
                fileContents = fileData === null || fileData === void 0 ? void 0 : fileData.keyword;
                documentation = fileData === null || fileData === void 0 ? void 0 : fileData.documentation;
            }
        }
        if (location.source === "class") {
            const classData = navigationdata_1.NavigationData.getClassData(location);
            if (classData) {
                //fileContents = `${classData.source} ${classData.keyword}${classData.args}`;
                documentation = classData.documentation;
            }
        }
        let type = location.source;
        const character = navigationdata_1.NavigationData.gameObjects["characters"][location.keyword];
        if (character) {
            type = "character";
        }
        if (location.filename && location.filename.length > 0 && location.location >= 0) {
            const uri = vscode_1.Uri.file((0, workspace_1.getFileWithPath)(location.filename));
            const args = [{ uri: uri, range: location.toRange() }];
            const commandUri = vscode_1.Uri.parse(`command:renpy.jumpToFileLocation?${encodeURIComponent(JSON.stringify(args))}`);
            contents.appendMarkdown(`(${type}) **${location.keyword}** [${source}](${commandUri})`);
        }
        else {
            contents.appendMarkdown(`(${type}) **${location.keyword}** ${source}`);
        }
        contents.isTrusted = true;
        if (character && documentation.length === 0) {
            contents.appendMarkdown("\n\n---\n\n");
            contents.appendText(`Character definition for ${character.resolved_name}.`);
            contents.appendMarkdown("\n\n---\n\n");
        }
        if (location.args && location.args.length > 0) {
            contents.appendMarkdown("\n\n---\n\n");
            const pytype = getPyType(location);
            contents.appendCodeblock(`${pytype}${location.keyword}${location.args}`, "renpy");
        }
        if (fileContents && fileContents.length > 0) {
            if (!location.args || location.args.length === 0) {
                contents.appendMarkdown("\n\n---\n\n");
            }
            contents.appendCodeblock(fileContents, "renpy");
        }
        if (documentation && documentation.length > 0) {
            if (!location.args || location.args.length === 0) {
                contents.appendMarkdown("\n\n---\n\n");
            }
            documentation = (0, navigation_1.formatDocumentationAsMarkdown)(documentation);
            const split = documentation.split("::");
            if (split.length > 1) {
                contents.appendMarkdown(split[0]);
                contents.appendMarkdown("\n\n---\n\n");
                contents.appendCodeblock(split[1]);
            }
            else if (location.type === "store") {
                contents.appendCodeblock(split[0]);
            }
            else {
                contents.appendMarkdown(split[0]);
            }
        }
    }
    return contents;
}
exports.getHoverMarkdownString = getHoverMarkdownString;
function getPyType(location) {
    let pytype = location.type || "";
    if (pytype === "var" && (location.keyword.startsWith("gui.") || location.keyword.startsWith("config."))) {
        pytype = "define";
    }
    else if (pytype === "var" || pytype === "function") {
        pytype = "def";
    }
    if (pytype !== "") {
        pytype = pytype + " ";
    }
    return pytype;
}
function getDefinitionFromFile(filename, line) {
    const filepath = (0, workspace_1.getFileWithPath)(filename);
    try {
        const data = fs.readFileSync(filepath, "utf-8");
        const lines = data.split("\n");
        if (line <= lines.length) {
            let text = lines[line - 1].trim();
            if (text.endsWith(":")) {
                text = text.slice(0, -1);
            }
            else if (text.endsWith("(")) {
                text = text + ")";
            }
            else if (text.endsWith("[")) {
                text = text + "]";
            }
            else if (text.endsWith("{")) {
                text = text + "}";
            }
            let docs = "";
            docs = (0, navigation_1.getPyDocsAtLine)(lines, line - 1);
            let args = "";
            if (text.indexOf("(") > 0) {
                args = text.substring(text.indexOf("("));
                args = args.replace("(self, ", "(");
                args = args.replace("(self)", "()");
            }
            return new navigation_1.Navigation("workspace", text, filename, line, docs, args, "", 0);
        }
    }
    catch (error) {
        return undefined;
    }
}
exports.getDefinitionFromFile = getDefinitionFromFile;
//# sourceMappingURL=hover.js.map
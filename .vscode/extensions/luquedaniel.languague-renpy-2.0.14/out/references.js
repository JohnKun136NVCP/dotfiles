// References Provider
"use strict";
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
exports.findReferenceMatches = exports.findAllReferences = void 0;
const vscode_1 = require("vscode");
const extension_1 = require("./extension");
const navigationdata_1 = require("./navigationdata");
/**
 * Returns an array of Locations that describe all matches for the keyword at the current position
 * @param document - The current text document
 * @param position - The current position
 * @param context - The current context
 * @returns An array of Locations that match the word at the current position in the current document
 */
function findAllReferences(document, position, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const range = document.getWordRangeAtPosition(position);
        let keyword = document.getText(range);
        if (!keyword) {
            return;
        }
        if (range) {
            const prefix = (0, extension_1.getKeywordPrefix)(document, position, range);
            if (prefix && prefix !== "store") {
                keyword = `${prefix}.${keyword}`;
            }
        }
        const references = [];
        const files = yield vscode_1.workspace.findFiles("**/*.rpy");
        if (files && files.length > 0) {
            for (const file of files) {
                document = yield vscode_1.workspace.openTextDocument(file);
                const locations = findReferenceMatches(keyword, document);
                if (locations) {
                    for (const l of locations) {
                        references.push(l);
                    }
                }
            }
        }
        return references;
    });
}
exports.findAllReferences = findAllReferences;
/**
 * Returns a list of locations for the given document where they keyword is found
 * @param keyword - The keyword to search for
 * @param document - The TextDocument to search
 * @returns An array of Locations that match the keyword in the given document
 */
function findReferenceMatches(keyword, document) {
    const locations = [];
    const rx = RegExp(`[^a-zA-Z_](${keyword.replace(".", "/.")})[^a-zA-Z_]`, "g");
    let index = 0;
    while (index < document.lineCount) {
        const line = navigationdata_1.NavigationData.filterStringLiterals(document.lineAt(index).text);
        const matches = rx.exec(line);
        if (matches) {
            const position = new vscode_1.Position(index, matches.index);
            const loc = new vscode_1.Location(document.uri, position);
            locations.push(loc);
        }
        index++;
    }
    return locations;
}
exports.findReferenceMatches = findReferenceMatches;
//# sourceMappingURL=references.js.map
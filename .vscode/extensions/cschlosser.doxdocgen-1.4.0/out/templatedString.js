"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMultiTemplatedString = exports.generateFromTemplate = exports.getTemplatedString = exports.getIndentedTemplate = void 0;
const util_1 = require("./util");
function getIndentedTemplate(replace) {
    if (replace === "") {
        return "";
    }
    const snippets = replace.split(/({indent:\d+})/);
    let indentedString = "";
    let indentWidth = 0;
    // tslint:disable-next-line:prefer-for-of
    snippets.forEach((element) => {
        if (element.match(/{indent:\d+}/)) {
            const indents = parseInt(element.match(/{indent:(\d+)}/)[1], 10);
            indentWidth = indents;
            const numSpaces = Math.max(indentWidth - indentedString.length, 0);
            indentedString += " ".repeat(numSpaces);
        }
        else {
            // just some text
            indentedString += element;
        }
    });
    return indentedString;
}
exports.getIndentedTemplate = getIndentedTemplate;
/**
 * Expand variable template in the string
 * @param original the original string
 * @param template variable template to be expanded
 * @returns new string with expanded template
 */
function getTemplatedString(original, template) {
    const replacedTemplate = original.replace(template.toReplace, template.with);
    const replacedWithEnv = util_1.getEnvVars(replacedTemplate);
    return getIndentedTemplate(replacedWithEnv);
}
exports.getTemplatedString = getTemplatedString;
/**
 * Generate lines of doxygen comments from template
 * @param lines Arrays to store lines of comments
 * @param replace Variable template to be expanded
 * @param template Original string that contains variable templates
 * @param templateWith Arrays of values to replace in the original template string
 */
function generateFromTemplate(lines, replace, template, templateWith) {
    templateWith.forEach((element) => {
        // Ignore null values
        if (element !== null) {
            lines.push(...getTemplatedString(template, { toReplace: replace, with: element }).split("\n"));
        }
    });
}
exports.generateFromTemplate = generateFromTemplate;
/**
 * Expand multiple variable templates in the string
 * @param original string containing multiple variables to be expanded
 * @param templates variable templates to be expanded
 * @returns new string with expanded templates
 */
function getMultiTemplatedString(original, templates) {
    // For each replace entry, attempt to replace it with the corresponding param in the template
    for (const template of templates) {
        original = original.replace(template.toReplace, template.with);
    }
    return util_1.getEnvVars(getIndentedTemplate(original));
}
exports.getMultiTemplatedString = getMultiTemplatedString;
//# sourceMappingURL=templatedString.js.map
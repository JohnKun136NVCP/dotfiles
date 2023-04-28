// Navigation classes
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentContext = exports.rangeAsString = exports.stripQuotes = exports.getNamedParameter = exports.splitParameters = exports.formatDocumentationAsMarkdown = exports.getArgumentParameterInfo = exports.getBaseTypeFromDefine = exports.getPyDocsFromTextDocumentAtLine = exports.getPyDocsAtLine = exports.DataType = exports.Navigation = void 0;
const vscode_1 = require("vscode");
const navigationdata_1 = require("./navigationdata");
class Navigation {
    constructor(source, keyword, filename, location, documentation = "", args = "", type = "", character = 0) {
        this.source = source;
        this.keyword = keyword;
        this.filename = filename;
        this.location = location;
        this.character = character;
        this.documentation = documentation;
        this.args = args;
        this.type = type;
        if (this.documentation) {
            this.documentation = this.documentation.replace(/\\\\/g, '"');
        }
    }
    toRange() {
        return new vscode_1.Range(this.location - 1, this.character, this.location - 1, this.character + this.keyword.length);
    }
}
exports.Navigation = Navigation;
class DataType {
    constructor(variable, define, baseclass) {
        this.variable = variable;
        this.define = define;
        this.baseclass = baseclass;
        this.type = "";
        if (baseclass === "True" || baseclass === "False") {
            this.type = "boolean";
        }
        else if (!isNaN(+this.baseclass)) {
            this.type = "number";
        }
        else if (baseclass === "_" || baseclass.startsWith('"') || baseclass.startsWith("`") || baseclass.startsWith("'")) {
            this.type = "str";
        }
        else if (baseclass.startsWith("[")) {
            this.type = "list";
        }
        else if (baseclass.startsWith("{")) {
            this.type = "dictionary";
        }
        else if (baseclass.startsWith("(") && baseclass.endsWith(")")) {
            this.type = "tuple";
        }
        else if (baseclass === "store") {
            this.type = "store";
        }
    }
    checkTypeArray(type, typeArray) {
        if (typeArray.includes(this.baseclass)) {
            this.type = type;
        }
    }
}
exports.DataType = DataType;
function getPyDocsAtLine(lines, line) {
    const lb = [];
    let index = line;
    let finished = false;
    let insideComment = false;
    let text = lines[index].replace(/[\n\r]/g, "");
    const spacing = text.length - text.trimLeft().length;
    let margin = 0;
    while (!finished && index < lines.length) {
        text = lines[index].replace(/[\n\r]/g, "");
        if (text.length > 0 && text.length - text.trimLeft().length <= spacing && index > line) {
            finished = true;
            break;
        }
        if (text.indexOf('"""') >= 0) {
            if (insideComment) {
                finished = true;
            }
            else {
                insideComment = true;
                margin = text.indexOf('"""');
                text = text.substring(margin + 3);
                if (text.length > 0) {
                    if (text.indexOf('"""') >= 0) {
                        return text.replace('"""', "");
                    }
                    lb.push(text);
                }
            }
        }
        else if (insideComment) {
            if (text.length === 0 || text.length - text.trimLeft().length >= margin + 3) {
                lb.push("\n" + text.substring(margin));
            }
            else {
                lb.push(text.substring(margin));
            }
        }
        index++;
    }
    return lb.join("\n").trim();
}
exports.getPyDocsAtLine = getPyDocsAtLine;
function getPyDocsFromTextDocumentAtLine(document, line) {
    const lb = [];
    let index = line;
    let finished = false;
    let insideComment = false;
    let text = document.lineAt(index).text;
    const spacing = text.length - text.trimLeft().length;
    let margin = 0;
    while (!finished && index < document.lineCount) {
        text = document.lineAt(index).text;
        if (text.length > 0 && text.length - text.trimLeft().length <= spacing && index > line) {
            finished = true;
            break;
        }
        if (text.indexOf('"""') >= 0) {
            if (insideComment) {
                finished = true;
            }
            else {
                insideComment = true;
                margin = text.indexOf('"""');
                text = text.substring(margin + 3);
                if (text.length > 0) {
                    if (text.indexOf('"""') >= 0) {
                        return text.replace('"""', "");
                    }
                    lb.push(text);
                }
            }
        }
        else if (insideComment) {
            if (text.length === 0 || text.length - text.trimLeft().length >= margin + 3) {
                lb.push("\n" + text.substring(margin));
            }
            else {
                lb.push(text.substring(margin));
            }
        }
        index++;
    }
    return lb.join("\n").trim();
}
exports.getPyDocsFromTextDocumentAtLine = getPyDocsFromTextDocumentAtLine;
function getBaseTypeFromDefine(keyword, line) {
    const rx = /^(default|define)\s+(\w*)\s*=\s*(\w*)\(/;
    line = line.trim();
    const matches = line.match(rx);
    if (matches && matches.length >= 4) {
        const cls = matches[3];
        return cls;
    }
    return;
}
exports.getBaseTypeFromDefine = getBaseTypeFromDefine;
function getArgumentParameterInfo(location, line, position) {
    const documentation = new vscode_1.MarkdownString();
    documentation.appendMarkdown(formatDocumentationAsMarkdown(location.documentation));
    const signature = new vscode_1.SignatureInformation(`${location.keyword}${location.args}`, documentation);
    let parsed = "";
    let insideQuote = false;
    let insideParens = false;
    let insideBrackets = false;
    let insideBraces = false;
    let isFirstParen = true;
    // preprocess fragment
    for (let c of line) {
        if (c === '"') {
            c = "'";
            if (!insideQuote) {
                insideQuote = true;
            }
            else {
                insideQuote = false;
            }
        }
        else if (c === " ") {
            c = "_";
        }
        else if (c === "(") {
            if (!isFirstParen) {
                insideParens = true;
            }
            isFirstParen = false;
        }
        else if (c === "[") {
            insideBrackets = true;
        }
        else if (c === "{") {
            insideBraces = true;
        }
        else if (c === ")") {
            insideParens = false;
        }
        else if (c === "]") {
            insideBrackets = false;
        }
        else if (c === "}") {
            insideBraces = false;
        }
        else if (c === "," && (insideQuote || insideParens || insideBrackets || insideBraces)) {
            c = ";";
        }
        parsed += c;
    }
    // split the user's args
    const firstParenIndex = parsed.indexOf("(");
    const parameterStart = firstParenIndex + 1;
    const parsedIndex = parsed.substring(parameterStart);
    const split = parsedIndex.split(",");
    const fragment = parsed.substring(0, position);
    const fragmentSplit = parsed.substring(fragment.indexOf("(") + 1).split(",");
    // calculate the current parameter
    let currentArgument = fragmentSplit.length - 1;
    let kwarg = "";
    if (split[currentArgument].indexOf("=") > 0) {
        const kwargSplit = split[currentArgument].split("=");
        kwarg = kwargSplit[0].trim().replace("_", "");
    }
    // process the method's args
    const parameters = [];
    let args = location.args;
    if (args) {
        if (args.startsWith("(")) {
            args = args.substring(1);
        }
        if (args.endsWith(")")) {
            args = args.substring(0, args.length - 1);
        }
        const argsList = args.split(",");
        if (argsList) {
            let index = 0;
            if (kwarg && kwarg.length > 0) {
                if (argsList[argsList.length - 1].trim() === "**kwargs") {
                    currentArgument = argsList.length - 1;
                }
            }
            for (const arg of argsList) {
                const split = arg.trim().split("=");
                let argDocs = "`" + split[0].trim() + "` parameter";
                if (split.length > 1) {
                    argDocs = argDocs + " (optional). Default is `" + split[1].trim() + "`.";
                }
                else {
                    argDocs = argDocs + ".";
                }
                const prm = new vscode_1.ParameterInformation(arg.trim(), new vscode_1.MarkdownString(argDocs));
                parameters.push(prm);
                if (arg.trim().indexOf("=") > 0) {
                    const kwargSplit = arg.trim().split("=");
                    if (kwargSplit[0] === kwarg) {
                        currentArgument = index;
                    }
                }
                else if (arg.trim() === kwarg) {
                    currentArgument = index;
                }
                index++;
            }
        }
    }
    signature.activeParameter = currentArgument;
    signature.parameters = parameters;
    return signature;
}
exports.getArgumentParameterInfo = getArgumentParameterInfo;
function formatDocumentationAsMarkdown(documentation) {
    documentation = documentation.replace(/\\/g, '"');
    documentation = documentation.replace("```", "\n\n```");
    documentation = documentation
        .replace(/:other:/g, "")
        .replace(/:func:/g, "")
        .replace(/:var:/g, "")
        .replace(/:ref:/g, "")
        .replace(/:class:/g, "")
        .replace(/:tpref:/g, "")
        .replace(/:propref:/g, "");
    return documentation.trim();
}
exports.formatDocumentationAsMarkdown = formatDocumentationAsMarkdown;
function splitParameters(line, trim = false) {
    const args = [];
    let parsed = "";
    let insideQuote = false;
    let insideParens = false;
    let insideBrackets = false;
    let insideBraces = false;
    for (let c of line) {
        if (c === '"') {
            if (!insideQuote) {
                insideQuote = true;
            }
            else {
                insideQuote = false;
            }
        }
        else if (c === "(") {
            insideParens = true;
        }
        else if (c === "[") {
            insideBrackets = true;
        }
        else if (c === "{") {
            insideBraces = true;
        }
        else if (c === ")") {
            insideParens = false;
        }
        else if (c === "]") {
            insideBrackets = false;
        }
        else if (c === "}") {
            insideBraces = false;
        }
        else if (c === "," && (insideQuote || insideParens || insideBrackets || insideBraces)) {
            c = "\uFE50";
        }
        parsed += c;
    }
    const split = parsed.split(",");
    for (let s of split) {
        if (trim) {
            s = s.trim();
        }
        s = s.replace("\uFE50", ",");
        if (trim) {
            while (s.indexOf(" =") > 0) {
                s = s.replace(" =", "=");
            }
            while (s.indexOf("= ") > 0) {
                s = s.replace("= ", "=");
            }
        }
        args.push(s);
    }
    return args;
}
exports.splitParameters = splitParameters;
function getNamedParameter(strings, named) {
    const search = `${named}=`;
    let value = "";
    const filtered = strings.filter(function (str) {
        return str.indexOf(search) === 0;
    });
    if (filtered && filtered.length > 0) {
        const split = filtered[0].split("=");
        value = stripQuotes(split[1]);
    }
    return value;
}
exports.getNamedParameter = getNamedParameter;
function stripQuotes(value) {
    if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1);
        value = value.substring(0, value.length - 1);
    }
    else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1);
        value = value.substring(0, value.length - 1);
    }
    else if (value.startsWith("`") && value.endsWith("`")) {
        value = value.substring(1);
        value = value.substring(0, value.length - 1);
    }
    return value;
}
exports.stripQuotes = stripQuotes;
function rangeAsString(filename, range) {
    return `${filename}:${range.start.line};${range.start.character}-${range.end.character}`;
}
exports.rangeAsString = rangeAsString;
function getCurrentContext(document, position) {
    const rxParentTypes = /\s*(screen|label|transform|def|class|style)\s+([a-zA-Z0-9_]+)\s*(\((.*)\):|:)/;
    const rxInitStore = /^(init)\s+([-\d]+\s+)*python\s+in\s+(\w+):/;
    let i = position.line;
    while (i >= 0) {
        const line = navigationdata_1.NavigationData.filterStringLiterals(document.lineAt(i).text);
        const storeMatch = line.match(rxInitStore);
        if (storeMatch) {
            return `store.${storeMatch[3]}`;
        }
        else if ((line.startsWith("python ") || line.startsWith("init ")) && line.trim().endsWith(":")) {
            return;
        }
        const indentLevel = line.length - line.trimLeft().length;
        const match = line.match(rxParentTypes);
        if (match && indentLevel < position.character) {
            return match[1];
        }
        i--;
    }
    return;
}
exports.getCurrentContext = getCurrentContext;
//# sourceMappingURL=navigation.js.map
// Diagnostics (warnings and errors)
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToDocumentChanges = exports.refreshDiagnostics = void 0;
const vscode_1 = require("vscode");
const navigationdata_1 = require("./navigationdata");
const workspace_1 = require("./workspace");
// Renpy Store Variables (https://www.renpy.org/doc/html/store_variables.html)
// These variables do not begin with '_' but should be ignored by store warnings because they are pre-defined by Ren'Py
const renpyStore = [
    "adv",
    "default_mouse",
    "main_menu",
    "menu",
    "mouse_visible",
    "name_only",
    "narrator",
    "say",
    "save_name",
    "persistent",
    "_autosave",
    "_confirm_quit",
    "_dismiss_pause",
    "_game_menu_screen",
    "_history",
    "_history_list",
    "_ignore_action",
    "_menu",
    "_quit_slot",
    "_rollback",
    "_screenshot_pattern",
    "_skipping",
    "_version",
    "_window",
    "_window_auto",
    "_window_subtitle",
    "_in_replay",
    "_live2d_fade",
];
// Python Reserved Names (https://www.renpy.org/doc/html/reserved.html)
const rxReservedPythonCheck = /^\s*(default|define)\s+(ArithmeticError|AssertionError|AttributeError|BaseException|BufferError|BytesWarning|DeprecationWarning|EOFError|Ellipsis|EnvironmentError|Exception|False|FloatingPointError|FutureWarning|GeneratorExit|IOError|ImportError|ImportWarning|IndentationError|IndexError|KeyError|KeyboardInterrupt|LookupError|MemoryError|NameError|None|NoneType|NotImplemented|NotImplementedError|OSError|OverflowError|PPP|PendingDeprecationWarning|ReferenceError|RuntimeError|RuntimeWarning|StandardError|StopIteration|SyntaxError|SyntaxWarning|SystemError|SystemExit|TabError|True|TypeError|UnboundLocalError|UnicodeDecodeError|UnicodeEncodeError|UnicodeError|UnicodeTranslateError|UnicodeWarning|UserWarning|ValueError|Warning|ZeroDivisionError|abs|all|any|apply|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|copyright|credits|delattr|dict|dir|divmod|enumerate|eval|execfile|exit|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|license|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|print|property|quit|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\s*=/g;
// Obsolete Methods
const rxObsoleteCheck = /[\s(=]+(LiveCrop|LiveComposite|Tooltip|im\.Rotozoom|im\.ImageBase|im\.ramp|im\.Map|im\.Flip|im\.math|im\.expands_bounds|im\.threading|im\.zipfile|im\.Recolor|im\.Color|im\.io|im\.Alpha|im\.Data|im\.Image|im\.Twocolor|im\.MatrixColor|im\.free_memory|im\.Tile|im\.FactorScale|im\.Sepia|im\.Crop|im\.AlphaMask|im\.Blur|im\.tobytes|im\.matrix|im\.Grayscale|ui\.add|ui\.bar|ui\.imagebutton|ui\.input|ui\.key|ui\.label|ui\.null|ui\.text|ui\.textbutton|ui\.timer|ui\.vbar|ui\.hotspot|ui\.hotbar|ui\.spritemanager|ui\.button|ui\.frame|ui\.transform|ui\.window|ui\.drag|ui\.fixed|ui\.grid|ui\.hbox|ui\.side|ui\.vbox|ui\.imagemap|ui\.draggroup)[^a-zA-Z]/g;
const rxVariableCheck = /^\s*(default|define)\s+([^a-zA-Z\s_][a-zA-Z0-9_]*)\s+=/g;
const rxReservedVariableCheck = /\s*(default|define)\s+(_[a-zA-Z0-9]*)\s+=/g;
const rxPersistentDefines = /^\s*(default|define)\s+persistent\.([a-zA-Z]+[a-zA-Z0-9_]*)\s*=\s*(.*$)/g;
const rxPersistentCheck = /\s+persistent\.(\w+)[^a-zA-Z]/g;
const rxStoreCheck = /\s+store\.(\w+)[^a-zA-Z_]?/g;
const rxTabCheck = /^(\t+)/g;
const rsComparisonCheck = /\s+(if|while)\s+(\w+)\s*(=)\s*(\w+)\s*/g;
/**
 * Analyzes the text document for problems.
 * @param doc text document to analyze
 * @param diagnostics diagnostic collection
 */
function refreshDiagnostics(doc, diagnosticCollection) {
    if (doc.languageId !== "renpy") {
        return;
    }
    const diagnostics = [];
    const config = vscode_1.workspace.getConfiguration("renpy");
    //Filenames must begin with a letter or number,
    //and may not begin with "00", as Ren'Py uses such files for its own purposes.
    const checkFilenames = config.warnOnInvalidFilenameIssues;
    if (checkFilenames.toLowerCase() !== "disabled") {
        let severity = vscode_1.DiagnosticSeverity.Error;
        if (checkFilenames.toLowerCase() === "warning") {
            severity = vscode_1.DiagnosticSeverity.Warning;
        }
        const filename = (0, workspace_1.extractFilename)(doc.uri.path);
        if (filename) {
            if (!filename.match(/^[a-zA-Z0-9]/) || filename.startsWith("00")) {
                const invalidRange = new vscode_1.Range(0, 0, doc.lineCount, 0);
                const range = doc.validateRange(invalidRange);
                const diagnostic = new vscode_1.Diagnostic(range, "Filenames must begin with a letter or number, but may not begin with '00' as Ren'Py uses such files for its own purposes.", severity);
                diagnostics.push(diagnostic);
            }
        }
    }
    // check Document text for errors and warnings
    const dataLoaded = navigationdata_1.NavigationData.data && navigationdata_1.NavigationData.data.location;
    // check for persistent variables that have not been defined/defaulted
    const persistents = [];
    if (dataLoaded) {
        const gameObjects = navigationdata_1.NavigationData.data.location["persistent"];
        for (const key in gameObjects) {
            persistents.push(key);
        }
    }
    let firstIndentation = 0;
    for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
        const line = navigationdata_1.NavigationData.filterStringLiterals(doc.lineAt(lineIndex).text);
        if (line.trim().length === 0) {
            continue;
        }
        // check for inconsistent spacing
        let matches;
        const checkSpacing = config.warnOnIndentationAndSpacingIssues;
        if (checkSpacing.toLowerCase() !== "disabled") {
            let severity = vscode_1.DiagnosticSeverity.Error;
            if (checkSpacing.toLowerCase() === "warning") {
                severity = vscode_1.DiagnosticSeverity.Warning;
            }
            matches = line.match(rxTabCheck);
            if (matches) {
                const offset = matches.indexOf(matches[0]);
                const range = new vscode_1.Range(lineIndex, offset, lineIndex, offset + matches[0].length);
                const diagnostic = new vscode_1.Diagnostic(range, `Tab characters are not allowed. Indentation must consist only of spaces in Ren'Py scripts. (4 spaces is strongly recommended.)`, severity);
                diagnostics.push(diagnostic);
            }
            else {
                const indention = line.length - line.trimLeft().length;
                if (indention > 0 && firstIndentation === 0) {
                    firstIndentation = indention;
                }
                if (indention > 0 && indention % firstIndentation !== 0) {
                    const range = new vscode_1.Range(lineIndex, 0, lineIndex, indention);
                    const diagnostic = new vscode_1.Diagnostic(range, `Inconsistent spacing detected (${indention} given, expected a multiple of ${firstIndentation}). Indentation must consist only of spaces in Ren'Py scripts. Each indentation level must consist of the same number of spaces. (4 spaces is strongly recommended.)`, severity);
                    diagnostics.push(diagnostic);
                }
            }
        }
        const checkVariables = config.warnOnInvalidVariableNames;
        if (checkVariables.toLowerCase() !== "disabled") {
            let severity = vscode_1.DiagnosticSeverity.Error;
            if (checkVariables.toLowerCase() === "warning") {
                severity = vscode_1.DiagnosticSeverity.Warning;
            }
            checkInvalidVariableNames(diagnostics, line, lineIndex, severity);
        }
        if (config.warnOnReservedVariableNames) {
            checkReservedRenpyNames(diagnostics, line, lineIndex);
            checkReservedPythonNames(diagnostics, line, lineIndex);
        }
        checkComparisonVsAssignment(diagnostics, line, lineIndex);
        checkStrayDollarSigns(diagnostics, line, lineIndex);
        if (config.warnOnUndefinedStoreVariables) {
            checkStoreVariables(diagnostics, line, lineIndex);
        }
        if (config.warnOnObsoleteMethods) {
            checkObsoleteMethods(diagnostics, line, lineIndex);
        }
        if (config.warnOnUndefinedPersistents) {
            checkUndefinedPersistent(diagnostics, persistents, line, lineIndex);
        }
    }
    diagnosticCollection.set(doc.uri, diagnostics);
}
exports.refreshDiagnostics = refreshDiagnostics;
function subscribeToDocumentChanges(context, diagnostics) {
    if (vscode_1.window.activeTextEditor) {
        refreshDiagnostics(vscode_1.window.activeTextEditor.document, diagnostics);
    }
    context.subscriptions.push(vscode_1.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            refreshDiagnostics(editor.document, diagnostics);
        }
    }));
    context.subscriptions.push(vscode_1.workspace.onDidChangeTextDocument((e) => refreshDiagnostics(e.document, diagnostics)));
    context.subscriptions.push(vscode_1.workspace.onDidCloseTextDocument((doc) => diagnostics.delete(doc.uri)));
}
exports.subscribeToDocumentChanges = subscribeToDocumentChanges;
function checkObsoleteMethods(diagnostics, line, lineIndex) {
    let matches;
    while ((matches = rxObsoleteCheck.exec(line)) !== null) {
        const offset = matches.index + matches[0].indexOf(matches[1]);
        const range = new vscode_1.Range(lineIndex, offset, lineIndex, offset + matches[1].length);
        const diagnostic = new vscode_1.Diagnostic(range, `"${matches[1]}": This function is obsolete or outdated.`, vscode_1.DiagnosticSeverity.Warning);
        diagnostics.push(diagnostic);
    }
}
function checkComparisonVsAssignment(diagnostics, line, lineIndex) {
    // check for equality/assignment errors
    let matches;
    while ((matches = rsComparisonCheck.exec(line)) !== null) {
        const offset = matches.index + matches[0].indexOf(matches[3]);
        const range = new vscode_1.Range(lineIndex, offset, lineIndex, offset + matches[3].length);
        const diagnostic = new vscode_1.Diagnostic(range, `"=" is the assignment operator. Use "==" for comparison.`, vscode_1.DiagnosticSeverity.Warning);
        diagnostics.push(diagnostic);
    }
}
function checkReservedRenpyNames(diagnostics, line, lineIndex) {
    // check for default/define variables that are Ren'Py reserved names
    let matches;
    while ((matches = rxReservedVariableCheck.exec(line)) !== null) {
        const offset = matches.index + matches[0].indexOf(matches[2]);
        const range = new vscode_1.Range(lineIndex, offset, lineIndex, offset + matches[2].length);
        const diagnostic = new vscode_1.Diagnostic(range, `"${matches[2]}": Variables may not begin with a single underscore '_' as Ren'Py reserves such variables for its own purposes.`, vscode_1.DiagnosticSeverity.Warning);
        diagnostics.push(diagnostic);
    }
}
function checkReservedPythonNames(diagnostics, line, lineIndex) {
    // check for default/define variables that are Python reserved names
    let matches;
    while ((matches = rxReservedPythonCheck.exec(line)) !== null) {
        const offset = matches.index + matches[0].indexOf(matches[2]);
        const range = new vscode_1.Range(lineIndex, offset, lineIndex, offset + matches[2].length);
        const diagnostic = new vscode_1.Diagnostic(range, `"${matches[2]}": is a Python reserved name, type, or function. Using it as a variable can lead to obscure problems or unpredictable behavior.`, vscode_1.DiagnosticSeverity.Warning);
        diagnostics.push(diagnostic);
    }
}
function checkStrayDollarSigns(diagnostics, line, lineIndex) {
    // check for '$' character not at the beginning of the line
    if (line.trim().indexOf("$") >= 1) {
        const offset = line.indexOf("$");
        const range = new vscode_1.Range(lineIndex, offset, lineIndex, offset + 1);
        const diagnostic = new vscode_1.Diagnostic(range, `"$" starts a one-line Python statement, but was found in the middle of the line.`, vscode_1.DiagnosticSeverity.Warning);
        diagnostics.push(diagnostic);
    }
}
function checkInvalidVariableNames(diagnostics, line, lineIndex, severity) {
    // check line for invalid define/default variable names
    // Variables must begin with a letter or number, and may not begin with '_'
    let matches;
    while ((matches = rxVariableCheck.exec(line)) !== null) {
        if (!renpyStore.includes(matches[2])) {
            const offset = matches.index + matches[0].indexOf(matches[2]);
            const range = new vscode_1.Range(lineIndex, offset, lineIndex, offset + matches[2].length);
            const diagnostic = new vscode_1.Diagnostic(range, `"${matches[2]}": Variables must begin with a letter (and may contain numbers, letters, or underscores).`, severity);
            diagnostics.push(diagnostic);
        }
    }
}
function checkStoreVariables(diagnostics, line, lineIndex) {
    // check store prefixed variables have been defaulted
    const defaults = navigationdata_1.NavigationData.gameObjects["define_types"];
    let classes = [];
    let callables = [];
    if (navigationdata_1.NavigationData.data && navigationdata_1.NavigationData.data.location) {
        classes = navigationdata_1.NavigationData.data.location["class"] || [];
        callables = navigationdata_1.NavigationData.data.location["callable"] || [];
    }
    if (defaults) {
        const filtered = Object.keys(defaults).filter((key) => defaults[key].define === "default");
        let matches;
        while ((matches = rxStoreCheck.exec(line)) !== null) {
            if (!matches[1].startsWith("_") && !filtered.includes(matches[1]) && !renpyStore.includes(matches[1]) && !classes[matches[1]] && !callables[matches[1]]) {
                const offset = matches.index + matches[0].indexOf(matches[1]);
                const range = new vscode_1.Range(lineIndex, offset, lineIndex, offset + matches[1].length);
                const diagnostic = new vscode_1.Diagnostic(range, `"store.${matches[1]}": Use of a store variable that has not been defaulted.`, vscode_1.DiagnosticSeverity.Warning);
                diagnostics.push(diagnostic);
            }
        }
    }
}
function checkUndefinedPersistent(diagnostics, persistents, line, lineIndex) {
    let matches;
    while ((matches = rxPersistentCheck.exec(line)) !== null) {
        if (line.match(rxPersistentDefines)) {
            if (!persistents.includes(matches[1])) {
                persistents.push(matches[1]);
                continue;
            }
        }
        if (!matches[1].startsWith("_") && !persistents.includes(matches[1])) {
            const offset = matches.index + matches[0].indexOf(matches[1]);
            const range = new vscode_1.Range(lineIndex, offset, lineIndex, offset + matches[1].length);
            const diagnostic = new vscode_1.Diagnostic(range, `"persistent.${matches[1]}": This persistent variable has not been defaulted or defined.`, vscode_1.DiagnosticSeverity.Warning);
            diagnostics.push(diagnostic);
        }
    }
}
//# sourceMappingURL=diagnostics.js.map
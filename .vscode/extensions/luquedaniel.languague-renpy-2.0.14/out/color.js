// Color conversion methods for Color provider
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertRgbColorToColor = exports.convertRenpyColorToColor = exports.convertHtmlToColor = exports.convertColorToRgbTuple = exports.convertRgbToHex = exports.findColorMatches = exports.getColorPresentations = exports.getColorInformation = exports.RenpyColorProvider = void 0;
const vscode_1 = require("vscode");
class RenpyColorProvider {
    provideDocumentColors(document, token) {
        return getColorInformation(document);
    }
    provideColorPresentations(color, context, token) {
        return getColorPresentations(color, context.document, context.range);
    }
}
exports.RenpyColorProvider = RenpyColorProvider;
/**
 * Finds all colors in the given document and returns their ranges and color
 * @param document - the TextDocument to search
 * @returns - Thenable<ColorInformation[]> - an array that provides a range and color for each match
 */
function getColorInformation(document) {
    // find all colors in the document
    const colors = [];
    for (let i = 0; i < document.lineCount; ++i) {
        const line = document.lineAt(i);
        if (!line.isEmptyOrWhitespace) {
            const text = line.text;
            const matches = findColorMatches(text);
            if (matches) {
                let start = 0;
                for (const idx in matches) {
                    const match = matches[idx];
                    let range = new vscode_1.Range(line.lineNumber, text.indexOf(match, start), line.lineNumber, text.indexOf(match, start) + match.length);
                    let color;
                    if (match.startsWith('"#') || match.startsWith("'#")) {
                        const quote = match.substring(0, 1);
                        if (match.endsWith(quote)) {
                            color = convertHtmlToColor(match);
                        }
                    }
                    else if (match.startsWith("rgb")) {
                        color = convertRgbColorToColor(match);
                    }
                    else if (match.startsWith("color")) {
                        color = convertRenpyColorToColor(match);
                    }
                    else if (match.startsWith("Color(")) {
                        // match is Color((r, g, b[, a]))
                        color = convertRenpyColorToColor(match);
                        if (color) {
                            // shift the range so the color block is inside the Color() declaration
                            range = new vscode_1.Range(range.start.line, range.start.character + 6, range.end.line, range.end.character);
                        }
                    }
                    if (color) {
                        colors.push(new vscode_1.ColorInformation(range, color));
                    }
                    start = text.indexOf(match, start) + 1;
                }
            }
        }
    }
    return Promise.resolve(colors);
}
exports.getColorInformation = getColorInformation;
/**
 * Called when the user hovers or taps a color block, allowing the user to replace the original color match with a new color.
 * @param color - The newly chosen Color from the color picker
 * @param document - The TextDocument
 * @param range - The Range of the color match
 * @returns - ColorPresentation to replace the color in the document with the new chosen color
 */
function getColorPresentations(color, document, range) {
    // user hovered/tapped the color block/return the color they picked
    const colors = [];
    const line = document.lineAt(range.start.line).text;
    const text = line.substring(range.start.character, range.end.character);
    const oldRange = new vscode_1.Range(range.start.line, range.start.character, range.start.line, range.start.character + text.length);
    const colR = Math.round(color.red * 255);
    const colG = Math.round(color.green * 255);
    const colB = Math.round(color.blue * 255);
    const colA = Math.round(color.alpha * 255);
    let colorLabel = "";
    if (text.startsWith('"#') || text.startsWith("'#")) {
        const quote = text.substring(0, 1);
        if (colA === 255 && (text.length === 6 || text.length === 9)) {
            colorLabel = convertRgbToHex(colR, colG, colB) || "";
        }
        else {
            colorLabel = convertRgbToHex(colR, colG, colB, colA) || "";
        }
        colorLabel = quote + colorLabel + quote;
    }
    else if (text.startsWith("rgb")) {
        colorLabel = convertColorToRgbTuple(color);
    }
    else if (text.startsWith("color")) {
        colorLabel = `color=(${colR}, ${colG}, ${colB}, ${colA})`;
    }
    else if (text.startsWith("(") && text.endsWith(")")) {
        colorLabel = `(${colR}, ${colG}, ${colB}, ${colA})`;
    }
    if (colorLabel.length > 0) {
        const rgbColorPres = new vscode_1.ColorPresentation(colorLabel);
        rgbColorPres.textEdit = new vscode_1.TextEdit(oldRange, colorLabel);
        colors.push(rgbColorPres);
    }
    return Promise.resolve(colors);
}
exports.getColorPresentations = getColorPresentations;
/**
 * Search the given text for any color references
 * @remarks
 * This method supports colors in the format `"#rrggbb[aa]"`, `"#rgb[a]"`, `Color((r, g, b[, a]))`, `rgb=(r, g, b)`
 *
 * @param text - The text to search
 * @returns A `RegExpMatchArray` containing any color matches
 */
function findColorMatches(text) {
    const rx = /(["']#)[0-9a-fA-F]{8}(["'])|(["']#)[0-9a-fA-F]{6}(["'])|(["']#)[0-9a-fA-F]{4}(["'])|(["']#)[0-9a-fA-F]{3}(["'])|Color\(\((\d+),\s*(\d+),\s*(\d+)?\)|Color\(\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)?\)|rgb\s*=\s*\(([.\d]+),\s*([.\d]+),\s*([.\d]+)?\)|color\s*=\s*\((\d+),\s*(\d+),\s*(\d+)?\)|color\s*=\s*\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)?\)/gi;
    const matches = text.match(rx);
    return matches;
}
exports.findColorMatches = findColorMatches;
/**
 * Converts r, g, b, a into a hex color string
 * @param r - The red value (0-255)
 * @param g - The green value (0-255)
 * @param b - The green value (0-255)
 * @param a - The alpha value (0-255) [optional]
 * @returns The hex color representation (`"#rrggbbaa"`) of the given rgba values
 */
function convertRgbToHex(r, g, b, a) {
    if (r > 255 || g > 255 || b > 255) {
        return;
    }
    if (a === undefined) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    else {
        return "#" + (256 + r).toString(16).substring(1) + ((1 << 24) + (g << 16) + (b << 8) + a).toString(16).substring(1);
    }
}
exports.convertRgbToHex = convertRgbToHex;
/**
 * Returns an rgb tuple representation of a color provider Color
 * @param color - The color provider Color
 * @returns The `rgb=(r, g, b)` tuple representation of the given Color
 */
function convertColorToRgbTuple(color) {
    const red = color.red.toFixed(4).toString().replace(".0000", ".0").replace(".000", ".0").replace(".00", ".0");
    const green = color.green.toFixed(4).toString().replace(".0000", ".0").replace(".000", ".0").replace(".00", ".0");
    const blue = color.blue.toFixed(4).toString().replace(".0000", ".0").replace(".000", ".0").replace(".00", ".0");
    const tuple = `rgb=(${red}, ${green}, ${blue})`;
    return tuple;
}
exports.convertColorToRgbTuple = convertColorToRgbTuple;
/**
 * Returns a Color provider object based on the given html hex color
 * @param hex - The html hex representation
 * @returns The `Color` provider object
 */
function convertHtmlToColor(hex) {
    hex = hex.replace(/"/g, "").replace(/'/g, "");
    // Add alpha value if not supplied
    if (hex.length === 4) {
        hex = hex + "f";
    }
    else if (hex.length === 7) {
        hex = hex + "ff";
    }
    // Expand shorthand form (e.g. "#03FF") to full form (e.g. "#0033FFFF")
    const shorthandRegex = /^#?([A-Fa-f\d])([A-Fa-f\d])([A-Fa-f\d])([A-Fa-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b, a) {
        return r + r + g + g + b + b + a + a;
    });
    // Parse #rrggbbaa into Color object
    const result = /^#?([A-Fa-f\d]{2})([A-Fa-f\d]{2})([A-Fa-f\d]{2})([A-Fa-f\d]{2})$/i.exec(hex);
    return result ? new vscode_1.Color(parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255, parseInt(result[4], 16) / 255) : null;
}
exports.convertHtmlToColor = convertHtmlToColor;
/**
 * Returns a Color provider object based on the given Ren'Py Color tuple
 * @remarks
 * The Color tuple values should be numeric values between 0 and 255 (e.g., `Color((255, 0, 0, 255))`)
 * @param renpy - Renpy `Color` tuple (e.g., `Color((r, g, b, a))`)
 * @returns The `Color` provider object
 */
function convertRenpyColorToColor(renpy) {
    try {
        const colorTuple = renpy.replace("Color(", "").replace("color", "").replace("=", "").replace(" ", "").replace("(", "[").replace(")", "]");
        const result = JSON.parse(colorTuple);
        if (result.length === 3) {
            return new vscode_1.Color(parseInt(result[0], 16) / 255, parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, 1.0);
        }
        else if (result.length === 4) {
            return new vscode_1.Color(parseInt(result[0], 16) / 255, parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255);
        }
        return null;
    }
    catch (error) {
        return null;
    }
}
exports.convertRenpyColorToColor = convertRenpyColorToColor;
/**
 * Returns a Color provider object based on the given Ren'Py rgb tuple
 * @remarks
 * The rgb tuple values should be numeric values between 0.0 and 1.0 (e.g., `rgb=(1.0, 0.0, 0.0)`)
 * @param renpyColor - Renpy `rgb` color tuple (e.g., `rgb=(r, g, b)`)
 * @returns The `Color` provider object
 */
function convertRgbColorToColor(renpyColor) {
    try {
        const colorTuple = renpyColor.replace("rgb", "").replace("=", "").replace(" ", "").replace("(", "[").replace(")", "]");
        const result = JSON.parse(colorTuple);
        if (result.length === 3) {
            return new vscode_1.Color(parseFloat(result[0]), parseFloat(result[1]), parseFloat(result[2]), 1.0);
        }
        return null;
    }
    catch (error) {
        return null;
    }
}
exports.convertRgbColorToColor = convertRgbColorToColor;
//# sourceMappingURL=color.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CppArgument = void 0;
const CppParseTree_1 = require("./CppParseTree");
class CppArgument {
    constructor() {
        this.name = null;
        this.type = new CppParseTree_1.CppParseTree();
    }
}
exports.CppArgument = CppArgument;
//# sourceMappingURL=CppArgument.js.map
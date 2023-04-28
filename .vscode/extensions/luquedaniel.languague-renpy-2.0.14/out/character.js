// Character class
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Character = void 0;
const hover_1 = require("./hover");
const navigationdata_1 = require("./navigationdata");
class Character {
    constructor(name, image, dynamic, args, filename, location) {
        this.name = name;
        this.image = image;
        this.dynamic = dynamic === "True";
        this.arguments = args;
        this.filename = filename;
        this.location = location;
        if (!this.dynamic) {
            this.resolvedName = name;
        }
        else {
            this.resolvedName = name;
            const resolved = navigationdata_1.NavigationData.data.location["define"][name];
            if (resolved) {
                const def = (0, hover_1.getDefinitionFromFile)(resolved[0], resolved[1]);
                if (def) {
                    const split = def.keyword.split("=");
                    if (split && split.length === 2) {
                        this.resolvedName = split[1].trim();
                    }
                }
            }
        }
    }
}
exports.Character = Character;
//# sourceMappingURL=character.js.map
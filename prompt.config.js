import fs from "fs";
import path from "path";

export const prompt = (type, version) => {
    if (!version) {
        version = "";
    } else {
        version = `_${version}`;
    }
    const filePath = path.join(
        process.cwd(),
        "guide",
        `${type}Guide${version}.txt`
    );
    return fs.readFileSync(filePath, "utf8");
};

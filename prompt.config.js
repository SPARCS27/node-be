import fs from "fs";
import path from "path";

export const prompt = (type) => {
    const filePath = path.join(process.cwd(), "guide", `${type}Guide.txt`);
    return fs.readFileSync(filePath, "utf8");
};

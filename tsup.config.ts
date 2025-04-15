import { defineConfig } from "tsup";
import fs from "fs";
import path from "path";

export default defineConfig({
  entry: ["src/**/*.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  onSuccess: async () => {
    console.log("Build completed successfully!");

    // Copy commands directory structure to dist
    const srcCommandsDir = path.join(process.cwd(), "src", "commands");
    const distCommandsDir = path.join(process.cwd(), "dist", "commands");

    // Create dist/commands if it doesn't exist
    if (!fs.existsSync(distCommandsDir)) {
      fs.mkdirSync(distCommandsDir, { recursive: true });
    }

    // Copy command subfolders
    const folders = fs
      .readdirSync(srcCommandsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    folders.forEach((folder) => {
      const distFolderPath = path.join(distCommandsDir, folder);
      if (!fs.existsSync(distFolderPath)) {
        fs.mkdirSync(distFolderPath, { recursive: true });
      }
    });

    console.log("Command folders successfully copied to dist directory!");
  },
});

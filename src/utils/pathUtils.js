import path from "path";

export function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

export function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function safeJoin(base, relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.includes("..")) {
    throw new Error(`Unsafe path rejected: ${relativePath}`);
  }

  return path.join(base, relativePath);
}
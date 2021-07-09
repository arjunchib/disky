import path from "path";

export function fileToCommand(file: string) {
  const ext = path.extname(file);
  return path.basename(file, ext);
}

import crypto from "crypto";

export function hash(str: string): string {
  return crypto.createHash("sha1").update(str).digest("hex");
}

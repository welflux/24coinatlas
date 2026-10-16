import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export const token = () => randomBytes(32).toString("hex");
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt:${salt}:${derived.toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  const [, salt, expected] = stored.split(":");
  const actual = await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  const buffer = Buffer.from(expected, "hex");
  return buffer.length === actual.length && timingSafeEqual(buffer, actual);
}
export function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((v) => v.trim().split("="))
      .filter((v) => v.length === 2),
  );
}
export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function csvCell(value) {
  const text = String(value ?? "");
  return `"${(/^(?:\s*[=+@\-]|[\t\r\n])/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`;
}

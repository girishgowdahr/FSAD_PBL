import { randomInt } from "crypto";

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generateCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return code;
}

import chalk from "chalk";

export function rainbow(str) {
  return str
    .split("")
    .map((char, index) => chalk.hsv((index / str.length) * 360, 59, 95)(char))
    .join("");
}

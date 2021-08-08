import type { ApplicationCommandData } from "discord.js";

export function meta(val: ApplicationCommandData) {
  return function (constructor: Function) {
    constructor.prototype.meta = val;
  };
}

import { CommandMeta } from "./command";

export function meta(val: CommandMeta) {
  return function (constructor: Function) {
    constructor.prototype.meta = val;
  };
}

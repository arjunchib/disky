import type { Message } from "discord.js";

interface CommandContext {
  msg: Message;
}

interface CommandInput {
  command: (context: CommandContext) => void;
}

export class Command {
  fn: (CommandContext) => void;

  constructor(input: CommandInput) {
    this.fn = input.command;
  }
}

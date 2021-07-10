import type { Client, Message } from "discord.js";

export interface CommandContext {
  msg: Message;
  client: Client;
}

interface CommandInput {
  usage: string;
  example?: string;
  description: string;
  command: (context: CommandContext) => void;
}

export class Command {
  usage: string;
  example: string;
  description: string;
  fn: (CommandContext) => void;

  constructor(input: CommandInput) {
    this.usage = input.usage;
    this.example = input.example;
    this.description = input.description;
    this.fn = input.command;
  }
}

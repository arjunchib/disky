import type { Client, Message } from "discord.js";

export interface CommandContext {
  msg: Message;
  client: Client;
  prefix: string;
}

export interface CommandMeta {
  usage: string;
  example?: string;
  description: string;
}

export interface Command {
  meta?: CommandMeta;
  run(ctx: CommandContext): void;
}

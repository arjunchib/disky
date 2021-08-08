import type {
  Client,
  ApplicationCommandData,
  CommandInteraction,
} from "discord.js";

export interface CommandContext {
  interaction: CommandInteraction;
  client: Client;
}

export interface Command {
  meta?: ApplicationCommandData;
  run(ctx: CommandContext): void;
}

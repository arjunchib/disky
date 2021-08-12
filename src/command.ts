import type {
  Client,
  ApplicationCommandData,
  CommandInteraction,
} from "discord.js";

export interface CommandContext {
  interaction: CommandInteraction;
}

export abstract class Command {
  client: Client;
  slash?: ApplicationCommandData;

  constructor(client: Client) {
    this.client = client;
  }

  abstract run(ctx: CommandContext): void;

  // TODO: implment lifecycle hooks
  // onSetup?(): void;
  // onDestroy?(): void;
}

export function slash(val: ApplicationCommandData) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      slash = val;
    };
  };
}

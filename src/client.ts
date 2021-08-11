import Discord, { Interaction, Intents } from "discord.js";
import type { Command, CommandContext } from "./command";
import { Logger } from "./logger";

export interface ClientOptions {
  token: string;
  intents?: Discord.BitFieldResolvable<Discord.IntentsString, number>;
  guildId?: string;
}

export class Client {
  options: ClientOptions;
  client: Discord.Client;
  commands = new Map<string, Command>();
  logger: Logger | undefined;

  constructor(options: ClientOptions, logger: Logger | undefined) {
    this.options = options;
    this.logger = logger;
    const intents = new Intents();
    if (options.intents) intents.add(options.intents);
    this.client = new Discord.Client({ intents });
    this.client.on("ready", async () => {
      await this.#onReady();
    });
    this.client.on("interactionCreate", async (interaction) => {
      await this.#interactionCreate(interaction);
    });
    this.client.login(options.token);
  }

  setCommand(name: string, command: Command) {
    this.commands.set(name, command);
  }

  async updateSlashCommands() {
    const commandData = [];
    this.commands.forEach((command) => {
      commandData.push(command.meta);
    });
    const commandHandler = this.options.guildId
      ? this.client.guilds.cache.get(this.options.guildId)
      : this.client.application;
    await commandHandler?.commands.set(commandData);
    if (this.options.guildId) {
      await this.client.application?.commands.set([]);
    }
  }

  async #onReady() {
    const invite = this.client.generateInvite({ scopes: ["bot"] });
    this.logger?.banner(invite);
    this.updateSlashCommands();
  }

  async #interactionCreate(interaction: Interaction) {
    if (!interaction.isCommand()) return;
    const context: CommandContext = {
      interaction,
      client: this.client,
    };
    const name = interaction.commandName;
    try {
      this.logger?.runCommand(name);
      if (this.commands.has(name)) {
        return await this.commands.get(name).run(context);
      } else if (this.commands.has("_default")) {
        return await this.commands.get("_default").run(context);
      }
    } catch (e) {
      this.logger?.error(e);
    }
  }
}

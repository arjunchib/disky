import Discord, { Interaction, Intents } from "discord.js";
import type { Command, CommandContext } from "./command.js";
import { Logger } from "./logger.js";

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
    const intents = new Intents(Intents.FLAGS.GUILDS);
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
      if (command.slash) commandData.push(command.slash);
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

  async onExit(signal) {
    if (this.options.guildId) {
      await this.client.guilds.cache
        .get(this.options.guildId)
        ?.commands.set([]);
    }
    this.client.destroy();
  }

  async #interactionCreate(interaction: Interaction) {
    if (!interaction.isCommand()) return;
    const context: CommandContext = { interaction };
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

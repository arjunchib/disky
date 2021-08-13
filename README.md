# Disky

> A Discord bot framework using discord.js

- 🪣 HMR Dev Server
- 🛎 Typescript
- 🧮 Easy Setup

## Installation

```bash
npm install disky
```

## Get Started

### Add env vars to `.env` file

Variables set in `.env` file are automatically loaded and injected into `process.env`:

```
BOT_TOKEN=<DISCORD_BOT_TOKEN>
GUILD_ID=<DISCORD_GUILD_ID>
```

### Add `diskyrc.ts` config file

- `token` Discord bot token
- `guildId` Guild ID can be set to only load commands for a single guild (useful for dev/staging environemnts)
- `intents` [Intents](https://discordjs.guide/popular-topics/intents.html#privileged-intents) to enable in the Discord client (the GUILD intent is enabled by automatically)

```ts
// diskyrc.ts

import { Intents } from "discord.js";
import { ClientOptions } from "disky";

export const options: ClientOptions = {
  token: process.env.BOT_TOKEN,
  guildId: process.env.GUILD_ID,
  intents: [Intents.FLAGS.GUILD_VOICE_STATES],
};
```

### Add commands to `src/commands`

Commands have a `run` function that gets called whenever a slash command is triggered. The [Interaction](https://discordjs.guide/interactions/replying-to-slash-commands.html#replying-to-slash-commands) can be used to respond to the command.

Using the `@slash` decorator, will automatically register the command to be used with Discord.

```ts
// src/commands/ping.ts

import { Command, CommandContext, slash } from "disky";

@slash({
  name: "ping",
  description: "Responds with pong",
})
export default class PingCommand extends Command {
  async run({ interaction }: CommandContext) {
    await interaction.reply("pong");
  }
}
```

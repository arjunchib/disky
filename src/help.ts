import { CommandContext } from "./command";

export function help({ msg }: CommandContext, commands) {
  const lines = [];
  commands.forEach((command) => {
    let line = `**${command.usage}** - ${command.description}`;
    if (command.example) {
      line += ` *(ex. ${command.example})*`;
    }
    lines.push(line);
  });
  msg.reply(`\n${lines.join("\n")}`);
}

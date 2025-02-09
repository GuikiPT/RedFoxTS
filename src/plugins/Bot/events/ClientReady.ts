import { PluginEvent } from "../../../types/pluginTypes";
import { Client, Events } from "discord.js";
import chalk from "chalk";

const readyEvent: PluginEvent<[Client]> = {
  name: Events.ClientReady,
  once: true,
  execute: (client: Client) => {
    console.log(`Logged in as ${chalk.bold(chalk.keyword("orange")(client.user?.tag))}!`);
  },
};

export default readyEvent;

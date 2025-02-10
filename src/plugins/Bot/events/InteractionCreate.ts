import { ChatInputCommandInteraction } from "discord.js";
import { PluginEvent } from "../../../types/pluginTypes";
import { getCommand } from "../../../common/commandRegistry";

const interactionCreate: PluginEvent<[ChatInputCommandInteraction]> = {
  name: "interactionCreate",
  execute: async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = getCommand(interaction.commandName);
    if (!command) {
      console.warn(`No command found for ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing that command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing that command!",
          ephemeral: true,
        });
      }
    }
  },
};

export default interactionCreate;

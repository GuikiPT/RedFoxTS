import { ChatInputCommandInteraction } from "discord.js";
import { PluginEvent } from "../../../types/pluginTypes";
import { getCommand } from "../../../common/commandRegistry";

const interactionCreate: PluginEvent<[ChatInputCommandInteraction]> = {
    name: "interactionCreate",
    execute: async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = getCommand(interaction.commandName);
        if (!command) {
            console.warn(`No command found for ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            console.error(
                `Error executing command ${interaction.commandName}: ${errorMessage}`
            );

            const response = {
                content: "There was an error while executing that command!",
                ephemeral: true,
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(response);
            } else {
                await interaction.reply(response);
            }
        }
    },
};

export default interactionCreate;

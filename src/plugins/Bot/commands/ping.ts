import { 
  ChatInputCommandInteraction, 
  ApplicationCommandOptionType 
} from "discord.js";
import { PluginCommand } from "../../../types/pluginTypes";

const pingCommand: PluginCommand<ChatInputCommandInteraction> = {
  name: 'ping',
  description: 'Replies with Pong!',
  data: {
    name: 'ping',
    description: 'Replies with Pong!',
    options: [
      {
        name: 'verbose',
        description: 'Show detailed information',
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      }
    ]
  },
  execute: async (interaction: ChatInputCommandInteraction) => {
    const verbose = interaction.options.getBoolean('verbose');
    
    if (verbose) {
      await interaction.reply('Pong! Here is some extra detail...');
    } else {
      await interaction.reply('Pong!');
    }
  }
};

export default pingCommand;

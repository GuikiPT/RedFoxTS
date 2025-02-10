import {
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { PluginCommand } from "../../../types/pluginTypes";

const latencyCommand: PluginCommand<ChatInputCommandInteraction> = {
  name: "latency",
  description: "Displays latency information for the bot and Discord API.",
  data: {
    name: "latency",
    description: "Displays latency information for the bot and Discord API.",
    options: [],
  },
  execute: async (interaction: ChatInputCommandInteraction) => {
    const startTime = Date.now();
    await interaction.deferReply();

    const botPing = Date.now() - startTime;
    const apiPing = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
      .setTitle("Latency Information")
      .setColor(0xffa500)
      .addFields(
        { name: "Bot Latency", value: `${botPing}ms`, inline: true },
        { name: "API Latency", value: `${apiPing}ms`, inline: true }
      )
      .setTimestamp();

    const clientUser = interaction.client.user;
    if (clientUser) {
      const fetchedUser = await interaction.client.users.fetch(clientUser.id, { force: true });
      const avatarURL = fetchedUser.displayAvatarURL({ size: 1024 });
      embed.setThumbnail(avatarURL);

      if (fetchedUser.banner) {
        const bannerURL = fetchedUser.bannerURL({ size: 1024 });
        if (bannerURL) {
          embed.setImage(bannerURL);
        }
      }
    }

    await interaction.editReply({ embeds: [embed] });
  },
};

export default latencyCommand;

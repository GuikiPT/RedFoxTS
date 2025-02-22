import {
    ChatInputCommandInteraction,
    Client,
    ApplicationCommandData,
    MessageFlags,
} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { PluginCommand } from '../../../types/pluginTypes';

const testDatabaseCommand: PluginCommand<ChatInputCommandInteraction> = {
    name: 'testdatabase',
    description:
        'Perform CRUD operations on a test database using Sequelize with MariaDB',
    data: new SlashCommandBuilder()
        .setName('testdatabase')
        .setDescription(
            'Perform CRUD operations on a test database using Sequelize with MariaDB',
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('create')
                .setDescription('Create a new user record')
                .addStringOption((option) =>
                    option
                        .setName('username')
                        .setDescription('Username to register')
                        .setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand.setName('read').setDescription('Read your user record'),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('update')
                .setDescription('Update your username')
                .addStringOption((option) =>
                    option
                        .setName('username')
                        .setDescription('New username')
                        .setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('delete')
                .setDescription('Delete your user record'),
        )
        .toJSON() as ApplicationCommandData,
    execute: async (interaction: ChatInputCommandInteraction) => {
        const subcommand = interaction.options.getSubcommand();
        const client = interaction.client;

        try {
            if (subcommand === 'create') {
                const username = interaction.options.getString(
                    'username',
                    true,
                );
                const existingUser = await client.db.UserModel.findOne({
                    where: { discordId: interaction.user.id },
                });
                if (existingUser) {
                    return interaction.reply({
                        content: 'User already exists.',
                        flags: MessageFlags.Ephemeral,
                    });
                }
                await client.db.UserModel.create({
                    discordId: interaction.user.id,
                    username,
                });
                return interaction.reply({
                    content: `User created with username: ${username}`,
                    flags: MessageFlags.Ephemeral,
                });
            } else if (subcommand === 'read') {
                const user = await client.db.UserModel.findOne({
                    where: { discordId: interaction.user.id },
                });
                if (!user) {
                    return interaction.reply({
                        content: 'No user record found.',
                        flags: MessageFlags.Ephemeral,
                    });
                }
                return interaction.reply({
                    content: `User record:\nUsername: ${user.username}\nDiscord ID: ${user.discordId}`,
                    flags: MessageFlags.Ephemeral,
                });
            } else if (subcommand === 'update') {
                const newUsername = interaction.options.getString(
                    'username',
                    true,
                );
                const [affectedRows] = await client.db.UserModel.update(
                    { username: newUsername },
                    { where: { discordId: interaction.user.id } },
                );
                if (affectedRows === 0) {
                    return interaction.reply({
                        content: 'No user record found to update.',
                        flags: MessageFlags.Ephemeral,
                    });
                }
                const updatedUser = await client.db.UserModel.findOne({
                    where: { discordId: interaction.user.id },
                });
                return interaction.reply({
                    content: `User updated. New username: ${updatedUser?.username}`,
                    flags: MessageFlags.Ephemeral,
                });
            } else if (subcommand === 'delete') {
                const deletedRows = await client.db.UserModel.destroy({
                    where: { discordId: interaction.user.id },
                });
                if (!deletedRows) {
                    return interaction.reply({
                        content: 'No user record found to delete.',
                        flags: MessageFlags.Ephemeral,
                    });
                }
                return interaction.reply({
                    content: 'User record deleted.',
                    flags: MessageFlags.Ephemeral,
                });
            }
        } catch (error) {
            console.error('Error in CRUD command:', error);
            return interaction.reply({
                content: 'There was an error processing your request.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};

export default testDatabaseCommand;

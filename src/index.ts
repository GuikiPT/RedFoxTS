import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import { loadPlugins } from './pluginLoader';
import './common/logger';
import chalk from 'chalk';
import pkg from '../package.json';
import { getFigletText } from './common/figlet';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

async function printBanner() {
    try {
        const figletString = await getFigletText('RedFox');
        process.stdout.write(
            chalk.bold.keyword('orange')(figletString) + '\n' +
            chalk.bold.keyword('orange')(`🦊 Version: ${chalk.bold(pkg.version)} | Author: ${chalk.bold(pkg.author)} 🦊\n`)
        );
    } catch (err) {
        console.error(`Error generating banner: ${err}`);
    }
}

async function main() {
    await printBanner();

    console.log('Loading plugins...');
    try {
        await loadPlugins(client);
        console.info('Plugins loaded successfully.');
    } catch (err) {
        console.error('Error loading plugins:', err);
        process.exit(1);
    }

    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
        console.error('DISCORD_BOT_TOKEN environment variable is not set.');
        process.exit(1);
    }

    try {
        await client.login(token);
    } catch (err) {
        console.error('Failed to login to Discord:', err);
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    console.info('Received SIGINT. Shutting down gracefully.');
    client.destroy();
    process.exit(0);
});

main().catch((error) => {
    console.error(`An error occurred: ${error}`);
    process.exit(1);
});

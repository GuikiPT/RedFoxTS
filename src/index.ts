import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import { loadPlugins } from './handlers/pluginLoader';
import './common/logger';
import chalk from 'chalk';
import pkg from '../package.json';
import { getFigletText } from './common/figlet';
import sequelize from './database/sequelize';
import UserModel from './database/models/UserModel';

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
            chalk.bold.keyword('orange')(figletString) +
                '\n' +
                chalk.bold.keyword('orange')(
                    `🦊 Version: ${chalk.bold(pkg.version)} | Author: ${chalk.bold(pkg.author)} 🦊\n`,
                ),
        );
    } catch (err) {
        console.error(chalk.red(`Error generating banner: ${err}`));
    }
}

async function main() {
    try {
        await printBanner();
        console.log(chalk.keyword('orange')('Loading plugins...'));
        await loadPlugins(client);
        console.info(chalk.green('Plugins loaded successfully.'));

        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            throw new Error(
                'DISCORD_BOT_TOKEN environment variable is not set.',
            );
        }
        await client.login(token);

        await sequelize.authenticate();
        console.info(
            chalk.green('MariaDB connected successfully via Sequelize.'),
        );

        await sequelize.sync();
        console.info(chalk.green('Sequelize models synchronized.'));

        client.db = { UserModel };
    } catch (err) {
        console.error(chalk.red(`Critical error during startup: ${err}`));
        process.exit(1);
    }
}

function gracefulShutdown(signal: string) {
    console.info(
        chalk.yellow(`Received ${signal}. Shutting down gracefully...`),
    );
    client.destroy();
    process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (error) => {
    console.error(chalk.red('Uncaught Exception:'), error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(
        chalk.red('Unhandled Rejection at:'),
        promise,
        'reason:',
        reason,
    );
    process.exit(1);
});

main();

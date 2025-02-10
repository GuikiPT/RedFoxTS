import { Client, GatewayIntentBits } from 'discord.js';
import { loadPlugins } from './pluginLoader';
import './common/logger';
import chalk from "chalk";
import pkg from '../package.json';
import dotenv from 'dotenv';
import { getFigletText } from './common/figlet';
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function main() {
  try {
    const figletString = await getFigletText('RedFox');
    
    process.stdout.write(chalk.bold(chalk.keyword('orange')(figletString) + '\n'));
    process.stdout.write(chalk.bold(chalk.keyword('orange')(`🦊 Version ${pkg.version} | Author: ${pkg.author} 🦊\n\n`)));
  } catch (err) {
    console.error(`Error generating banner: ${err}`);
  }

  console.log('Loading plugins...');
  await loadPlugins(client);
  console.info('Plugins loaded successfully.');

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error('DISCORD_BOT_TOKEN environment variable is not set.');
    process.exit(1);
  }

  await client.login(token);
}

main().catch((error) => {
  console.error(`An error occurred: ${error}`);
  process.exit(1);
});

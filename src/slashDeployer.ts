
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import chalk from 'chalk';
import prompts from 'prompts';

dotenv.config();

export async function deploySlashCommands(): Promise<void> {
    console.log(chalk.green('Starting Slash Command Deployment System (Plugin-based)...'));


    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    try {
        await client.login(process.env.DiscordToken);
        console.log(chalk.green(`Logged in as ${client.user?.tag} for Slash Command Deployment.`));


        const actionChoices = [
            { title: 'Register Global Commands', value: 'registerGlobal' },
            { title: 'Register Test Guild Commands', value: 'registerTestGuild' },
            { title: 'Delete Single Global Command', value: 'deleteSingleGlobal' },
            { title: 'Delete Single Test Guild Command', value: 'deleteSingleTestGuild' },
            { title: 'Delete All Global Commands', value: 'deleteAllGlobal' },
            { title: 'Delete All Test Guild Commands', value: 'deleteAllTestGuild' }
        ];

        const { action } = await prompts({
            type: 'select',
            name: 'action',
            message: 'What would you like to do?',
            choices: actionChoices
        });

        let commandName: string | undefined;
        let guildId: string | undefined;

        if (action.startsWith('deleteSingle')) {
            commandName = await promptInput('Enter the command name to delete:', 'Command name is required!');
        }

        if (action.endsWith('TestGuild')) {
            guildId = await promptInput('Enter the test guild ID:', 'Guild ID is required!');
        }


        switch (action) {
            case 'registerGlobal':
                await registerCommands(client);
                break;
            case 'registerTestGuild':
                if (!guildId) {
                    console.error(chalk.red('Guild ID is required for test guild commands.'));
                    break;
                }
                await registerCommands(client, guildId);
                break;
            case 'deleteSingleGlobal':
                if (!commandName) {
                    console.error(chalk.red('Command name is required.'));
                    break;
                }
                await deleteSingleCommand(client, commandName);
                break;
            case 'deleteSingleTestGuild':
                if (!commandName || !guildId) {
                    console.error(chalk.red('Both command name and Guild ID are required.'));
                    break;
                }
                await deleteSingleCommand(client, commandName, guildId);
                break;
            case 'deleteAllGlobal':
                await confirmAndDeleteAll(client, 'global');
                break;
            case 'deleteAllTestGuild':
                if (!guildId) {
                    console.error(chalk.red('Guild ID is required for test guild commands.'));
                    break;
                }
                await confirmAndDeleteAll(client, 'test guild', guildId);
                break;
            default:
                console.log(chalk.yellow('Invalid action specified.'));
        }
    } catch (error) {
        logError('Error during Slash Command Deployment:', error);
    } finally {
        console.log(chalk.yellow('Shutting down Slash Command Deployment System gracefully...'));
        await client.destroy();
    }
}





async function promptInput(message: string, validationMessage = 'Input is required'): Promise<string> {
    const response = await prompts({
        type: 'text',
        name: 'input',
        message,
        validate: (input: string) => (input ? true : validationMessage)
    });
    return response.input;
}

async function confirmAndDeleteAll(client: Client, type: string, guildId?: string): Promise<void> {
    const { confirmDelete } = await prompts({
        type: 'confirm',
        name: 'confirmDelete',
        message: `Are you sure you want to delete all ${type} commands?`,
        initial: false
    });
    if (confirmDelete) {
        await deleteAllCommands(client, guildId);
    } else {
        console.log(chalk.green(`Deletion of all ${type} commands canceled.`));
    }
}

async function loadSlashCommands(): Promise<any[]> {
    const commands: any[] = [];
    const pluginsDir = path.join(__dirname, 'plugins');

    if (!fs.existsSync(pluginsDir)) {
        console.warn(chalk.yellow(`Plugins directory not found at ${pluginsDir}`));
        return commands;
    }


    const pluginFolders = fs.readdirSync(pluginsDir).filter((folder) => {
        const folderPath = path.join(pluginsDir, folder);
        return fs.statSync(folderPath).isDirectory();
    });


    for (const folder of pluginFolders) {
        const pluginFolderPath = path.join(pluginsDir, folder);

        const slashCommandsFolder = path.join(pluginFolderPath, 'slashs');
        if (fs.existsSync(slashCommandsFolder)) {
            const commandFiles = fs
                .readdirSync(slashCommandsFolder)
                .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

            for (const file of commandFiles) {
                const commandPath = path.join(slashCommandsFolder, file);
                try {

                    const commandModule = await import(pathToFileURL(commandPath).href);
                    const command = commandModule.default || commandModule;
                    if ('data' in command && 'execute' in command) {
                        commands.push(command.data.toJSON());
                    } else {
                        console.warn(
                            chalk.yellow(
                                `[WARNING] The command file "${file}" in plugin "${folder}" is missing "data" or "execute" property.`
                            )
                        );
                    }
                } catch (error) {
                    logError(`Failed to load command "${file}" from plugin "${folder}":`, error);
                }
            }
        }
    }

    console.info(chalk.green(`Loaded ${commands.length} slash command(s) from plugins successfully.`));
    return commands;
}

async function registerCommands(client: Client, guildId?: string): Promise<void> {
    const commands = await loadSlashCommands();
    const rest = createRestClient();

    try {
        const applicationId = client.user?.id;
        if (!applicationId) {
            console.error(chalk.red('Client user ID not available.'));
            return;
        }

        const route = guildId
            ? Routes.applicationGuildCommands(applicationId, guildId)
            : Routes.applicationCommands(applicationId);

        const data = (await rest.put(route, { body: commands })) as any[];
        console.info(
            chalk.green(
                `Successfully reloaded ${data.length} ${guildId ? 'guild-specific' : 'global'} slash command(s).`
            )
        );
    } catch (error) {
        logError('Error registering commands:', error);
    }
}

async function deleteSingleCommand(client: Client, commandName: string, guildId?: string): Promise<void> {
    const rest = createRestClient();
    try {
        const applicationId = client.user?.id;
        if (!applicationId) {
            console.error(chalk.red('Client user ID not available.'));
            return;
        }

        const route = guildId
            ? Routes.applicationGuildCommands(applicationId, guildId)
            : Routes.applicationCommands(applicationId);

        const commands = (await rest.get(route)) as any[];
        const command = commands.find((cmd) => cmd.name === commandName);
        if (!command) {
            console.warn(chalk.yellow(`No command found with name: ${commandName}`));
            return;
        }

        const deleteRoute = guildId
            ? Routes.applicationGuildCommand(applicationId, guildId, command.id)
            : Routes.applicationCommand(applicationId, command.id);

        await rest.delete(deleteRoute);
        console.log(chalk.green(`Successfully deleted command: ${commandName}`));
    } catch (error) {
        logError('Error deleting command:', error);
    }
}

async function deleteAllCommands(client: Client, guildId?: string): Promise<void> {
    const rest = createRestClient();
    try {
        const applicationId = client.user?.id;
        if (!applicationId) {
            console.error(chalk.red('Client user ID not available.'));
            return;
        }

        const route = guildId
            ? Routes.applicationGuildCommands(applicationId, guildId)
            : Routes.applicationCommands(applicationId);

        await rest.put(route, { body: [] });
        console.log(chalk.green(`Successfully deleted all ${guildId ? 'guild-specific' : 'global'} commands.`));
    } catch (error) {
        logError('Error deleting all commands:', error);
    }
}

function createRestClient(): REST {
    const token = process.env.DiscordToken;
    if (!token) {
        throw new Error('DiscordToken environment variable is not defined.');
    }
    return new REST({ version: '10' }).setToken(token);
}

function logError(message: string, error: unknown): void {
    console.error(chalk.red(message));
    console.error(error);
}


const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
if (process.argv[1] === __filename) {
    deploySlashCommands();
}

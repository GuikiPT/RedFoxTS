import { promises as fs } from 'fs';
import path from 'path';
import { Client } from 'discord.js';
import { Plugin, PluginLoadLog } from '../types/pluginTypes';
import Table from 'cli-table3';
import chalk from 'chalk';
import { registerCommand } from '../common/commandRegistry';

async function loadPluginCommands(
    pluginFolderPath: string,
    commandsFolderName: string,
    loadOptions: {
        skipCommands?: string[];
        skipEvents?: string[];
        commandsFolder?: string;
        eventsFolder?: string;
    },
    plugin: Plugin,
): Promise<string[]> {
    const loadedCommands: string[] = [];
    const commandsFolder = path.join(pluginFolderPath, commandsFolderName);

    try {
        await fs.access(commandsFolder);
    } catch {
        return loadedCommands;
    }

    const commandFiles = (await fs.readdir(commandsFolder)).filter((file) =>
        ['.ts', '.js'].includes(path.extname(file)),
    );

    for (const file of commandFiles) {
        try {
            const commandPath = path.join(commandsFolder, file);
            const commandModule = await import(commandPath);
            const command = commandModule.default || commandModule;
            if (
                loadOptions.skipCommands &&
                loadOptions.skipCommands.includes(command.name)
            ) {
                continue;
            }
            if (!plugin.commands) {
                plugin.commands = [];
            }
            plugin.commands.push(command);
            registerCommand(command);
            loadedCommands.push(command.name);
        } catch (err) {
            console.error(
                chalk.red(
                    `Error loading command file "${file}" in plugin "${plugin.name}": ${err}`,
                ),
            );
        }
    }
    return loadedCommands;
}

async function loadPluginEvents(
    pluginFolderPath: string,
    eventsFolderName: string,
    loadOptions: {
        skipCommands?: string[];
        skipEvents?: string[];
        commandsFolder?: string;
        eventsFolder?: string;
    },
    plugin: Plugin,
): Promise<Array<{ name: string; once: boolean }>> {
    const loadedEvents: Array<{ name: string; once: boolean }> = [];
    const eventsFolder = path.join(pluginFolderPath, eventsFolderName);

    try {
        await fs.access(eventsFolder);
    } catch {
        return loadedEvents;
    }

    const eventFiles = (await fs.readdir(eventsFolder)).filter((file) =>
        ['.ts', '.js'].includes(path.extname(file)),
    );

    for (const file of eventFiles) {
        try {
            const eventPath = path.join(eventsFolder, file);
            const eventModule = await import(eventPath);
            const event = eventModule.default || eventModule;
            if (
                loadOptions.skipEvents &&
                loadOptions.skipEvents.includes(event.name)
            ) {
                continue;
            }
            if (!plugin.events) {
                plugin.events = [];
            }
            plugin.events.push(event);
            loadedEvents.push({ name: event.name, once: Boolean(event.once) });
        } catch (err) {
            console.error(
                chalk.red(
                    `Error loading event file "${file}" in plugin "${plugin.name}": ${err}`,
                ),
            );
        }
    }
    return loadedEvents;
}

export async function loadPlugins(client: Client): Promise<Plugin[]> {
    const pluginsDir = path.join(__dirname, '/../plugins');
    const plugins: Plugin[] = [];
    const pluginLogs: PluginLoadLog[] = [];

    try {
        await fs.access(pluginsDir);
    } catch {
        console.warn(
            chalk.yellow(`Plugins directory not found at ${pluginsDir}`),
        );
        return plugins;
    }

    let dirEntries;
    try {
        dirEntries = await fs.readdir(pluginsDir, { withFileTypes: true });
    } catch (err) {
        console.error(chalk.red(`Error reading plugins directory: ${err}`));
        return plugins;
    }

    const pluginFolders = dirEntries
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

    for (const folder of pluginFolders) {
        const pluginFolderPath = path.join(pluginsDir, folder);
        let mainFiles: string[];
        try {
            const files = await fs.readdir(pluginFolderPath);
            mainFiles = files.filter(
                (file) =>
                    file.toLowerCase().endsWith('plugin.ts') ||
                    file.toLowerCase().endsWith('plugin.js'),
            );
        } catch (err) {
            console.error(
                chalk.red(`Error reading folder "${folder}": ${err}`),
            );
            continue;
        }

        if (mainFiles.length === 0) {
            console.warn(
                chalk.yellow(
                    `No main plugin file found in folder "${folder}". Skipping.`,
                ),
            );
            continue;
        }

        const mainPluginFile = mainFiles[0];
        const pluginPath = path.join(pluginFolderPath, mainPluginFile);
        try {
            const pluginModule = await import(pluginPath);
            const plugin: Plugin = pluginModule.default || pluginModule;

            if (!plugin.name) {
                console.warn(
                    chalk.yellow(
                        `Plugin in folder "${folder}" is missing a name. Skipping.`,
                    ),
                );
                continue;
            }

            plugin.commands = plugin.commands || [];
            plugin.events = plugin.events || [];

            const loadOptions = plugin.loadOptions || {};
            const commandsFolderName = loadOptions.commandsFolder || 'commands';
            const eventsFolderName = loadOptions.eventsFolder || 'events';

            const loadedCommands = await loadPluginCommands(
                pluginFolderPath,
                commandsFolderName,
                loadOptions,
                plugin,
            );
            const loadedEvents = await loadPluginEvents(
                pluginFolderPath,
                eventsFolderName,
                loadOptions,
                plugin,
            );

            for (const event of plugin.events) {
                try {
                    if (event.once) {
                        client.once(event.name, (...args) =>
                            event.execute(...args),
                        );
                    } else {
                        client.on(event.name, (...args) =>
                            event.execute(...args),
                        );
                    }
                } catch (err) {
                    console.error(
                        chalk.red(
                            `Error registering event "${event.name}" for plugin "${plugin.name}": ${err}`,
                        ),
                    );
                }
            }

            console.info(
                chalk.blue(
                    `Loaded plugin: ${chalk.bold.keyword('orange')(plugin.name)}`,
                ),
            );
            pluginLogs.push({
                pluginName: `${plugin.name}\nBy (${plugin.author || 'Unknown'})`,
                commands: loadedCommands,
                events: loadedEvents,
            });

            plugins.push(plugin);
        } catch (error) {
            console.error(
                chalk.red(`Error loading plugin "${folder}": ${error}`),
            );
        }
    }

    const table = new Table({
        head: [
            chalk.bold.keyword('orange')('Plugin'),
            chalk.bold.keyword('orange')('Commands Loaded'),
            chalk.bold.keyword('orange')('Events Loaded'),
        ],
        colWidths: [20, 30, 30],
        wordWrap: true,
    });

    pluginLogs.forEach((log) => {
        const commands =
            log.commands.length > 0 ? log.commands.join('\n') : 'None';
        const events =
            log.events.length > 0
                ? log.events
                      .map((e) => `${e.name}${e.once ? ' (once)' : ''}`)
                      .join('\n')
                : 'None';
        table.push([log.pluginName, commands, events]);
    });

    console.log('\n' + table.toString());
    return plugins;
}

import fs from "fs";
import path from 'path';
import { Client } from 'discord.js';
import { Plugin, PluginLoadLog } from './types/pluginTypes';
import Table from 'cli-table3';
import chalk from "chalk";
import { registerCommand } from './common/commandRegistry';

export async function loadPlugins(client: Client): Promise<Plugin[]> {
  const pluginsDir = path.join(__dirname, 'plugins');
  const plugins: Plugin[] = [];
  const pluginLogs: PluginLoadLog[] = [];

  if (!fs.existsSync(pluginsDir)) {
    console.warn(`Plugins directory not found at ${pluginsDir}`);
    return plugins;
  }

  const pluginFolders = fs.readdirSync(pluginsDir).filter((folder) => {
    const folderPath = path.join(pluginsDir, folder);
    return fs.statSync(folderPath).isDirectory();
  });

  for (const folder of pluginFolders) {
    const pluginFolderPath = path.join(pluginsDir, folder);
    const mainFiles = fs.readdirSync(pluginFolderPath).filter((file) =>
      file.toLowerCase().endsWith('plugin.ts') || file.toLowerCase().endsWith('plugin.js')
    );

    if (mainFiles.length === 0) {
      console.warn(`No main plugin file found in folder "${folder}". Skipping.`);
      continue;
    }

    const mainPluginFile = mainFiles[0];
    const pluginPath = path.join(pluginFolderPath, mainPluginFile);

    try {
      const pluginModule = await import(pluginPath);
      const plugin: Plugin = pluginModule.default || pluginModule;

      if (!plugin.commands) plugin.commands = [];
      if (!plugin.events) plugin.events = [];

      const loadOptions = plugin.loadOptions || {};
      const commandsFolderName = loadOptions.commandsFolder || 'commands';
      const eventsFolderName = loadOptions.eventsFolder || 'events';

      const loadedCommands: string[] = [];
      const loadedEvents: Array<{ name: string; once: boolean }> = [];

      const commandsFolder = path.join(pluginFolderPath, commandsFolderName);
      if (fs.existsSync(commandsFolder)) {
        const commandFiles = fs
          .readdirSync(commandsFolder)
          .filter((file) => file.endsWith('.ts') || file.endsWith('.js'));
        for (const file of commandFiles) {
          const commandPath = path.join(commandsFolder, file);
          const commandModule = await import(commandPath);
          const command = commandModule.default || commandModule;
          if (loadOptions.skipCommands && loadOptions.skipCommands.includes(command.name)) {
            continue;
          }
          plugin.commands.push(command);
          registerCommand(command);
          loadedCommands.push(command.name);
        }
      }

      const eventsFolder = path.join(pluginFolderPath, eventsFolderName);
      if (fs.existsSync(eventsFolder)) {
        const eventFiles = fs
          .readdirSync(eventsFolder)
          .filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

        for (const file of eventFiles) {
          const eventPath = path.join(eventsFolder, file);
          const eventModule = await import(eventPath);
          const event = eventModule.default || eventModule;
          if (loadOptions.skipEvents && loadOptions.skipEvents.includes(event.name)) {
            continue;
          }
          plugin.events.push(event);
          loadedEvents.push({ name: event.name, once: Boolean(event.once) });
        }
      }

      if (plugin.events && Array.isArray(plugin.events)) {
        for (const event of plugin.events) {
          if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
          } else {
            client.on(event.name, (...args) => event.execute(...args));
          }
        }
      }

      console.log(`Loaded plugin: ${chalk.bold(chalk.keyword('orange')(plugin.name))}`);
      pluginLogs.push({
        pluginName: `${plugin.name}\nBy (${plugin.author})`,
        commands: loadedCommands,
        events: loadedEvents,
      });

      plugins.push(plugin);
    } catch (error) {
      console.error(`Error loading plugin "${folder}":`, error);
    }
  }

  const table = new Table({
    head: [
      chalk.bold(chalk.keyword('orange')('Plugin')),
      chalk.bold(chalk.keyword('orange')('Commands Loaded')),
      chalk.bold(chalk.keyword('orange')('Events Loaded'))
    ],
    colWidths: [20, 30, 30],
    wordWrap: true,
  });

  pluginLogs.forEach((log) => {
    const commands = log.commands.length > 0 ? log.commands.join('\n') : 'None';
    const events = log.events.length > 0
      ? log.events.map((e) => `${e.name}${e.once ? ' (once)' : ''}`).join('\n')
      : 'None';
    table.push([log.pluginName, commands, events]);
  });

  console.log('\n' + table.toString());
  return plugins;
}

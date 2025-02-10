import { promises as fs } from "fs";
import path from "path";
import { Client } from "discord.js";
import { Plugin, PluginLoadLog } from "./types/pluginTypes";
import Table from "cli-table3";
import chalk from "chalk";
import { registerCommand } from "./common/commandRegistry";

async function loadPluginCommands(
  pluginFolderPath: string,
  commandsFolderName: string,
  loadOptions: { skipCommands?: string[]; skipEvents?: string[]; commandsFolder?: string; eventsFolder?: string },
  plugin: Plugin
): Promise<string[]> {
  const loadedCommands: string[] = [];
  const commandsFolder = path.join(pluginFolderPath, commandsFolderName);
  try {
    await fs.access(commandsFolder);
  } catch {
    return loadedCommands;
  }

  const commandFiles = (await fs.readdir(commandsFolder)).filter(file =>
    file.endsWith(".ts") || file.endsWith(".js")
  );

  for (const file of commandFiles) {
    try {
      const commandPath = path.join(commandsFolder, file);
      const commandModule = await import(commandPath);
      const command = commandModule.default || commandModule;
      if (loadOptions.skipCommands && loadOptions.skipCommands.includes(command.name)) {
        continue;
      }
      plugin.commands.push(command);
      registerCommand(command);
      loadedCommands.push(command.name);
    } catch (err) {
      console.error(`Error loading command file "${file}" in plugin "${plugin.name}":`, err);
    }
  }
  return loadedCommands;
}

async function loadPluginEvents(
  pluginFolderPath: string,
  eventsFolderName: string,
  loadOptions: { skipCommands?: string[]; skipEvents?: string[]; commandsFolder?: string; eventsFolder?: string },
  plugin: Plugin
): Promise<Array<{ name: string; once: boolean }>> {
  const loadedEvents: Array<{ name: string; once: boolean }> = [];
  const eventsFolder = path.join(pluginFolderPath, eventsFolderName);
  try {
    await fs.access(eventsFolder);
  } catch {
    return loadedEvents;
  }

  const eventFiles = (await fs.readdir(eventsFolder)).filter(file =>
    file.endsWith(".ts") || file.endsWith(".js")
  );

  for (const file of eventFiles) {
    try {
      const eventPath = path.join(eventsFolder, file);
      const eventModule = await import(eventPath);
      const event = eventModule.default || eventModule;
      if (loadOptions.skipEvents && loadOptions.skipEvents.includes(event.name)) {
        continue;
      }
      plugin.events.push(event);
      loadedEvents.push({ name: event.name, once: Boolean(event.once) });
    } catch (err) {
      console.error(`Error loading event file "${file}" in plugin "${plugin.name}":`, err);
    }
  }
  return loadedEvents;
}

export async function loadPlugins(client: Client): Promise<Plugin[]> {
  const pluginsDir = path.join(__dirname, "plugins");
  const plugins: Plugin[] = [];
  const pluginLogs: PluginLoadLog[] = [];

  try {
    await fs.access(pluginsDir);
  } catch {
    console.warn(`Plugins directory not found at ${pluginsDir}`);
    return plugins;
  }

  const allFolders = await fs.readdir(pluginsDir);
  const pluginFolders: string[] = [];
  for (const folder of allFolders) {
    const folderPath = path.join(pluginsDir, folder);
    try {
      const stats = await fs.stat(folderPath);
      if (stats.isDirectory()) {
        pluginFolders.push(folder);
      }
    } catch (err) {
      console.error(`Error accessing folder "${folder}":`, err);
    }
  }

  for (const folder of pluginFolders) {
    const pluginFolderPath = path.join(pluginsDir, folder);
    let mainFiles: string[];
    try {
      const files = await fs.readdir(pluginFolderPath);
      mainFiles = files.filter(file =>
        file.toLowerCase().endsWith("plugin.ts") || file.toLowerCase().endsWith("plugin.js")
      );
    } catch (err) {
      console.error(`Error reading folder "${folder}":`, err);
      continue;
    }

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
      const commandsFolderName = loadOptions.commandsFolder || "commands";
      const eventsFolderName = loadOptions.eventsFolder || "events";

      const loadedCommands = await loadPluginCommands(pluginFolderPath, commandsFolderName, loadOptions, plugin);
      const loadedEvents = await loadPluginEvents(pluginFolderPath, eventsFolderName, loadOptions, plugin);

      for (const event of plugin.events) {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }
      }

      console.log(`Loaded plugin: ${chalk.bold.keyword("orange")(plugin.name)}`);
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
      chalk.bold.keyword("orange")("Plugin"),
      chalk.bold.keyword("orange")("Commands Loaded"),
      chalk.bold.keyword("orange")("Events Loaded")
    ],
    colWidths: [20, 30, 30],
    wordWrap: true,
  });

  pluginLogs.forEach((log) => {
    const commands = log.commands.length > 0 ? log.commands.join("\n") : "None";
    const events =
      log.events.length > 0
        ? log.events.map((e) => `${e.name}${e.once ? " (once)" : ""}`).join("\n")
        : "None";
    table.push([log.pluginName, commands, events]);
  });

  console.log("\n" + table.toString());
  return plugins;
}

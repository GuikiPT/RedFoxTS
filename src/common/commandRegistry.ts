import { PluginCommand } from "../types/pluginTypes";

const commands = new Map<string, PluginCommand>();

export function registerCommand(command: PluginCommand) {
  commands.set(command.name, command);
}

export function getCommand(name: string): PluginCommand | undefined {
  return commands.get(name);
}

export function getAllCommands(): PluginCommand[] {
  return Array.from(commands.values());
}

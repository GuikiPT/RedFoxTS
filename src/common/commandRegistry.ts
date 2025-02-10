import { PluginCommand } from "../types/pluginTypes";

const commands = new Map<string, PluginCommand>();

export function registerCommand(command: PluginCommand): void {
    if (commands.has(command.name)) {
        console.warn(`Command "${command.name}" is already registered and will be overwritten.`);
    }
    commands.set(command.name, command);
}

export function getCommand(name: string): PluginCommand | undefined {
    return commands.get(name);
}

export function getAllCommands(): PluginCommand[] {
    return Array.from(commands.values());
}

export function unregisterCommand(name: string): boolean {
    return commands.delete(name);
}

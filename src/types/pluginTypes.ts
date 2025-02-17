import { ApplicationCommandData, Interaction } from 'discord.js';

export interface PluginEvent<T extends unknown[] = unknown[]> {
    name: string;
    once?: boolean;
    execute: (...args: T) => void;
}

export interface PluginCommand<interaction extends Interaction = Interaction> {
    name: string;
    description?: string;
    data?: ApplicationCommandData;
    execute: (interaction: interaction) => void;
}

export interface PluginLoadOptions {
    commandsFolder?: string;
    eventsFolder?: string;
    skipCommands?: string[];
    skipEvents?: string[];
}

export interface Plugin {
    name: string;
    description: string;
    author: string;
    commands: PluginCommand[];
    events: PluginEvent[];
    loadOptions?: PluginLoadOptions;
}

export interface PluginLoadLog {
    pluginName: string;
    commands: string[];
    events: { name: string; once: boolean }[];
}

export interface PluginEvent<T extends unknown[] = unknown[]> {
  name: string;
  once?: boolean;
  execute: (...args: T) => void;
}

export interface PluginCommand<T = unknown> {
  name: string;
  execute: (interaction: T) => void;
}

export interface PluginLoadOptions {
  commandsFolder?: string;
  eventsFolder?: string;
  skipEvents?: string[];
  skipCommands?: string[];
}

export interface Plugin {
  name: string;
  description: string;
  author: string;
  commands: PluginCommand<unknown>[];
  events: PluginEvent<unknown[]>[]; 
  loadOptions?: PluginLoadOptions;
}

export interface PluginLoadLog {
  pluginName: string;
  commands: string[];
  events: { name: string; once: boolean }[];
}

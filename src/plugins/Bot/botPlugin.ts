import { Plugin } from '../../types/pluginTypes';

const botPlugin: Plugin = {
    name: 'Bot Core',
    description: 'The core of the bot, containing all the commands and events.',
    author: 'GuikiPT',
    commands: [],
    events: [],
    loadOptions: {
        commandsFolder: 'Commands',
        eventsFolder: 'Events',
        skipEvents: [],
        skipCommands: [],
    },
};

export default botPlugin;

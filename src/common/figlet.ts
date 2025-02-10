import figlet from 'figlet';
import { promisify } from 'util';

const figletAsync = promisify(figlet);

export const getFigletText = async (text: string): Promise<string> => {
    try {
        const result = await figletAsync(text);
        return result ?? '';
    } catch (error) {
        console.error('Error generating ASCII art:', error);
        return '';
    }
};

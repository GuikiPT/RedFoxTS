import figlet from 'figlet';
import { promisify } from 'util';

const figletAsync = promisify(figlet);

export const getFigletText = async (text: string): Promise<string> => {
  const result = await figletAsync(text);
  return result ?? '';
};

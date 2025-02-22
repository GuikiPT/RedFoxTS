import { UserModel } from '../database/models/UserModel';

declare module 'discord.js' {
    export interface Client {
        db: {
            UserModel: typeof UserModel;
        };
    }
}

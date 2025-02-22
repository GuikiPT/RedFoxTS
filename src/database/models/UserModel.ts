import { DataTypes, Model } from 'sequelize';
import sequelize from '../sequelize';

export interface IUserAttributes {
    id?: number;
    discordId: string;
    username: string;
}

export class UserModel
    extends Model<IUserAttributes>
    implements IUserAttributes
{
    public id!: number;
    public discordId!: string;
    public username!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

UserModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        discordId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'users',
    },
);

export default UserModel;

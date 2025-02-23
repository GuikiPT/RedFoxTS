import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

let sequelize: Sequelize = new Sequelize(process.env.DATABASE_URL || '', {
    dialect: 'mariadb',
    logging: false,
});

try {
    sequelize = new Sequelize(process.env.DATABASE_URL || '', {
        dialect: 'mariadb',
        logging: false,
    });

    sequelize
        .authenticate()
        .then(() => {
            console.log('Connection has been established successfully.');
        })
        .catch((error) => {
            console.error('Unable to connect to the database:', error);
        });
} catch (error) {
    console.error('Error initializing Sequelize:', error);
}

export default sequelize;

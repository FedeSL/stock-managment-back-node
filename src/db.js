const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DATABASE, 
    process.env.USER, 
    process.env.PASSWORD, {
    host: process.env.HOST,
    port: process.env.PORT_DB,
    // ssl: process.env.SSL,
    dialect: 'postgres',
    // dialectOptions: {
    //     ssl: true
    // },
});

module.exports = sequelize;

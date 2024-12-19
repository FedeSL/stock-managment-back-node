const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Stock = sequelize.define('Stock', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    articuloId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    limiteBajoStock: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'Stock',
    timestamps: false
});

module.exports = Stock;
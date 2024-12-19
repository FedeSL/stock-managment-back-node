const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const DetalleCompra = require('./detalle-compra.model');

const Compra = sequelize.define('Compra', {
    idCompra: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    total: {
        type: DataTypes.VIRTUAL,
        get() {
            return 0
        }
    }
}, {
    tableName: 'Compras',
    timestamps: false
});

Compra.hasMany(DetalleCompra, { as: 'detalleCompra', foreignKey: 'compraId' });

module.exports = Compra;
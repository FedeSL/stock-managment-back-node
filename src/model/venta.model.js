const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const DetalleVenta = require('./detalle-venta.model');

const Venta = sequelize.define('Venta', {
    idVenta: {
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
    tableName: 'Ventas',
    timestamps: false
});

Venta.hasMany(DetalleVenta, { as: 'detalleVenta', foreignKey: 'ventaId' });

module.exports = Venta
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const DetalleVenta = sequelize.define('DetalleVenta', {
    idDetalleVenta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ventaId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    articuloId: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
            return Number(this.getDataValue('total'));
        }
    }
}, {
    tableName: 'DetallesVenta',
    timestamps: false
});

module.exports = DetalleVenta;
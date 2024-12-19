const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const DetalleCompra = sequelize.define('DetalleCompra', {
    idDetalleCompra: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    compraId: {
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
    tableName: 'DetallesCompra',
    timestamps: false
});

module.exports = DetalleCompra;
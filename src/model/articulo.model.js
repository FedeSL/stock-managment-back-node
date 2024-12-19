const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const DetalleVenta = require('./detalle-venta.model');
const DetalleCompra = require('./detalle-compra.model');
const Stock = require('./stock.model');

const Articulo = sequelize.define('Articulo', {
    idArticulo: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    ean: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1 // Activado
    }
}, {
    tableName: 'Articulos',
    timestamps: false
});

Articulo.hasMany(DetalleVenta, { as: 'detalleVenta', foreignKey: 'articuloId' });
Articulo.hasMany(DetalleCompra, { as: 'detalleCompra', foreignKey: 'articuloId' });
Articulo.hasOne(Stock, { as: 'stock', foreignKey: 'articuloId' });

module.exports = Articulo;
const sequelize = require('../db');
const { Op } = require('sequelize');
const DetalleVenta = require('../model/detalle-venta.model');
const Stock = require('../model/stock.model');
const Venta = require('../model/venta.model');

// Sincronizar el modelo con la base de datos
sequelize.sync()
    .then(() => {
        console.log('Conexión a la base de datos exitosa.');
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos:', err);
    });


const getVentas = async (req, res) => {
    try {
        const ventas = await Venta.findAll({
            include: [{
                model: DetalleVenta,
                as: 'detalleVenta'
            }]
        });
        res.status(200).json(ventas);
    } catch (err) {
        res.status(500).send(err.message);
    }
}

const getVentasByArticulo = async (req, res) => {
    console.log(req);
    const { idArticulo } = req.body;

    try {
        const fechasVenta = await Venta.findAll({
            include: [{
                model: DetalleVenta,
                as: 'detalleVenta',
                where: { articuloId: idArticulo },
                required: true
            }],
            attributes: ['fecha'],
            order: [['fecha', 'DESC']]
        });
        console.log(JSON.stringify(fechasVenta));
        res.status(200).json(fechasVenta);
    } catch (error) {
        res.status(500).send(err.message);
    }
}

const getVentasByMonths = async (req, res) => {
    const añoActual = new Date().getFullYear();
    try {
        const ventasPorMes = await Venta.findAll({
            attributes: [
                [sequelize.fn('TO_CHAR', sequelize.col('fecha'), 'MM'), 'mes'],
                [sequelize.fn('TO_CHAR', sequelize.col('fecha'), 'Month'), 'nombreMes'],
                [sequelize.fn('SUM', 
                    sequelize.literal('(SELECT SUM(total) FROM "DetallesVenta" dv WHERE dv."ventaId" = "Venta"."idVenta")')
                ), 'totalVentas']
            ],
            where: sequelize.where(
                sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "fecha"')), 
                añoActual
            ),
            group: [
                sequelize.fn('TO_CHAR', sequelize.col('fecha'), 'MM'),
                sequelize.fn('TO_CHAR', sequelize.col('fecha'), 'Month')
            ],
            order: [
                [sequelize.literal('mes'), 'ASC']
            ],
            raw: true
        });
        res.status(200).json(ventasPorMes);
        
    } catch (error) {
        console.error('Error al obtener ventas por mes:', error);
        res.status(500).send(err.message);
    }
}

const addVentaByArticulo = async (req, res) => {

    const {fecha, idArticulo, cantidad, precio} = req.body;
    const t = await sequelize.transaction();

    try {
        const nuevaVenta = await Venta.create({
            fecha: fecha
        }, { transaction: t });

        const detalleVenta = await DetalleVenta.create({
            ventaId: nuevaVenta.idVenta,
            articuloId: idArticulo,
            cantidad,
            precioUnitario: precio,
            total: precio * cantidad
        }, { transaction: t });

        const stock = await Stock.findByPk(idArticulo, {transaction: t});

        if(stock) {
            if(stock.cantidad < cantidad) {
                throw new Error("La unidades vendidas superan el stock disponible");
            }
            const stockActualizado = await Stock.update({
                cantidad: stock.cantidad - cantidad
            }, {
                where: {
                    articuloId: idArticulo
                },
                transaction: t
            })
        }

        await t.commit();

        res.status(201).json({
            status: 201,
            venta: nuevaVenta,
        });

    } catch (err) {
        await t.rollback();
        res.status(500).send(err.message);
    }
}

module.exports = { 
    getVentas,
    getVentasByArticulo,
    getVentasByMonths,
    addVentaByArticulo
}
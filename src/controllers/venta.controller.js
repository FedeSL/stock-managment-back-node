const sequelize = require('../db');
const { Op, where } = require('sequelize');
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

const getVentasByArticuloAndPage = async (req, res) => {
    console.log(req);
    const { pagina, elementosPorPagina, idArticulo } = req.body;
    const offset = (pagina - 1) * elementosPorPagina;

    try {
        const ventasByPage = await Venta.findAndCountAll({
            limit: elementosPorPagina,
            offset: offset,
            include: [{
                model: DetalleVenta,
                as: 'detalleVenta',
                where: { articuloId: idArticulo },
                required: true
            }],
            order: [['fecha', 'DESC']]
        });
        console.log(JSON.stringify(ventasByPage));
        res.status(200).json(ventasByPage);
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

        const stock = await Stock.findOne({
            where: {
                articuloId: idArticulo
            },
            transaction: t
        });

        if(stock) {
            if(stock.cantidad < cantidad) {
                throw new Error("La unidades vendidas superan el stock disponible");
            }
            const stockActualizado = await stock.decrement('cantidad', {
                by: cantidad,
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

const editVenta = async (req, res) => {

    const {
        idVenta,
        idDetalleVenta,
        fecha,
        cantidad,
        precio
    } = req.body;
    const t = await sequelize.transaction();

    let stockResponse = {};
    let detalleResponse = {};

    try {
        const venta = await Venta.findByPk(idVenta, {
            transaction: t
        });

        if (venta) {
            const ventaActualizada = await venta.update({
                fecha: fecha
            }, {
                where: {
                    idVenta: idVenta
                },
                returning: true,
                plain: true,
                transaction: t
            });
            console.log("ventaActualizada: ", ventaActualizada.dataValues);

            const detalleVentaById = await DetalleVenta.findByPk(idDetalleVenta, {
                transaction: t
            });

            const cantidadPrevia = detalleVentaById.cantidad;

            if (detalleVentaById) {
                const detalleVentaUpdated = await detalleVentaById.update({
                    cantidad: cantidad,
                    precioUnitario: precio,
                    total: precio * cantidad
                }, {
                    where: {
                        idDetalleVenta: idDetalleVenta
                    },
                    returning: true,
                    plain: true,
                    transaction: t
                })
                console.log("------------------> ", detalleVentaUpdated);

                detalleResponse = detalleVentaUpdated.dataValues;
                const id = detalleVentaUpdated.dataValues.articuloId;

                const stock = await Stock.findOne({
                    where: {
                        articuloId: id
                    },
                    transaction: t
                });

                console.log("Cantidad de stock: ", stock.cantidad);
                console.log("Cantidad actualizada de la venta: ", cantidad);
                console.log("Cantidad previa de la venta: ", cantidadPrevia);
        
                if (stock) {
                    if(cantidadPrevia < cantidad) {

                        if(stock.cantidad - (cantidad - cantidadPrevia) < 0) {
                            throw new Error("La unidades vendidas superan el stock disponible");
                        } 

                        const stockActualizado = await stock.decrement('cantidad', {
                            by: cantidad - cantidadPrevia,
                            transaction: t
                        });
                    } else {
                        const stockActualizado = await stock.increment('cantidad', {
                            by: cantidadPrevia - cantidad,
                            transaction: t
                        });
                    }
                    stockResponse = stock;
                }
            }          

            await t.commit();

            res.status(200).json({
                status: 200,
                venta: ventaActualizada.dataValues,
                detalleVenta: detalleResponse,
                stock: stockResponse
            });


        } else {
            return res.status(404).json({
                status: 404,
                message: 'Venta no encontrada'
            });
        }     

    } catch (err) {
        await t.rollback();
        res.status(500).send(err.message);
    }
}

const deleteDetalleVenta = async (req, res) => {
    const {
        id
    } = req.params;
    const t = await sequelize.transaction();

    try {
        const detalleVenta = await DetalleVenta.findByPk(id, {
            transaction: t
        });

        if (detalleVenta) {
            const detalleVentaDeleted = await detalleVenta.destroy({
                transaction: t
            });

            const stock = await Stock.findOne({
                where: {
                    articuloId: detalleVenta.articuloId, 
                },
                transaction: t
            });

            if (stock) {
                const stockActualizado = await stock.increment('cantidad', {
                    by: detalleVenta.cantidad,
                    transaction: t
                });
            }
        }

        await t.commit();
        res.status(200).send("Compra eliminada correctamente");

    } catch (err) {
        await t.rollback();
        res.status(500).send(err.message);
    }
}

module.exports = { 
    getVentas,
    getVentasByArticulo,
    getVentasByArticuloAndPage,
    getVentasByMonths,
    addVentaByArticulo,
    editVenta,
    deleteDetalleVenta
}
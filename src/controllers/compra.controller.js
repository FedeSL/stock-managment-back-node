const sequelize = require('../db');
const Compra = require('../model/compra.model');
const DetalleCompra = require('../model/detalle-compra.model');
const Stock = require('../model/stock.model');

// Sincronizar el modelo con la base de datos
sequelize.sync()
    .then(() => {
        console.log('Conexión a la base de datos exitosa.');
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos:', err);
    });


const getCompras = async (req, res) => {
    try {
        const compras = await Compra.findAll({
            include: [{
                model: DetalleCompra,
                as: 'detalleCompra'
            }]
        });
        res.status(200).json(compras);
    } catch (err) {
        res.status(500).send(err.message);
    }
}

const getComprasByArticulo = async (req, res) => {
    console.log(req);
    const { idArticulo } = req.body;

    try {
        const fechasCompra = await Compra.findAll({
            include: [{
                model: DetalleCompra,
                as: 'detalleCompra',
                where: { articuloId: idArticulo },
                required: true
            }],
            attributes: ['fecha'],
            order: [['fecha', 'DESC']]
        });
        console.log(JSON.stringify(fechasCompra));
        res.status(200).json(fechasCompra);
    } catch (error) {
        res.status(500).send(err.message);
    }
}

const getComprasByMonths = async (req, res) => {
    const añoActual = new Date().getFullYear();
    try {
        const comprasPorMes = await Compra.findAll({
            attributes: [
                [sequelize.fn('TO_CHAR', sequelize.col('fecha'), 'MM'), 'mes'],
                [sequelize.fn('TO_CHAR', sequelize.col('fecha'), 'Month'), 'nombreMes'],
                [sequelize.fn('SUM', 
                    sequelize.literal('(SELECT SUM(total) FROM "DetallesCompra" dv WHERE dv."compraId" = "Compra"."idCompra")')
                ), 'totalCompras']
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
        res.status(200).json(comprasPorMes);
        
    } catch (error) {
        console.error('Error al obtener compras por mes:', error);
        res.status(500).send(err.message);
    }
}

const addCompraByArticulo = async (req, res) => {

    const {fecha, idArticulo, cantidad, precio} = req.body;
    const t = await sequelize.transaction();

    try {
        const nuevaCompra = await Compra.create({
            fecha: fecha
        }, { transaction: t });

        const detalleCompra = await DetalleCompra.create({
            compraId: nuevaCompra.idCompra,
            articuloId: idArticulo,
            cantidad: cantidad,
            precioUnitario: precio,
            total: precio * cantidad
        }, { transaction: t });

        const stock = await Stock.findByPk(idArticulo, {transaction: t});

        if(stock) {
            const stockActualizado = await Stock.update({
                cantidad: stock.cantidad + cantidad
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
            compra: nuevaCompra,
        });

    } catch (err) {
        await t.rollback();
        res.status(500).send(err.message);
    }
}

module.exports = { 
    getCompras,
    getComprasByArticulo,
    getComprasByMonths,
    addCompraByArticulo
}
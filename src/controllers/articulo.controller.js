// const bodyParser = require('body-parser');
const sequelize = require('../db');
const { Op } = require('sequelize');
const Articulo = require('../model/articulo.model');
const Compra = require('../model/compra.model');
const DetalleCompra = require('../model/detalle-compra.model');
const DetalleVenta = require('../model/detalle-venta.model');
const Stock = require('../model/stock.model');

// Sincronizar el modelo con la base de datos
sequelize.sync()
  .then(() => {
    console.log('Conexión a la base de datos exitosa.');
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos:', err);
  });

// Obtener todos los artículos
const getArticulos = async (req, res) => {
    try {
        const articulos = await Articulo.findAll({
            include: [{
                model: DetalleCompra,
                as: 'detalleCompra'
            },
            {
                model: Stock,
                as: 'stock'
            }]
        });
        res.status(200).json(articulos);
    } catch (err) {
        res.status(500).send(err.message);
    }
}

const getArticulosByPage = async (req, res) => {
    try {
        const {pagina, elementosPorPagina, soloSinStock, ocultarSinStock, bajoStock, mostrarDesactivados, orderingValue} = req.body;
        const offset = (pagina - 1) * elementosPorPagina;
        let columnOrdering = 'descripcion';
        let articuloConditions = {};
        let stockConditions = {};
        let order = orderingValue

        if(orderingValue == 'ASC' || orderingValue == 'DESC') {
            columnOrdering = 'descripcion'
        }

        // if(orderingValue == 'LESS' || orderingValue == 'GREATER') {
        //     if(orderingValue == 'LESS') {
        //         order = 'ASC'
        //     } else {
        //         order = 'DESC'
        //     }
        //     columnOrdering = sequelize.col('stock.cantidad')
        // }

        if(!mostrarDesactivados) {
            articuloConditions.estado = 1
        }

        if(ocultarSinStock) {
            stockConditions.cantidad = {
                [Op.gt]: 0
            };
        }

        if(soloSinStock) {
            stockConditions.cantidad = {
                [Op.eq]: 0
            };
        }

        if(bajoStock) {
            stockConditions.cantidad = {
                [Op.and]: {
                    [Op.lte]: sequelize.col('stock.limiteBajoStock'),
                    [Op.gt]: 0
                }
            };
        }

        console.log(articuloConditions);
        console.log(stockConditions);

        const articulosPorPagina = await Articulo.findAndCountAll({
            where: articuloConditions,
            limit: elementosPorPagina,
            offset: offset,
            include: [{
                model: DetalleCompra,
                as: 'detalleCompra'
            },
            {
                model: Stock,
                as: 'stock',
                where: stockConditions,
                required: true
            }],
            distinct: true,
            order: [[columnOrdering, order]]
        });
        res.status(200).json(articulosPorPagina);
    } catch (err) {
        res.status(500).send(err.message);
    }
}

// Obtener un artículo por ID
const getArticuloById = async (req, res) => {
    const { id } = req.params;
    try {
        const articulo = await Articulo.findByPk(id);
        if (articulo) {
            res.status(200).json(articulo);
        } else {
            res.status(404).send('Artículo no encontrado');
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
}

const getTop10ArticulosVendidos = async (req, res) => {
    try {
        const top10Articulos = await Articulo.findAll({
            attributes: [
                'idArticulo', 
                'descripcion',
                [
                    sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('detalleVenta.cantidad')), 0), 
                    'totalVendido'
                ]
            ],
            include: [{
                model: DetalleVenta,
                as: 'detalleVenta',
                attributes: [],
                // Elimina el alias 'detalleVenta'
            }],
            where: {
                estado: 1 // Solo artículos activos
            },
            group: ['Articulo.idArticulo', 'Articulo.descripcion'],
            order: [
                ['totalVendido', 'DESC']
            ],
            limit: 10,
            subQuery: false,
            raw: true
        });

        res.status(200).json(top10Articulos);
    } catch (error) {
        console.error('Error al obtener top 10 artículos:', error);
        res.status(500).send(error);
    }
}

const saveArticuloSinCompra = async (req, res) => {
    const { ean, descripcion, alertaStock } = req.body;
    const t = await sequelize.transaction();
    try {
        const nuevoArticulo = await Articulo.create({ 
            ean, 
            descripcion
        }, { transaction: t });

        const stock = await Stock.create({
            articuloId: nuevoArticulo.idArticulo,
            limiteBajoStock: alertaStock
        }, { transaction: t });

        await t.commit();
        res.status(201).json({
            status: 201,
            articulo: nuevoArticulo
        });
    } catch (err) {
        await t.rollback();
        res.status(500).send(err.message);
    }
}

const saveArticulo = async (req, res) => {
    const { ean, descripcion, alertaStock, cantidad, precio, fecha } = req.body;
    const t = await sequelize.transaction();
    
    try {
        const nuevaCompra = await Compra.create({ 
            fecha 
        }, { transaction: t });

        const nuevoArticulo = await Articulo.create({
            ean,
            descripcion
        }, { transaction: t });

        const nuevoDetalleCompra = await DetalleCompra.create({
            compraId: nuevaCompra.idCompra,
            articuloId: nuevoArticulo.idArticulo,
            cantidad,
            precioUnitario: precio,
            total: precio * cantidad
        }, { transaction: t });
        
        const nuevoStock = await Stock.create({
            articuloId: nuevoArticulo.idArticulo,
            cantidad,
            limiteBajoStock: alertaStock
        }, { transaction: t });

        await t.commit();

        res.status(201).json({
            status: 201,
            articulo: nuevoArticulo
        });

    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// Actualizar un artículo
const updateArticulo = async (req, res) => {

    const { idArticulo, ean, descripcion, alertaStock } = req.body;
    const t = await sequelize.transaction();

    try {
        const articulo = await Articulo.findByPk(idArticulo);
        
        if (articulo) {
            articulo.descripcion = descripcion;
            articulo.ean = ean;
            await articulo.save({ transaction: t });

            const stock = await Stock.findOne({
                where: {
                    articuloId: idArticulo
                }
            });
            if(stock) {
                stock.limiteBajoStock = alertaStock;
                await stock.save({
                    where: {
                        ean: idArticulo
                    },
                    transaction: t
                })
            }

            await t.commit();
            res.status(200).json({
                status: 200,
                articulo: articulo
            });
            
        } else {
            res.status(404).send('Artículo no encontrado');
        }
    } catch (err) {
        await t.rollback();
        res.status(500).send(err.message);
    }
}

// Borrar un artículo
const deleteArticulo = async (req, res) => {
    const { id } = req.params;
    try {
        const articulo = await Articulo.findByPk(id);
        if (articulo) {
        await articulo.destroy();
        res.status(204).send("Articulo eliminado");
        } else {
        res.status(404).send('Artículo no encontrado');
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
}

module.exports = { 
    getArticulos, 
    getArticulosByPage,
    getArticuloById,
    getTop10ArticulosVendidos,
    saveArticulo, 
    saveArticuloSinCompra,
    updateArticulo, 
    deleteArticulo 
}

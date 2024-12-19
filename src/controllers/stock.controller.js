const sequelize = require('../db');
const Stock = require('../model/stock.model');

// Sincronizar el modelo con la base de datos
sequelize.sync()
    .then(() => {
        console.log('Conexión a la base de datos exitosa.');
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos:', err);
    });

const getStockByArticulo = async (req, res) => {

    const {id} = req.params;

    try {
        const stock = await Stock.findByPk(id);
        res.status(200).json(stock);
    } catch (err) {
        res.status(500).send(err.message);
    }
}

const updateStockByArticulo = async (req, res) => {

    const {id, cantidad, limite} = req.body;

    try {
        const stock = await Stock.update({
            cantidad
        },{
            where: {
                idArticulo: id
            }
        });
        res.status(200).json(stock);
    } catch (err) {
        res.status(500).send(err.message);
    }
}

module.exports = {
    getStockByArticulo,
    updateStockByArticulo
}
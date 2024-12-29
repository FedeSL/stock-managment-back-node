const { Router } = require('express');
const router = Router();

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

//RUTAS ARTICULOS
const { 
    getArticulos, 
    getArticulosByPage, 
    getArticuloById, 
    getTop10ArticulosVendidos, 
    saveArticulo, 
    saveArticuloSinCompra,
    updateArticulo, 
    deactivateArticulo,
    deleteArticulo 
} = require('../controllers/articulo.controller');

router.get('/articulos', getArticulos);
router.post('/articulosByPage', getArticulosByPage);
router.get('/articulo/:id', getArticuloById);
router.get('/getTopArticulosVendidos', getTop10ArticulosVendidos);
router.post('/saveArticulo', saveArticulo);
router.post('/saveArticuloSinCompra', saveArticuloSinCompra);
router.put('/updateArticulo', updateArticulo);
router.put('/deactivateArticulo', deactivateArticulo);
router.delete('/deleteArticulo/:id', deleteArticulo);

//RUTAS COMPRAS
const { getCompras, getComprasByArticulo, getComprasByArticuloAndPage, getComprasByMonths, addCompraByArticulo, editCompra, deleteDetalleCompra } = require('../controllers/compra.controller');
router.get('/compras', getCompras);
router.post('/comprasByArticulo', getComprasByArticulo);
router.post('/comprasByArticuloAndPage', getComprasByArticuloAndPage);
router.get('/comprasByMonths', getComprasByMonths);
router.post('/addCompraByArticulo', addCompraByArticulo);
router.post('/editCompra', editCompra);
router.delete('/deleteDetalleCompra/:id', deleteDetalleCompra);

//RUTAS VENTAS
const { getVentas, getVentasByArticulo, getVentasByArticuloAndPage, getVentasByMonths, addVentaByArticulo, editVenta, deleteDetalleVenta } = require('../controllers/venta.controller');
router.get('/ventas', getVentas);
router.post('/ventasByArticulo', getVentasByArticulo);
router.post('/ventasByArticuloAndPage', getVentasByArticuloAndPage);
router.get('/ventasByMonths', getVentasByMonths);
router.post('/addVentaByArticulo', addVentaByArticulo);
router.post('/editVenta', editVenta);
router.delete('/deleteDetalleVenta/:id', deleteDetalleVenta);

//RUTAS STOCK
const { getStockByArticulo, updateStockByArticulo} = require('../controllers/stock.controller');
router.get('/stock', getStockByArticulo);
router.post('/updateStock', updateStockByArticulo);

//RUTAS ARCHIVOS
const { importFile } = require('../controllers/file.controller');
router.post('/import', upload.single('file'), importFile);

module.exports = router;
const fs = require('fs');
const XLSX = require('xlsx');
const Articulo = require('../model/articulo.model');

// Ruta para importar datos desde un archivo XLSX
const importFile = async (req, res) => {
      try {
        const file = req.file.path;
        const workbook = XLSX.readFile(file);
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const articulos = sheet.map(row => ({
          idArticulo: row['idArticulo'],
          descripcion: row['descripcion'],
          cantidad: row['cantidad'],
          precio: row['precio']
        }));

        //await Articulo.bulkCreate(articulos, { ignoreDuplicates: true });

        for (let articulo of articulos) {
          const existingArticulo = await Articulo.findOne({
            where: {
              idArticulo: articulo.idArticulo
            }
          });
          if (existingArticulo) { 
            // Si el artículo ya existe, sumamos la cantidad 
            existingArticulo.cantidad += articulo.cantidad; 
            await existingArticulo.save(); 
          } else { 
            // Si el artículo no existe, lo creamos 
            await Articulo.create(articulo); 
          } 
        }

        fs.unlinkSync(file); // Borrar el archivo después de procesarlo
        res.status(200).json('Datos importados correctamente');
      } catch (err) {
          res.status(500).json(err.message);
      }
}






module.exports = {
  importFile
}
/* comando para correr el script del package.json
 npm run dev */
 require('dotenv').config();

 const express = require('express');
 const app = express();
 const cors = require('cors');
 
 app.use(
     cors({
         origin: ['http://localhost:4200']
     })
 );
 
 // Reflect the origin if it's in the allowed list or not defined (cURL, Postman, etc.)
 const corsOptions = {
     origin: (origin, callback) => {
         if (allowedOrigins.includes(origin) || !origin) {
             callback(null, true);
         } else {
             callback(new Error('Origin not allowed by CORS'));
         }
     },
 };
 
 // Enable preflight requests for all routes
 app.options('*', cors(corsOptions));
 
 /* permite leer json */
 app.use(express.json());

 /* permite aceptar formularios de texto */
 app.use(express.urlencoded({extended: false}));
 
 // middlewares
 /* permite el uso de rutas*/
 app.use(require('./src/routes/router'));
 
 
 // app.listen(3000);
 // This line is important to ensure your app listens to the PORT env var
 const port = process.env.PORT ?? 8080;
 app.listen(port, () => {
     console.log(`App listening on port ${port}`);
     console.log(process.env.HOST);
 });
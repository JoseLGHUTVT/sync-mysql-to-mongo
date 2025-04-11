import mysql from 'mysql2/promise'; // Usar 'mysql2/promise' para trabajar con promesas
import { MongoClient } from 'mongodb';

// Configuración de MySQL usando variables de entorno
const mysqlConnection = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Configuración de MongoDB usando variables de entorno
const mongoURI = process.env.MONGODB_URI;
const mongoClient = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

// Función para sincronizar los datos de MySQL a MongoDB
async function syncData(req, res) {
  let db;
  try {
    // Conectar a MongoDB
    console.log('Conectando a MongoDB...');
    await mongoClient.connect();
    db = mongoClient.db();

    // Sincronización de las colecciones con las tablas de MySQL
    console.log('Iniciando la sincronización...');
    await syncTableToMongo('tb_registros', 'registros', db);

    // Responder al cliente
    console.log('Sincronización completa');
    res.status(200).json({ message: 'Sincronización completa' });
  } catch (err) {
    console.error('Error al conectar a MongoDB o MySQL:', err);
    res.status(500).json({ error: `Error al conectar a MongoDB o MySQL: ${err.message}` });
  } finally {
    // Cerrar la conexión a MongoDB
    try {
      console.log('Cerrando conexión a MongoDB...');
      await mongoClient.close();
    } catch (closeErr) {
      console.error('Error al cerrar la conexión de MongoDB:', closeErr);
    }
  }
}

// Función para sincronizar datos de una tabla de MySQL a una colección de MongoDB
async function syncTableToMongo(mysqlTable, mongoCollection, db) {
  try {
    console.log(`Iniciando sincronización de la tabla ${mysqlTable} a la colección ${mongoCollection}...`);
    const [results] = await mysqlConnection.execute(`SELECT * FROM ${mysqlTable}`);
    const collection = db.collection(mongoCollection);

    // Sincronización en lotes (batch)
    const batchSize = 100;  // Definir un tamaño de lote para evitar sobrecargar el sistema
    let batch = [];

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      
      // Construir un documento con los campos que deseas almacenar en MongoDB
      let document = {
        id_: row.id,          // Asignar correctamente el 'id_' desde MySQL
        object: row.object,    // 'object' como un campo normal
        fecha: row.fecha,      // 'fecha' como un campo normal
        hora: row.hora        // 'hora' como un campo normal
      };

      // Agregar el documento al lote
      batch.push(collection.updateOne({ id_: row.id }, { $set: document }, { upsert: true }));

      // Si el lote alcanza el tamaño máximo, ejecutamos las operaciones y limpiamos el lote
      if (batch.length >= batchSize || i === results.length - 1) {
        await Promise.all(batch);
        batch = [];  // Limpiar el lote
        console.log(`Lote sincronizado para ${mongoCollection}`);
      }
    }

    console.log(`Sincronización completa para ${mongoCollection}`);
  } catch (err) {
    console.error(`Error al consultar ${mysqlTable} o actualizar en MongoDB:`, err);
  }
}

export default syncData;

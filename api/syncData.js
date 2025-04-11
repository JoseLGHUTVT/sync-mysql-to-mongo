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

// Función para sincronizar los datos de MySQL a MongoDB y viceversa
async function syncData(req, res) {
  let db;
  try {
    // Conectar a MongoDB
    console.log('Conectando a MongoDB...');
    await mongoClient.connect();
    db = mongoClient.db();

    // Sincronización de las colecciones con las tablas de MySQL
    console.log('Iniciando la sincronización...');
    await syncTableToMongo('tb_banda', 'bandas', db);
    await syncTableToMongo('tb_clientes', 'clientes', db);
    await syncTableToMongo('tb_controladores', 'controladores', db);
    await syncTableToMongo('tb_registros', 'registros', db);
    await syncTableToMongo('tb_relaciones', 'relaciones', db);
    await syncTableToMongo('tb_roles', 'roles', db);
    await syncTableToMongo('tb_sensor', 'sensores', db);
    await syncTableToMongo('tb_usuarios', 'usuarios', db);

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
    console.log(`Recuperados ${results.length} registros de MySQL`);
    const collection = db.collection(mongoCollection);

    // Sincronización en lotes (batch)
    const batchSize = 50;  // Tamaño de lote reducido para probar
    let batch = [];

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      console.log(`Sincronizando registro con ID: ${row.id_registros}`);

      // Construir un filtro combinando todas las claves relevantes
      let filter = {};
      if (row.id_banda) filter.id_banda = row.id_banda;
      if (row.id_cliente) filter.id_cliente = row.id_cliente;
      if (row.id_control) filter.id_control = row.id_control;
      if (row.id_registros) filter.id_registros = row.id_registros;
      if (row.id_relaciones) filter.id_relaciones = row.id_relaciones;
      if (row.id_sensor) filter.id_sensor = row.id_sensor;
      if (row.id_rol) filter.id_rol = row.id_rol;
      if (row.id_usuario) filter.id_usuario = row.id_usuario;

      const update = { $set: row };

      // Insertar o actualizar documento en MongoDB (usando lotes)
      batch.push(collection.updateOne(filter, update, { upsert: true }));

      // Si el lote alcanza el tamaño máximo, ejecutamos las operaciones y limpiamos el lote
      if (batch.length >= batchSize || i === results.length - 1) {
        console.log(`Ejecutando sincronización de lote...`);
        await Promise.all(batch);
        batch = [];  // Limpiar el lote
        console.log(`Lote sincronizado para ${mongoCollection}`);
      }
    }

    console.log(`Sincronización completa para ${mongoCollection}`);
  } catch (err) {
    console.error(`Error al consultar ${mysqlTable} o actualizar en MongoDB: ${err}`);
  }
}

export default syncData;

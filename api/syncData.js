import mysql from 'mysql2/promise';
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
const mongoClient = new MongoClient(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Función principal
async function syncTableToMongo(mysqlTable, mongoCollection, db) {
  try {
    console.log(`Iniciando sincronización de ${mysqlTable} -> ${mongoCollection}`);
    const [results] = await mysqlConnection.execute(`SELECT * FROM ${mysqlTable}`);
    const collection = db.collection(mongoCollection);

    const batchSize = 100;
    let batch = [];

    for (let i = 0; i < results.length; i++) {
      let row = results[i];
      let filter = {};

      // --- Corrección específica para tb_registros ---
      if (mysqlTable === 'tb_registros') {
        row.id_ = row.id;          // renombrar id a id_
        delete row.id;             // eliminar el campo original
        filter.id_ = row.id_;      // usar id_ como filtro
      } else {
        if (row.id_banda) filter.id_banda = row.id_banda;
        if (row.id_cliente) filter.id_cliente = row.id_cliente;
        if (row.id_control) filter.id_control = row.id_control;
        if (row.id_registros) filter.id_registros = row.id_registros;
        if (row.id_relaciones) filter.id_relaciones = row.id_relaciones;
        if (row.id_sensor) filter.id_sensor = row.id_sensor;
        if (row.id_rol) filter.id_rol = row.id_rol;
        if (row.id_usuario) filter.id_usuario = row.id_usuario;
      }

      const update = { $set: row };
      batch.push(collection.updateOne(filter, update, { upsert: true }));

      if (batch.length >= batchSize || i === results.length - 1) {
        await Promise.all(batch);
        batch = [];
        console.log(`Lote sincronizado para ${mongoCollection}`);
      }
    }

    console.log(`Sincronización completa para ${mongoCollection}`);
  } catch (err) {
    console.error(`Error al procesar ${mysqlTable}:`, err);
  }
}


// Función auxiliar
async function syncTableToMongo(mysqlTable, mongoCollection, db) {
  try {
    console.log(`Iniciando sincronización de ${mysqlTable} -> ${mongoCollection}`);
    const [results] = await mysqlConnection.execute(`SELECT * FROM ${mysqlTable}`);
    const collection = db.collection(mongoCollection);

    const batchSize = 100;
    let batch = [];

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      let filter = {};

      // Asignar correctamente el filtro basado en el nombre de la tabla
      if (mysqlTable === 'tb_registros') {
        filter.id = row.id; // este es el campo correcto en tb_registros
      } else {
        if (row.id_banda) filter.id_banda = row.id_banda;
        if (row.id_cliente) filter.id_cliente = row.id_cliente;
        if (row.id_control) filter.id_control = row.id_control;
        if (row.id_registros) filter.id_registros = row.id_registros;
        if (row.id_relaciones) filter.id_relaciones = row.id_relaciones;
        if (row.id_sensor) filter.id_sensor = row.id_sensor;
        if (row.id_rol) filter.id_rol = row.id_rol;
        if (row.id_usuario) filter.id_usuario = row.id_usuario;
      }

      const update = { $set: row };

      // Log para debug opcional
      // console.log(`Actualizando ${mongoCollection}:`, filter);

      batch.push(collection.updateOne(filter, update, { upsert: true }));

      if (batch.length >= batchSize || i === results.length - 1) {
        await Promise.all(batch);
        batch = [];
        console.log(`Lote sincronizado para ${mongoCollection}`);
      }
    }

    console.log(`Sincronización completa para ${mongoCollection}`);
  } catch (err) {
    console.error(`Error al procesar ${mysqlTable}:`, err);
  }
}

export default syncData;

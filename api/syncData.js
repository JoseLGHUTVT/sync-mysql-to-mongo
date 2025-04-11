import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';

// Configuración de MySQL
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

// Configuración de MongoDB
const mongoURI = process.env.MONGODB_URI;
const mongoClient = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

// Función principal
async function syncData(req, res) {
  let db;
  try {
    console.log('Conectando a MongoDB...');
    await mongoClient.connect();
    db = mongoClient.db();

    console.log('Iniciando la sincronización...');
    await syncTableToMongo('tb_banda', 'bandas', db);
    await syncTableToMongo('tb_clientes', 'clientes', db);
    await syncTableToMongo('tb_controladores', 'controladores', db);
    await syncTableToMongo('tb_registros', 'registros', db); // <- Aquí aplica el mapeo especial
    await syncTableToMongo('tb_relaciones', 'relaciones', db);
    await syncTableToMongo('tb_roles', 'roles', db);
    await syncTableToMongo('tb_sensor', 'sensores', db);
    await syncTableToMongo('tb_usuarios', 'usuarios', db);

    console.log('Sincronización completa');
    res.status(200).json({ message: 'Sincronización completa' });
  } catch (err) {
    console.error('Error al conectar a MongoDB o MySQL:', err);
    res.status(500).json({ error: `Error al conectar a MongoDB o MySQL: ${err.message}` });
  } finally {
    try {
      console.log('Cerrando conexión a MongoDB...');
      await mongoClient.close();
    } catch (closeErr) {
      console.error('Error al cerrar la conexión de MongoDB:', closeErr);
    }
  }
}

// Función para sincronizar tabla -> colección
async function syncTableToMongo(mysqlTable, mongoCollection, db) {
  try {
    console.log(`Sincronizando ${mysqlTable} → ${mongoCollection}...`);
    const [results] = await mysqlConnection.execute(`SELECT * FROM ${mysqlTable}`);
    const collection = db.collection(mongoCollection);

    const batchSize = 100;
    let batch = [];

    for (let i = 0; i < results.length; i++) {
      const row = { ...results[i] };

      // Mapeo especial si la tabla es tb_registros
      if (mysqlTable === 'tb_registros') {
        row.id_registros = row.id_;
        delete row.id_; // Opcional: elimina el campo antiguo
      }

      let filter = {};
      if (row.id_banda) filter.id_banda = row.id_banda;
      if (row.id_cliente) filter.id_cliente = row.id_cliente;
      if (row.id_control) filter.id_control = row.id_control;
      if ('id_registros' in row) filter.id_registros = row.id_registros;
      if (row.id_relaciones) filter.id_relaciones = row.id_relaciones;
      if (row.id_sensor) filter.id_sensor = row.id_sensor;
      if (row.id_rol) filter.id_rol = row.id_rol;
      if (row.id_usuario) filter.id_usuario = row.id_usuario;

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
    console.error(`Error al sincronizar ${mysqlTable}:`, err);
  }
}

export default syncData;

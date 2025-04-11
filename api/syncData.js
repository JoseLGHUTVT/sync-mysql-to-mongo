import mysql from 'mysql2';
import { MongoClient } from 'mongodb';

// Configuración de MySQL usando variables de entorno
const mysqlConnection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

// Configuración de MongoDB usando variables de entorno
const mongoURI = process.env.MONGODB_URI;
const mongoClient = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

// Función para sincronizar los datos de MySQL a MongoDB y viceversa
async function syncData(req, res) {
  try {
    // Conectar a MongoDB
    await mongoClient.connect();
    const db = mongoClient.db();

    // Sincronización de las colecciones con las tablas de MySQL
    await syncTableToMongo('tb_banda', 'bandas', db);
    await syncTableToMongo('tb_clientes', 'clientes', db);
    await syncTableToMongo('tb_controladores', 'controladores', db);
    await syncTableToMongo('tb_registros', 'registros', db);
    await syncTableToMongo('tb_relaciones', 'relaciones', db);
    await syncTableToMongo('tb_roles', 'roles', db);
    await syncTableToMongo('tb_sensor', 'sensores', db);
    await syncTableToMongo('tb_usuarios', 'usuarios', db);

    // Responder al cliente
    res.status(200).json({ message: 'Sincronización completa' });
  } catch (err) {
    console.error('Error al conectar a MongoDB o MySQL:', err);
    res.status(500).json({ error: 'Error al conectar a MongoDB o MySQL' });
  } finally {
    // Cerrar la conexión a MongoDB
    await mongoClient.close();
  }
}

// Función para sincronizar datos de una tabla de MySQL a una colección de MongoDB
async function syncTableToMongo(mysqlTable, mongoCollection, db) {
  mysqlConnection.query(`SELECT * FROM ${mysqlTable}`, async (err, results) => {
    if (err) {
      console.error(`Error al consultar ${mysqlTable} de MySQL:`, err);
      return;
    }

    // Insertar o actualizar datos en MongoDB
    const collection = db.collection(mongoCollection);

    for (let row of results) {
      const filter = { id: row.id_banda || row.id_cliente || row.id_control || row.id_registros || row.id_relaciones || row.id_sensor || row.id_rol || row.id_usuario };
      const update = { $set: row };

      // Insertar o actualizar documento en MongoDB
      await collection.updateOne(filter, update, { upsert: true });
    }

    console.log(`Sincronización completa para ${mongoCollection}`);
  });
}

export default syncData;

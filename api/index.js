const mysql = require('mysql2');
const { MongoClient } = require('mongodb');

// Conexión a MySQL
const mysqlConnection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

// Conexión a MongoDB
const mongoUri = process.env.MONGODB_URI;
const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

// Función para sincronizar datos
const syncData = async () => {
  try {
    // Conectar a MongoDB
    await client.connect();
    const mongoDb = client.db();

    // Conectar a MySQL
    mysqlConnection.connect((err) => {
      if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
      }

      // Sincronización entre MySQL y MongoDB
      mysqlConnection.query('SELECT * FROM tb_banda', async (error, results) => {
        if (error) {
          console.error('Error fetching data from MySQL:', error);
          return;
        }

        const bandasCollection = mongoDb.collection('bandas');
        
        // Insertar datos en MongoDB
        await bandasCollection.insertMany(results);
        console.log('Data synced to MongoDB!');
      });
    });
  } catch (error) {
    console.error('Error in sync:', error);
  }
};

module.exports = async (req, res) => {
  try {
    await syncData();
    res.status(200).send('Sync completed successfully');
  } catch (err) {
    res.status(500).send('Error during sync');
  }
};

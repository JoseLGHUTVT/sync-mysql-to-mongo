# Filtro_Matic

Filtro_Matic es un sistema de gestión que utiliza bases de datos MongoDB y MySQL para almacenar y sincronizar datos relacionados con bandas transportadoras, clientes, controladores, sensores, registros, relaciones y más. Este proyecto permite la sincronización de datos entre ambas bases de datos, asegurando que la información esté actualizada en todo momento.

## Características

- Sincronización de datos entre bases de datos MongoDB y MySQL.
- Gestión de registros de bandas transportadoras, clientes, controladores y más.
- Compatible con la infraestructura de Vercel para despliegue automático.

## Requisitos

Antes de ejecutar este proyecto, asegúrate de tener lo siguiente instalado:

- **Node.js**: [Instala Node.js](https://nodejs.org/)
- **MongoDB**: Una instancia de MongoDB en la que almacenar los datos.
- **MySQL**: Una base de datos MySQL donde gestionar los registros.
- **Vercel**: Si deseas desplegar el proyecto en Vercel.

## Instalación

1. Clona el repositorio en tu máquina local:

   ```bash
   git clone https://github.com/tu-usuario/filtro-matic.git
   cd filtro-matic
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables de entorno:

   ```env
   MYSQL_HOST=tu-host-mysql
   MYSQL_PORT=3306
   MYSQL_USER=tu-usuario-mysql
   MYSQL_PASSWORD=tu-contraseña-mysql
   MYSQL_DATABASE=tu-base-de-datos-mysql

   MONGODB_URI=mongodb://tu-usuario-mongo:tu-contraseña-mongo@tu-host-mongo:27017/tu-base-de-datos-mongo
   ```

## Uso

Para ejecutar el proyecto en modo local, usa el siguiente comando:

```bash
npm start


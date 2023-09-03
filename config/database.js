require('dotenv').config(); 
module.exports =
{
  "development": {
    "username": process.env.DEV_DB_USER,
    "password": process.env.DEV_DB_PWD,
    "database": process.env.DEV_DB_NAME,
    "host": process.env.DEV_DB_HOST,
    "port": process.env.DEV_DB_PORT,
    "dialect": process.env.DEV_DB_DIALECT,
    "logging": true
  },
  "test": {
    "username": process.env.TEST_DB_USER,
    "password": process.env.TEST_DB_PWD,
    "database": process.env.TEST_DB_NAME,
    "host": process.env.TEST_DB_HOST,
    "port": process.env.TEST_DB_PORT,
    "dialect": process.env.TEST_DB_DIALECT,
    "logging": true
  },
  "production": {
    "username": process.env.PROD_DB_USER,
    "password": process.env.PROD_DB_PWD,
    "database": process.env.PROD_DB_NAME,
    "host": process.env.PROD_DB_HOST,
    "port": process.env.PROD_DB_PORT,
    "dialect": process.env.PROD_DB_DIALECT,
    "logging": false
  }
}

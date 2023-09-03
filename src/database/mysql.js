
require('dotenv').config();
const Sequelize = require('sequelize');

let config = require('../../config/database.js');
config = config[process.env.NODE_ENV];

//console.log(config);

//console.log(config.database+' '+config.username+' '+config.password);
//console.log('dialect:'+ config.dialect+' host: '+config.host+' port:'+ config.port)

const sequelize = new Sequelize(config.database, config.username, config.password, {
  dialect: config.dialect,
  host: config.host,
  port: config.port,
  define: {
    freezeTableName: true, // Do not change my table names.
    //  timestamps: false // I will do this individually, thanks.
  },
  timezone: '-03:00',
  //      dialectOptions: {
  //          useUTC: false
  //      },
});

module.exports = sequelize;

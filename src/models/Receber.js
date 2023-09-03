const Mysql = require('../database/mysql');
const { DataTypes } = require('sequelize');

const Receber = Mysql.define('f_receber', {
  numero_titulo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  sequencia_operacao: DataTypes.INTEGER,
  dt_emissao: DataTypes.DATEONLY,
  dt_vencimento: DataTypes.DATEONLY,
  dt_quitacao: DataTypes.DATEONLY,
  cliente_id: DataTypes.INTEGER,
  vendedor_id: DataTypes.INTEGER,
  situacao: DataTypes.INTEGER,
  vlr_titulo: DataTypes.DOUBLE,
  vlr_recebido: DataTypes.DOUBLE,
  vlr_areceber: DataTypes.DOUBLE,
  atraso: DataTypes.INTEGER,
  inclusao_usuario: DataTypes.STRING(40),
  inclusao_data: DataTypes.DATEONLY,
  inclusao_hora: DataTypes.TIME,
  alteracao_usuario: DataTypes.STRING(40),
  alteracao_data: DataTypes.DATEONLY,
  alteracao_hora: DataTypes.TIME
});

Receber.beforeBulkCreate(() => {
  // o beforeBulkCreate só é disparado uma única vez, não serve para alterar todos os registros. Pelo menos pra mim
  console.log('beforeBulkCreate')
});

Receber.beforeCreate((receber) => {
  receber.inclusao_usuario = 'insert by server'
});

module.exports = Receber
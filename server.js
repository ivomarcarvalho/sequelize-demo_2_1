const express = require('express')
const receber = require('./src/controllers/ReceberController')
const djsystem = require('./src/controllers/DjsystemController')
const fs = require('fs');
const ini = require('ini')
const app = express()


app.use(express.json())

const config = ini.parse(fs.readFileSync(__dirname + '/config.ini', 'utf-8'))

const importarPdv = () => {
  setInterval(() => {
    djsystem.pdv(config.geral.cx1)
      .catch(error => {
        console.log('Erro na importação dos arquivos djsystem', error)
      })

  }, 30000)
}

const sincronizarInicial = () => {
  receber.sincronizar('t')
    .catch(error => {
      console.error('Erro na sincronização inicial:', error);
    });
};

const sincronizarPeriodicamente = () => {
  setInterval(() => {
    receber.sincronizar('m')
      .catch(error => {
        console.error('Erro na sincronização periódica:', error);
      });
  }, 30000);
};


app.listen(3333, () => {
  console.log('Server is running ...');

  //sincronizarInicial(); // Executa a sincronização inicial
  //sincronizarPeriodicamente(); // Inicia a sincronização periódica
  importarPdv();

});

// Encerra o servidor e outras operações quando o aplicativo é encerrado
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  // Coloque aqui qualquer lógica de limpeza ou encerramento de recursos necessários
  process.exit(0);
});
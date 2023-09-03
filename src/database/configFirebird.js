const firebird = require('node-firebird')

const dbOptions = {
    host: '127.0.0.1',
    port: 3050,
    database: 'C:\\sci\\D Rodrigues ZN\\banco\\DBSYSTEM.GDB',
    user: 'SYSDBA',
    password: 'masterkey',
    lowercase_keys: true,           // set to true to lowercase keys
    role: null,                     // default
    pageSize: 4096,                 // default when creating database
    retryConnectionInterval: 1000   // reconnect interval in case of connection drop
};

function executeQuery(ssql, params, callback) {

    firebird.attach(dbOptions, function (err, db) {
        if (err) {
            return callback('Erro de conexão com o banco Firebird. ' + err, []);
        }
        db.query(ssql, params, function (err, result) {
            db.detach();
            if (err) {
                return callback('' + err, []);
            } else {
                 return callback(undefined,result);
            }
        });
    });
}
async function executeQueryTrx(transaction, ssql, parameters){

    return new Promise(function (resolve, reject) {
        transaction.query(ssql, parameters, function(err, result){
            if (err) {
                return reject(err);
            } else {
                return resolve(result);
            }
        });
    });
}

module.exports = {executeQuery, firebird, dbOptions, executeQueryTrx};
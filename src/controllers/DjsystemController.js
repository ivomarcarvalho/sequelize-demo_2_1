const fs = require('fs');
const { executeQuery, dbOptions, firebird, executeQueryTrx } = require('../database/configFirebird')
const { dateFormat } = require('./UtilController');


// pegar última sequencia da tabela
// ex:  ssql = 'SELECT MAX(sequencia_operacao) as max_seq FROM m_operacao WHERE cr_operacao = ?'
//      filtro = ['001]

async function getLatestSequence(ssql, filtro) {
    return new Promise((resolve, reject) => {
        executeQuery(ssql, filtro, (err, result) => {
            if (err) {
                reject(err);
            } else {
                //se não existir retorna 1 
                resolve(result[0].max_seq || 1);
            }
        });
    });
}


async function finalizarProcessamento(registrosINI, registrosDIT, registrosFIM) {
    return new Promise((resolve, reject) => {

        firebird.attach(dbOptions, async function (err, db) {
            if (err) {
                throw new Error('Erro de conexão com o banco Firebird: ' + err);
            }

            // Iniciar transação
            db.transaction(firebird.ISOLATION_READ_COMMITTED, async function (err, transaction) {
                if (err) {
                    // throw new Error('Erro ao iniciar transação: ' + err);
                    reject(err)
                }
                // Inserir dados no m_operacao
                // Obter último sequencial
                let ssql = 'SELECT MAX(sequencia_operacao) as max_seq FROM m_operacao WHERE cr_operacao = ?';
                let filtro = ['001'];
                let nextSeq = await getLatestSequence(ssql, filtro);
                nextSeq++;

                for (const campo of registrosINI) {
                    ssql = `insert into m_operacao (cr_operacao,\
                                                        sequencia_operacao,\
                                                        cr_tipo_operacao, \
                                                        codigo_tipo_operacao,\
                                                        cr_cliente,\
                                                        codigo_cliente,\
                                                        cr_vendedor,\
                                                        codigo_vendedor,\
                                                        data_emissao,\
                                                        cpf_cnpj_faturamento,\
                                                        inclusao_usuario) \
                                                 values(?,?,?,?,?,?,?,?,?,?,?)`
                    console.log(nextSeq)
                    await executeQueryTrx(transaction, ssql, [
                        '001',    // cr_operacao
                        nextSeq,  // sequencia_operacao
                        '001',    // cr_tipo_operacao
                        1,        // codigo_tipo_operacao  
                        '001',    // cr_cliente
                        1,        // codigo_vliente
                        '001',    // cr_vendedor
                        1,        // codigo_vendedor
                        dateFormat('2022-03-10', 'DD.MM.YYYY'), // data_emissao
                        '11111111111', //cpf_cnpj_faturamento
                        `${campo[8]}`  // inclusao_usuario
                    ])
                }
                // Inserir dados no m_operacao
                for (const campo of registrosDIT) {
                    // detail
                }

                const ssqlProcedure = 'EXECUTE PROCEDURE SP_OPERACAO (?, ?)'; // Substitua pelo nome da sua stored procedure
                const paramsProcedure = ['001', nextSeq];       // Substitua pelos parâmetros da sua stored procedure

                await executeQueryTrx(transaction, ssqlProcedure, paramsProcedure);




                // Commit da transação
                transaction.commit(function (err) {
                    if (err) {
                        transaction.rollback(function () {
                            console.error('Erro ao confirmar transação. Rollback realizado. ' + err);
                        });
                    } else {
                        console.log('Transação confirmada');
                        resolve()
                    }
                });

            })
        })

    })
}


async function vendaPdv(file) {
    try {
        console.log(`Lendo arquivo: ${file}`);

        const data = await fs.promises.readFile(file, 'utf-8');
        const linhas = data.split(/\r?\n/);

        let registrosINI = [];
        let registrosDIT = [];
        let registrosFIM = [];

        for (const linha of linhas) {
            const campo = linha.split('|');

            if (campo[0] === 'INI') {
                registrosINI.push(campo);
            } else if (campo[0] === 'DIT') {
                registrosDIT.push(campo);
            } else if (campo[0] === 'FIM') {
                registrosFIM.push(campo);
            }
        }

        //console.log(`Arquivo ${file} lido com sucesso.`);
        //console.log(`Registros INI: ${registrosINI.length}`);
        //console.log(`Registros DIT: ${registrosDIT.length}`);
        //console.log(`Registros FIM: ${registrosFIM.length}`);

        await finalizarProcessamento(registrosINI, registrosDIT, registrosFIM)
            .then(() => {
                moveFile(file)
            })
            .catch((err) => {
                throw new error('Eroo na inclusão do arquivo Djsystem ' + err)
            })

        console.log(`Processamento do arquivo ${file} concluído.`);
    } catch (err) {
        console.error(`Erro no arquivo ${file}:`, err);
    }
}

async function moveFile(file) {
    console.log(file)
    var oldPath = file
    var newPath = file.slice(0, - 12) + 'importado//' + file.slice(-12)

    fs.rename(oldPath, newPath, function (err) {
        if (err) throw err
        // console.log('Successfully renamed - AKA moved!')
    })

}

async function getFiles(dirfiles) {
    const files = fs.readdirSync(dirfiles);
    const pdvFiles = []
    for (const file of files) {
        if (file.indexOf('.') !== 0 && file.slice(-4) === '.djm') {
            pdvFiles.push(file)
        }
    }
    return pdvFiles

}

async function pdv(dirfiles) {
    try {
        const pdvFiles = await getFiles(dirfiles);

        console.log('Arquivos encontrados:', pdvFiles.length);
        if (pdvFiles.length != 0) {
            for (const file of pdvFiles) {
                console.log(`Processando arquivo: ${file}`);
                await vendaPdv(`${dirfiles}/${file}`);
            }
            console.log('Todos os arquivos foram processados.');
        } else {
            console.log('Nenhum arquivo localizado!');
        }

    } catch (error) {
        console.error('Erro ao processar arquivos:', error);
    }
}

module.exports = { pdv }

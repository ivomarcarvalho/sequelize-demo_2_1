const fs = require('fs');
//const { pdv, finalizarProcessamento } = require('./seu-arquivo-de-funcoes');
const { executeQuery, dbOptions, firebird, executeQueryTrx } = require('../database/configFirebird')
const { dateFormat } = require('./UtilController');

async function vendaPdv(file) {
    try {
        let registrosINI = [];
        let registrosDIT = [];
        let registrosFIM = [];

        const data = await fs.promises.readFile(file, 'utf-8');
        const linhas = data.split(/\r?\n/);

        let tipoAtual = null;
        let registrosAtuais = [];

        for (const linha of linhas) {
            const campo = linha.split('|');
            const tipoRegistro = campo[0];

            if (tipoRegistro === 'INI') {
                tipoAtual = 'INI';
                registrosINI.push(campo);
            } else if (tipoRegistro === 'DIT') {
                if (tipoAtual !== 'DIT') {
                    tipoAtual = 'DIT';
                    registrosAtuais = [];
                    registrosDIT.push(registrosAtuais);
                }
                registrosAtuais.push(campo);
            } else if (tipoRegistro === 'FIM') {
                tipoAtual = 'FIM';
                registrosFIM.push(campo);
            }
        }

        return { registrosINI, registrosDIT, registrosFIM };
    } catch (err) {
        console.error(err);
        throw err;
    }
}


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
    try {
        // Conectar ao banco Firebird
        firebird.attach(dbOptions, async function (err, db) {
            if (err) {
                throw new Error('Erro de conexão com o banco Firebird: ' + err);
            }

            // Iniciar transação
            db.transaction(firebird.ISOLATION_READ_COMMITTED, async function (err, transaction) {
                if (err) {
                    throw new Error('Erro ao iniciar transação: ' + err);
                }

                // Inserir dados no m_operacao
                for (const campo of registrosINI) {
                    // Obter último sequencial
                    let ssql = 'SELECT MAX(sequencia_operacao) as max_seq FROM m_operacao WHERE cr_operacao = ?';
                    let filtro = ['001'];
                    let nextSeq = await getLatestSequence(ssql, filtro);
                    nextSeq++;

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
                    // const dt = new Date('2022-10-31')                                                 
                    // const ddmmyyyy = dateFormat('2022-10-31', 'DD.MM.YYYY');
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
                // Commit da transação
                transaction.commit(function (err) {
                    if (err) {
                        throw new Error('Erro ao confirmar transação: ' + err);
                    }
                    console.log('Transação confirmada');
                });

            });
        });

        // Continuar com as outras partes do código

    } catch (err) {
        console.error('Erro ao finalizar processamento:', err);

    }
}
async function pdv(dirfiles) {
    try {
        const files = fs.readdirSync(dirfiles);

        for (const file of files) {
            if (file.indexOf('.') !== 0 && file.slice(-4) === '.djm') {
                console.log(`Processando arquivo: ${file}`);
                const { registrosINI, registrosDIT, registrosFIM } = await vendaPdv(`${dirfiles}/${file}`);

                // Processar registros DIT
                for (const registros of registrosDIT) {
                    await finalizarProcessamento(registrosINI, registrosDIT, registrosFIM);
                }

            }
        }

        console.log('Todos os arquivos foram processados.');
    } catch (error) {
        console.error('Erro ao processar arquivos:', error);
    }
}

module.exports = { pdv };

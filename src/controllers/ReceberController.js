const Receber = require('../models/Receber');
const { executeQuery } = require('../database/configFirebird');
const moment = require('moment/moment');

// Função utilitária para tratamento de erro
function handleErrors(err) {
    console.error('Ocorreu um erro:', err);
    throw new Error('Erro no processo de sincronização.');
}

// Função utilitária para formatar data
function dateFormat(date, format) {
    if (format == null) {
        format = 'YYYY-MM-DD'
    }
    const dt = date === null || date === undefined ? moment(new Date).format(format) : moment(date).format(format)
    return (dt)
}

// Função utilitária para formatar hora
function timeFormat(time, format) {
    if (format == null) {
        format = 'HH:mm:ss'
    }
    const hora = time === null || time === undefined ? moment(new Date, 'hh:mm:ss').format(format) : moment(time, 'hh:mm:ss').format(format)
    return (hora)
}

// Selecionar titulos na tabela do contas a receber no banco de dados firebird
// carga igual a 't' - seleciona todos os registros
// carga diferente de 't' seleciona apenas os registros alterados durante os ultimos 5 dias

async function getReceber(carga) {
    try {
        console.log('Seleciona títulos no receber do firebird')
        let filtro = [];
        let sWhere = '';
        if (carga === 't') {
            sWhere = 'where r.cr_receber = ? ';
            filtro = ['001'];
        } else {
            // const dt = new Date();
            // let dateString = dt.toLocaleString('pt-BR', {
            //     year: 'numeric',
            //     month: '2-digit',
            //     day: '2-digit',
            // }).replace(/\//g, '.')
            const dateString = dateFormat(new Date, 'DD.MM.YYYY')
            sWhere = 'where  (r.inclusao_data + 5 >= ?) \
                      or     (r.alteracao_data + 5 >= ?) ';
            filtro = [dateString, dateString];
        }

        let ssql = 'select  r.numero_titulo,\
                            r.situacao,\
                            r.data_emissao dt_emissao,\
                            r.data_vencimento dt_vencimento,\
                            r.data_quitacao dt_quitacao,\
                            r.codigo_cliente cliente_id,\
                            r.codigo_vendedor vendedor_id,\
                            r.sequencia_operacao,\
                            r.valor_titulo vlr_titulo,\
                            r.tot_valor_recebido vlr_recebido,\
                            r.tot_valor_areceber vlr_areceber,\
                            r.inclusao_usuario,\
                            r.inclusao_data,\
                            r.inclusao_hora,\
                            r.alteracao_usuario,\
                            r.alteracao_data,\
                            r.alteracao_hora \
                    from f_receber r '+
            sWhere +
            'order by r.cr_receber, r.numero_titulo ';
        return new Promise((resolve, reject) => {
            executeQuery(ssql, filtro, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        //throw new error('simulando um erro no getReceber!')

    } catch (error) {
        throw error

    }
}
async function createOrUpdate(titulo) {
    try {
        // verifica se o titulo existe na tabela mysql f_receber
        const receber = await Receber.findByPk(titulo.numero_titulo)
        if (receber == null) {
            await create(titulo)
        } else {
            let dataFirebird = dateFormat(receber.alteracao_data, 'YYYY-MM-DD');
            let dataMysql = dateFormat(titulo.alteracao_data, 'YYYY-MM-DD');
            let horaFirebird = timeFormat(receber.alteracao_hora)
            let horaMysql = timeFormat(titulo.alteracao_hora)

            // se data ou hora diferente, atualiza
            if ((dataFirebird != dataMysql) || (horaFirebird != horaMysql)) {
                await update(titulo)
            }
        }
    } catch (error) {
        handleErrors(error)
    }
}
async function create(titulo) {
    try {
        //var hora = `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;
        const data = dateFormat(new Date)
        const hora = timeFormat(new Date)
        await Receber.create({
            "numero_titulo": titulo.numero_titulo,
            "sequencia_operacao": titulo.sequencia_operacao,
            "dt_emissao": titulo.dt_emissao,
            "dt_vencimento": titulo.dt_vencimento,
            "dt_quitacao": titulo.dt_quitacao,
            "cliente_id": titulo.cliente_id,
            "vendedor_id": titulo.vendedor_id,
            "situacao": titulo.situacao,
            "vlr_titulo": titulo.valor_titulo,
            "vlr_recebido": titulo.tot_valor_recebido,
            "vlr_areceber": titulo.tot_valor_areceber,
            "atraso": titulo.atraso,
            "inclusao_usuario": titulo.inclusao_usuario,
            "inclusao_data": titulo.inclusao_data === null ? data : dateFormat(titulo.inclusao_data),
            "inclusao_hora": titulo.inclusao_hora === null ? hora : timeFormat(titulo.inclusao_hora),
            "alteracao_usuario": titulo.alteracao_usuario,
            "alteracao_data": titulo.alteracao_data === null ? data : dateFormat(titulo.alteracao_data),
            "alteracao_hora": titulo.alteracao_hora === null ? hora : timeFormat(titulo.alteracao_hora)
        })

    } catch (error) {
        handleErrors(error);
    }
}
async function update(titulo) {
    try {
        console.log('update titulo = ' + titulo.numero_titulo)
        await Receber.update({
            "numero_titulo": titulo.numero_titulo,
            "sequencia_operacao": titulo.sequencia_operacao,
            "dt_emissao": titulo.dt_emissao,
            "dt_vencimento": titulo.dt_vencimento,
            "dt_quitacao": titulo.dt_quitacao,
            "cliente_id": titulo.cliente_id,
            "vendedor_id": titulo.vendedor_id,
            "situacao": titulo.situacao,
            "vlr_titulo": titulo.vlr_titulo,
            "vlr_recebido": titulo.vlr_recebido,
            "vlr_areceber": titulo.vlr_areceber,
            "atraso": titulo.atraso,
            "inclusao_usuario": titulo.inclusao_usuario,
            "inclusao_data": dateFormat(titulo.inclusao_data, 'YYYY-MM-DD'),
            "inclusao_hora": timeFormat(titulo.inclusao_hora),
            "alteracao_usuario": titulo.alteracao_usuario,
            "alteracao_data": dateFormat(titulo.alteracao_data, 'YYYY-MM-DD'),
            "alteracao_hora": timeFormat(titulo.alteracao_hora)
        }, {
            where: {
                numero_titulo: titulo.numero_titulo
            }
        });
    } catch (error) {
        handleErrors(error);
    }
}

async function bulkCreate(titulos) {
    try {
        await Receber.bulkCreate(titulos, { ignoreDuplicates: true });
        // await Receber.bulkCreate(titulos);
        console.log('Registros inseridos com sucesso.');
    } catch (error) {
        console.error('Erro ao inserir registros em massa:');
        // Aqui você pode adicionar o tratamento necessário para o erro

        handleErrors(error);
    }
}
async function sincronizar(carga) {
    try {
        const titulos = await getReceber(carga)
        if (carga == 't') {
            if (titulos.length > 0) {
                // verifica se a tabela no mysql está vazia, se positivo, popula a tabela

                // const qtdeReceberMysql = await Receber.findAndCountAll();
                // if (qtdeReceberMysql.count === 0) {
                //     await bulkCreate(titulos)
                // }
                await bulkCreate(titulos)
            }
        } else {
            if (titulos.length > 0) {
                //cria titulo(s) novo(s) ou alterar
                const tituloPromises = titulos.map(titulo => createOrUpdate(titulo))
                await Promise.all(tituloPromises)
            }
        }
        // throw new error('simulando um erro!')
    } catch (error) {
        throw error
    }
}

module.exports = { sincronizar }
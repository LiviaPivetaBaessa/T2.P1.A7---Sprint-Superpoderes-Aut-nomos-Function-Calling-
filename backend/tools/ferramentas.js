const { buscarClimaTempoReal } = require('../services/climaService');
const { converterMoeda } = require('../services/moedaService');

/**
 * "Manual de instruções" (JSON Schema) que o Gemini lê
 * para decidir QUANDO e COMO usar cada ferramenta.
 */
const declaracaoClima = {
    name: 'buscarClimaTempoReal',
    description: 'Obtém a temperatura exata e o clima atual de uma cidade. ' +
        'Use sempre que o usuário perguntar sobre o tempo, temperatura, chuva, frio ou calor.',
    parameters: {
        type: 'OBJECT',
        properties: {
            cidade: {
                type: 'STRING',
                description: 'O nome da cidade. Ex: Assis Chateaubriand, Curitiba, Tokyo.'
            }
        },
        required: ['cidade']
    }
};

const declaracaoMoeda = {
    name: 'converterMoeda',
    description: 'Converte um valor de uma moeda para outra usando a cotação atual. ' +
        'Use sempre que o usuário perguntar sobre câmbio, cotação ou quanto vale um valor em outra moeda.',
    parameters: {
        type: 'OBJECT',
        properties: {
            valor: {
                type: 'NUMBER',
                description: 'O valor a ser convertido. Ex: 150'
            },
            moedaOrigem: {
                type: 'STRING',
                description: 'Código ISO da moeda de origem. Ex: USD, EUR, GBP, JPY.'
            },
            moedaDestino: {
                type: 'STRING',
                description: 'Código ISO da moeda de destino. Use BRL (Real) se o usuário não disser.'
            }
        },
        required: ['valor', 'moedaOrigem', 'moedaDestino']
    }
};

// Lista enviada ao Gemini
const declaracoes = [declaracaoClima, declaracaoMoeda];

// Mapa: nome que o Gemini pede -> função JavaScript local que executa
const funcoesDisponiveis = {
    buscarClimaTempoReal: ({ cidade }) => buscarClimaTempoReal(cidade),
    converterMoeda: ({ valor, moedaOrigem, moedaDestino }) =>
        converterMoeda(valor, moedaOrigem, moedaDestino)
};

module.exports = { declaracoes, funcoesDisponiveis };
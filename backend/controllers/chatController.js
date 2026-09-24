const { GoogleGenerativeAI } = require('@google/generative-ai');
const Mensagem = require('../models/Mensagem');
const { declaracoes, funcoesDisponiveis } = require('../tools/ferramentas');

// Configuração da IA + caixa de ferramentas (o Superpoder entra aqui!)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction:
        'Você é um assistente simpático que responde em português do Brasil. ' +
        'Quando a pergunta envolver clima atual ou conversão de moedas, use as ferramentas disponíveis ' +
        'em vez de inventar dados. Para outros assuntos, responda normalmente.',
    tools: [{ functionDeclarations: declaracoes }]
});

const LIMITE_HISTORICO = 20;
const MAX_RODADAS_FERRAMENTAS = 5; // evita loop infinito

/**
 * Busca as últimas mensagens no banco e monta no formato que o Gemini aceita.
 */
async function buscarHistorico() {
    // Pega as MAIS RECENTES (desc) e depois inverte para ficar em ordem cronológica
    const mensagens = await Mensagem.find()
        .sort({ dataHora: -1 })
        .limit(LIMITE_HISTORICO);
    mensagens.reverse();

    const historico = mensagens.map((msg) => ({
        role: msg.role,
        parts: msg.parts.map((p) => ({ text: p.text }))
    }));

    // O Gemini exige que o histórico comece com 'user'
    while (historico.length > 0 && historico[0].role !== 'user') {
        historico.shift();
    }

    return historico;
}

/**
 * Executa as funções que o Gemini pediu e monta as functionResponses.
 */
async function executarFerramentas(chamadas) {
    return Promise.all(chamadas.map(async ({ name, args }) => {
        console.log(`🛠️ Gemini chamou: ${name}(${JSON.stringify(args)})`);

        const funcao = funcoesDisponiveis[name];
        const resultado = funcao
            ? await funcao(args)
            : { erro: `Ferramenta "${name}" não existe.` };

        return { functionResponse: { name, response: resultado } };
    }));
}

/**
 * POST /api/chat
 * Loop de execução: pergunta -> (Gemini pede função -> servidor executa -> devolve)* -> resposta final
 */
async function processarMensagem(req, res) {
    try {
        const { pergunta } = req.body;
        if (!pergunta) return res.status(400).json({ erro: 'Envie uma pergunta.' });

        // 1. Busca o histórico ANTES de salvar a nova pergunta (evita duplicar)
        const historico = await buscarHistorico();
        const chat = model.startChat({ history: historico });

        // 2. Envia a pergunta
        let result = await chat.sendMessage(pergunta);

        // 3. Enquanto o Gemini pedir ferramentas, executa e devolve os resultados
        for (let rodada = 0; rodada < MAX_RODADAS_FERRAMENTAS; rodada++) {
            const chamadas = result.response.functionCalls();
            if (!chamadas || chamadas.length === 0) break;

            const respostasFerramentas = await executarFerramentas(chamadas);
            result = await chat.sendMessage(respostasFerramentas);
        }

        const respostaDaIA = result.response.text();

        // 4. Salva só o texto (pergunta + resposta final) para manter a memória limpa
        await Mensagem.create([
            { role: 'user', parts: [{ text: pergunta }] },
            { role: 'model', parts: [{ text: respostaDaIA }], dataHora: new Date(Date.now() + 1) }
        ]);

        // 5. Devolve a resposta para o Front-end
        return res.status(200).json({ sucesso: true, resposta: respostaDaIA });

    } catch (erro) {
        console.error('❌ Erro:', erro);
        return res.status(500).json({ erro: 'Amnésia do servidor. Erro interno.' });
    }
}

/**
 * DELETE /api/chat/limpar
 * Apaga todo o histórico de conversas do MongoDB.
 */
async function limparHistorico(req, res) {
    try {
        await Mensagem.deleteMany({});
        return res.status(200).json({ sucesso: true, mensagem: 'Histórico apagado com sucesso.' });
    } catch (erro) {
        console.error('❌ Erro ao limpar histórico:', erro);
        return res.status(500).json({ erro: 'Erro ao limpar o histórico.' });
    }
}

module.exports = { processarMensagem, limparHistorico };
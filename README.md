# 🦸 Assistente Gemini — Agente com Function Calling

API de um assistente de IA com **Google Gemini**, **memória no MongoDB Atlas** e **ferramentas autônomas** (Function Calling): a IA decide sozinha quando consultar o **clima em tempo real** (OpenWeatherMap) ou a **cotação de moedas** (AwesomeAPI).

Projeto da disciplina **Serviços em Nuvem** — IFPR Campus Assis Chateaubriand.

## 🧠 Como funciona o Function Calling

```
Usuário pergunta
      ↓
Gemini decide: responder direto OU pedir uma ferramenta (functionCall)
      ↓                                   ↓
Resposta em texto          Servidor executa a função local (clima / moeda)
                                          ↓
                           Servidor devolve o resultado (functionResponse)
                                          ↓
                           Gemini formula a resposta final
```

## 🛠️ Ferramentas do Agente

| Ferramenta | O que faz | API |
|---|---|---|
| `buscarClimaTempoReal(cidade)` | Temperatura, sensação térmica e descrição do clima atual | OpenWeatherMap |
| `converterMoeda(valor, moedaOrigem, moedaDestino)` | Converte valores com a cotação atual | AwesomeAPI |

## 📁 Estrutura

```
├── controllers/
│   ├── chatController.js   # Loop de conversa + execução das ferramentas
│   └── pdfController.js    # Gera o PDF com o resumo da conversa
├── models/
│   └── Mensagem.js         # Schema do Mongoose
├── routes/
│   ├── chatRoutes.js       # /api/chat
│   └── pdfRoutes.js        # /api/pdf
├── services/
│   ├── climaService.js     # Chamada à OpenWeatherMap
│   └── moedaService.js     # Chamada à AwesomeAPI
├── tools/
│   └── ferramentas.js      # Declarações (JSON Schema) + mapa de funções
├── .env.example
├── package.json
└── server.js
```

## 🔌 Rotas

| Método | Rota               | Descrição |
|--------|--------------------|-----------|
| POST   | `/api/chat`        | Envia `{ "pergunta": "..." }` e recebe a resposta da IA |
| DELETE | `/api/chat/limpar` | Apaga todo o histórico do MongoDB |
| POST   | `/api/pdf`         | Envia `{ "historico": "..." }` e recebe um PDF com o resumo |

## ▶️ Como rodar

1. `npm install`
2. Copie `.env.example` para `.env` e preencha:
   - `GEMINI_API_KEY` → https://aistudio.google.com/apikey
   - `MONGO_URI` → MongoDB Atlas (Connect → Drivers)
   - `WEATHER_API_KEY` → https://home.openweathermap.org/api_keys
3. `npm start` → `http://localhost:3000`

## 🧪 Testes de aceite

| Pergunta | Comportamento esperado |
|---|---|
| "Me conte uma piada de programador" | Responde normal, sem ferramentas |
| "Vou precisar de blusa de frio hoje em Londres?" | Chama `buscarClimaTempoReal` e responde com a temperatura real |
| "Qual cidade eu acabei de perguntar?" | Lembra pelo MongoDB |
| "Estou indo para Paris amanhã. Vai chover lá? Quantos Reais preciso para 150 Euros?" | Chama as **duas** ferramentas |

## 🛠️ Tecnologias

Node.js · Express · Mongoose · MongoDB Atlas · Google Gemini (Function Calling) · OpenWeatherMap · AwesomeAPI · PDFKit
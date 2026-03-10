const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve static files
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
} else {
  app.use(express.static(__dirname));
}

app.get('/', (req, res) => {
  const locations = [
    path.join(__dirname, 'public', 'index.html'),
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'rumo.html'),
  ];
  const found = locations.find(p => fs.existsSync(p));
  if (found) res.sendFile(found);
  else res.status(404).send('index.html not found');
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `És o RUMO — guia inteligente das freguesias de Real, Dume e Semelhe, no concelho de Braga, Portugal.
Respondes APENAS a questões sobre estas três freguesias: percursos, pontos de interesse, história, natureza e dicas práticas.
Se perguntarem sobre outros temas, informa educadamente que só podes ajudar com Real, Dume e Semelhe.
Tom caloroso, rigoroso e convidativo. Português europeu.

PERCURSOS:
PR18 · Trilho Mosteiros Suevo e Visigótico | Real+Dume | 4,8km | 1h30 | Fácil
PR19 · Trilho Mosteiros Visigótico e Beneditino | Real+Semelhe | 14,3km | 5h00 | Algo difícil

PONTOS DE INTERESSE:
SEMELHE: Monte das Caldas, Monte São Filipe/São Gens, Chapel Senhor de Lírio (08h-20h), Igreja São João Baptista, Sítio Arqueológico Sandarão, Fonte Queimeira.
REAL: Parque do Barral, Convento São Francisco, Igreja São Jerónimo, Chapel São Frutuoso (visigótico), Caminho Medieval do Anel, Quinta Pedagógica.
DUME: Via Romana XIX, Igreja São Martinho de Dume, Núcleo Museológico, Ruínas Arqueológicas, Chapel São Sebastião.`,
        messages
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RUMO running on port ${PORT}`));

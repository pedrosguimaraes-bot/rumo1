const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Serve static files — try public/ first, then root
const publicDir = path.join(__dirname, 'public');
const rootDir = __dirname;

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
} else {
  app.use(express.static(rootDir));
}

// Explicit root route as fallback
app.get('/', (req, res) => {
  const publicIndex = path.join(__dirname, 'public', 'index.html');
  const rootIndex = path.join(__dirname, 'index.html');
  const rumoHtml = path.join(__dirname, 'rumo.html');

  if (fs.existsSync(publicIndex)) {
    res.sendFile(publicIndex);
  } else if (fs.existsSync(rootIndex)) {
    res.sendFile(rootIndex);
  } else if (fs.existsSync(rumoHtml)) {
    res.sendFile(rumoHtml);
  } else {
    res.status(404).send('index.html not found');
  }
});

const SYSTEM = `És o RUMO — guia inteligente das freguesias de Real, Dume e Semelhe, no concelho de Braga, Portugal.

Respondes APENAS a questões sobre estas três freguesias: percursos, pontos de interesse, história, natureza e dicas práticas para visitantes.
Se perguntarem sobre outros temas, informa educadamente que só podes ajudar com Real, Dume e Semelhe.
Se o utilizador sugerir nova informação, agradece e menciona que a sugestão será considerada.
Tom caloroso, rigoroso e convidativo. Português europeu. Respostas concisas mas ricas.

PERCURSOS:
PR18 BRG · Trilho dos Mosteiros Suevo e Visigótico | Real + Dume | 4,8 km | 1h30 | Fácil | Todo o ano
Liga Convento de São Francisco (Real) à Igreja São Martinho (Dume). Circular. Piso empedrado. Poucos desníveis.

PR19 BRG · Trilho dos Mosteiros Visigótico e Beneditino | Real + Semelhe | 14,3 km | 5h00 | Algo difícil | Todo o ano
Convento de São Francisco (Real) → Mosteiro Beneditino de Tibães. Caminhos medievais, matas, linhas de água.

PONTOS DE INTERESSE:
SEMELHE: Monte das Caldas, Monte São Filipe/São Gens, Chapel Senhor de Lírio (08h-20h), Igreja São João Baptista, Sítio Arqueológico Sandarão, Fonte Queimeira.
REAL: Parque do Barral, Convento São Francisco, Igreja São Jerónimo, Chapel São Frutuoso (visigótico), Caminho Medieval do Anel, Quinta Pedagógica.
DUME: Via Romana XIX, Igreja São Martinho de Dume, Núcleo Museológico, Ruínas Arqueológicas, Chapel São Sebastião.

CONTEXTO:
Real: Villa romana. Núcleo histórico denso.
Dume: Sede episcopal séc. VI. São Martinho converteu os Suevos.
Semelhe: Terra rural. Montes e veiga do Rio Torto.`;

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
        system: SYSTEM,
        messages
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RUMO server running on port ${PORT}`));

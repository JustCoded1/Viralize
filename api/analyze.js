export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { concept, niche, audio, postDay, postTime } = req.body;

  if (!concept || !niche) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `You are a viral content intelligence system trained on TikTok and Instagram performance data. Analyze this video concept and return a JSON object ONLY — no other text, no markdown.

Video Concept / Hook: "${concept}"
Niche: ${niche}
Audio Strategy: ${audio || 'Not specified'}
Planned Post Time: ${postDay || 'Not specified'} at ${postTime || 'Not specified'}

Return this exact JSON structure:
{
  "viralScore": <number 0-100>,
  "verdict": "<one of: UNLIKELY, LOW CHANCE, MODERATE, HIGH POTENTIAL, LIKELY VIRAL>",
  "verdictDetail": "<one sentence summary>",
  "metrics": [
    { "name": "Hook Strength", "score": <0-100>, "color": "<hex>" },
    { "name": "Trend Alignment", "score": <0-100>, "color": "<hex>" },
    { "name": "Audio Strategy", "score": <0-100>, "color": "<hex>" },
    { "name": "Posting Window", "score": <0-100>, "color": "<hex>" },
    { "name": "Niche Demand", "score": <0-100>, "color": "<hex>" }
  ],
  "recommendations": [
    { "type": "<boost|warn|info>", "title": "<short>", "description": "<specific actionable advice>" },
    { "type": "<boost|warn|info>", "title": "<short>", "description": "<specific actionable advice>" },
    { "type": "<boost|warn|info>", "title": "<short>", "description": "<specific actionable advice>" },
    { "type": "<boost|warn|info>", "title": "<short>", "description": "<specific actionable advice>" }
  ]
}
Use hex colors: #00F5A0 for high (70+), #FFD700 for medium (40-69), #FF6B35 for low (<40). Be brutally honest.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = data.content[0].text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(text);

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

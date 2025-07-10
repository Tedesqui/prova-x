// O ficheiro /api/corrigir-gemini.js

// Esta função é executada no servidor da Vercel, protegendo a sua chave de API do Gemini.
export default async function handler(req, res) {
  // 1. Verificar se o pedido é do tipo POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Método ${req.method} não permitido`);
  }

  // 2. Obter a chave da API do Gemini a partir das Variáveis de Ambiente (SEGURO)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "A chave da API do Gemini não está configurada no servidor." });
  }

  // 3. Obter o texto enviado pelo frontend
  const { texto } = req.body;

  if (!texto || texto.trim() === '') {
    return res.status(400).json({ error: "Nenhum texto foi fornecido para correção." });
  }

  // 4. Preparar e enviar o pedido para a API do Gemini
  // Usaremos um modelo rápido e eficiente como o gemini-1.5-flash-latest
  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  // O "prompt" que instrui o Gemini sobre o que fazer.
  const systemPrompt = "Você é um assistente de correção de provas. Analise o texto seguinte, que é a resposta de um aluno. Corrija a resposta de forma clara e concisa, explicando os erros, se houver, e fornecendo a resposta correta. Seja direto e objetivo.";
  
  const requestBody = {
    contents: [{
      parts: [{
        text: `${systemPrompt}\n\nResposta do aluno: "${texto}"`
      }]
    }]
  };

  try {
    const geminiResponse = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await geminiResponse.json();

    // Se a API do Gemini devolver um erro
    if (!geminiResponse.ok || !data.candidates) {
        console.error("Erro da API do Gemini:", data);
        throw new Error(data.error?.message || 'Ocorreu um erro ao comunicar com a IA do Gemini.');
    }

    // Extrai o texto da resposta do Gemini
    const correcao = data.candidates[0]?.content?.parts[0]?.text?.trim() || "Não foi possível obter uma correção.";

    // 5. Enviar a correção de volta para o frontend
    return res.status(200).json({ resultado: correcao });

  } catch (error) {
    console.error("Erro interno do servidor:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function generateBoard(prompt: string): Promise<any> {
  if (typeof window === "undefined") throw new Error("Environment not supported");
  const apiKey = localStorage.getItem("google-ai-key");
  if (!apiKey) throw new Error("API key não encontrada. Vá em Settings para inserir sua Google AI API Key.");

  // Prompt instruction to the model: output JSON describing the board
  const instruction = `Você deve gerar apenas UM JSON válido para criar um board Kanban. O JSON deve conter:\n1) fields: columns com colunas, cada coluna com id, title, cards.\n2) cards devem usar os tipos: EPIC, HISTORY, TASK.\n3) Use quantos EPICs e quantas HISTORYs forem necessários para representar o projeto. Cada HISTORY deve estar ligada a um EPIC via parentId.\n4) Cada TASK deve estar ligada a uma HISTORY via parentId. Use quantos TASKs forem necessários por HISTORY.\n5) Cada card deve ter id, title, description, type e parentId. Um EPIC deve ter parentId vazio (""), cada HISTORY deve apontar para o id do EPIC correto, e cada TASK deve apontar para o id da HISTORY correta.\n6) Os cards sempre devem estar na primeira coluna retornada, que pode ser chamada de "Backlog", "A fazer", "Epicos" ou outro nome equivalente. Se você retornar outras colunas, elas devem ficar vazias.\n7) Responda apenas com JSON, sem texto explicativo ou markdown.\n\nExemplo de estrutura esperada:\n{\n  "columns": [\n    {\n      "id": "col-1",\n      "title": "Backlog",\n      "cards": [\n        {\n          "id": "card-epic-1",\n          "type": "EPIC",\n          "title": "Nome do Epic",\n          "description": "Descrição do epic",\n          "parentId": ""\n        },\n        {\n          "id": "card-history-1",\n          "type": "HISTORY",\n          "title": "Nome da History",\n          "description": "Descrição da history",\n          "parentId": "card-epic-1"\n        },\n        {\n          "id": "card-task-1",\n          "type": "TASK",\n          "title": "Nome da Task",\n          "description": "Descrição da task",\n          "parentId": "card-history-1"\n        }\n      ]\n    }\n  ]\n}\n`;

  const body = {
    contents: [
      {
        parts: [
          { text: instruction + "\n\nPrompt do usuário: " + prompt }
        ]
      }
    ]
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google AI error: ${res.status} - ${txt}`);
  }

  const json = await res.json();
  // Tentativa robusta de extrair texto da resposta (vários formatos possíveis)
  let textOut: string | undefined;
  try {
    if (json?.candidates && Array.isArray(json.candidates) && json.candidates.length > 0) {
      const cand = json.candidates[0];
      const content = cand.content;
      if (content) {
        const contentArray = Array.isArray(content) ? content : [content];
        for (const c of contentArray) {
          if (typeof c.text === 'string') { textOut = c.text; break; }
          if (Array.isArray(c.parts)) {
            textOut = c.parts.map((p: any) => p.text || '').join('');
            if (textOut) break;
          }
        }
      }
      if (!textOut && typeof cand.output === 'string') textOut = cand.output;
    }
    // Fallbacks
    if (!textOut && json?.output) textOut = typeof json.output === 'string' ? json.output : JSON.stringify(json.output);
    if (!textOut && json?.candidates && typeof json.candidates[0] === 'string') textOut = json.candidates[0];
    if (!textOut) textOut = JSON.stringify(json);
  } catch (e) {
    textOut = JSON.stringify(json);
  }

  // Tentar parsear o JSON da resposta
  try {
    // Limpar blocos de código como ```json ... ``` e crases soltas
    let cleaned = (textOut || "").trim();
    const fenceMatch = cleaned.match(/```(?:json)?\n([\s\S]*?)\n```/i);
    if (fenceMatch && fenceMatch[1]) cleaned = fenceMatch[1].trim();
    // Remover crases residuais
    cleaned = cleaned.replace(/^\s*`+/, "").replace(/`+\s*$/, "").trim();

    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (err) {
    // Se a resposta contiver texto extra, tentar extrair o primeiro bloco JSON
    const m = (textOut || "").match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch (e) {
        throw new Error("Falha ao parsear JSON retornado pela IA.");
      }
    }
    throw new Error("Resposta da IA não contém JSON válido.");
  }
}

import { GoogleGenAI } from "@google/genai";

// Model is configurable: GEMINI_MODEL in .env (default below)
const getModel = () => process.env.GEMINI_MODEL || "gemini-3.5-flash";

const PROMPTS = {
    sticky_notes: (userPrompt) => `
You help brainstorm on a whiteboard. Generate sticky notes for this request: "${userPrompt}".
Return ONLY JSON in this exact shape:
{"notes":[{"text":"short idea (max 12 words)","color":"yellow|pink|green|blue|orange"}]}
Return between 6 and 12 notes.`,

    flowchart: (userPrompt) => `
You draw flowcharts. Create a flowchart for: "${userPrompt}".
Return ONLY JSON in this exact shape:
{"nodes":[{"id":"n1","label":"short label (max 6 words)"}],"edges":[{"from":"n1","to":"n2","label":"optional"}]}
Use between 3 and 12 nodes. Every edge must reference existing node ids.`,

    chart: (userPrompt) => `
You turn data into charts. Request: "${userPrompt}".
Return ONLY JSON in this exact shape:
{"chartType":"bar|line|pie","title":"chart title","labels":["a","b"],"values":[1,2]}
labels and values must have the same length (max 12). Values must be numbers.`,
};

export const AI_MODES = Object.keys(PROMPTS);

// Asks Gemini for JSON and returns it parsed.
// Throws an Error with .status = 503 (not configured) or 502 (bad AI output).
export const askGemini = async (mode, userPrompt) => {
    if (!process.env.GEMINI_API_KEY) {
        const error = new Error("GEMINI_API_KEY is not set");
        error.status = 503;
        throw error;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
        model: getModel(),
        contents: PROMPTS[mode](userPrompt),
        config: { responseMimeType: "application/json" },
    });

    let text = (response.text || "").trim();
    // some models still wrap JSON in ```json fences
    text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    try {
        return JSON.parse(text);
    } catch (error) {
        const bad = new Error("AI returned invalid JSON");
        bad.status = 502;
        throw bad;
    }
};

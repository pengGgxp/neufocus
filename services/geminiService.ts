import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTaskSuggestion = async (title: string, type: string, duration: number): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key 未配置。";
  }

  try {
    const prompt = `
      我正在规划一个任务。
      任务名称: "${title}"
      任务类型: "${type}"
      预计耗时: ${duration} 分钟。

      请针对这个具体任务提供一句非常简短的战略建议或拆分技巧，帮助我高效完成。请保持在 30 字以内。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "暂时无法生成建议。";
  }
};
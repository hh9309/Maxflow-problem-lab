import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Graph, AIProvider } from "../types";

// Helper to clean JSON string from Markdown code blocks
const cleanJsonString = (str: string): string => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

// Helper for DeepSeek API calls
const callDeepSeek = async (messages: any[], apiKey: string, model: string = 'deepseek-chat', jsonMode = false) => {
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        response_format: jsonMode ? { type: 'json_object' } : undefined
      })
    });
    
    if (!response.ok) {
        throw new Error(`DeepSeek API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek Call Failed:", error);
    throw error;
  }
};

export const generateGraphScenario = async (
    topic: string, 
    provider: AIProvider = 'gemini', 
    model: string = 'gemini-3-flash-preview',
    apiKey?: string
): Promise<{ graph: Graph, description: string }> => {
  
  const systemPrompt = "你是一位图论专家，专门负责创建最大流问题的教育可视化场景。请直接返回JSON格式。";
  const userPrompt = `请基于主题：“${topic}”生成一个最大流网络图数据结构。
  该图必须代表一个流量问题（例如：管道运输、交通流量、物流配送）。
  要求：
  1. 必须且只能有一个源点（id为 's'）和一个汇点（id为 't'）。
  2. 包含 4 到 8 个中间节点。
  3. 边的容量（capacity）必须为整数。
  4. 节点的 'x' 坐标应在 50 到 1000 之间。
  5. 节点的 'y' 坐标应在 50 到 700 之间。
  6. 请按逻辑排列节点（源点在左，汇点在右）。
  7. 描述（description）必须用中文，简述这个场景（例如：“城市供水网络，源点为水库，汇点为处理厂”）。
  
  请只返回 JSON 数据，不要包含 markdown 格式化代码块。`;

  try {
    let responseText = "";

    if (provider === 'deepseek') {
        if (!apiKey) throw new Error("使用 DeepSeek 需要提供 API Key");
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt + "\n请返回符合以下结构的JSON: { description: string, nodes: [{id, x, y, isSource, isSink}], edges: [{source, target, capacity}] }" }
        ];
        responseText = await callDeepSeek(messages, apiKey, model, true);
    } else {
        // Gemini Logic
        if (!apiKey) throw new Error("使用 Gemini 需要提供 API Key。请在设置中输入。");

        const ai = new GoogleGenAI({ apiKey: apiKey });
        const graphSchema: Schema = {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING, description: "场景的中文简述" },
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    isSource: { type: Type.BOOLEAN, nullable: true },
                    isSink: { type: Type.BOOLEAN, nullable: true },
                  },
                  required: ["id", "x", "y"]
                }
              },
              edges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    source: { type: Type.STRING },
                    target: { type: Type.STRING },
                    capacity: { type: Type.INTEGER },
                  },
                  required: ["source", "target", "capacity"]
                }
              }
            },
            required: ["nodes", "edges", "description"]
          };

        const response = await ai.models.generateContent({
            model: model,
            contents: userPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: graphSchema,
                systemInstruction: systemPrompt
            }
        });
        responseText = response.text || "{}";
    }

    const cleanedJson = cleanJsonString(responseText);
    const result = JSON.parse(cleanedJson);

    // Post-processing
    const nodes = result.nodes.map((n: any) => ({
      ...n,
      isSource: n.id === 's',
      isSink: n.id === 't'
    }));

    const edges = result.edges.map((e: any, idx: number) => ({
      id: `e${idx}`,
      source: e.source,
      target: e.target,
      capacity: e.capacity,
      flow: 0
    }));

    return {
      graph: { nodes, edges },
      description: result.description
    };

  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("生成场景失败，请检查网络或 API Key。");
  }
};

export const explainStep = async (
    graph: Graph, 
    logs: string[], 
    currentPhase: string,
    provider: AIProvider = 'gemini',
    model: string = 'gemini-3-flash-preview',
    apiKey?: string
): Promise<string> => {
    
    const context = `
    当前图状态:
    节点数: ${graph.nodes.length}
    边: ${graph.edges.map(e => `${e.source}->${e.target} (流量:${e.flow}/容量:${e.capacity})`).join(', ')}
    当前算法阶段: ${currentPhase}
    最近日志: ${logs.slice(-3).join('; ')}
    `;

    const prompt = `请简要解释当前最大流算法（双标号法）的这一步正在发生什么。请使用中文，限制在1-2句话内，通俗易懂，适合教学。`;

    try {
        if (provider === 'deepseek') {
             if (!apiKey) throw new Error("使用 DeepSeek 需要提供 API Key");
             const messages = [
                { role: "system", content: "你是一位算法助教。" },
                { role: "user", content: `${context}\n\n${prompt}` }
             ];
             return await callDeepSeek(messages, apiKey, model);
        } else {
             // Gemini Logic
             if (!apiKey) throw new Error("使用 Gemini 需要提供 API Key。");

             const ai = new GoogleGenAI({ apiKey: apiKey });
             const response = await ai.models.generateContent({
                model: model,
                contents: `${context}\n\n${prompt}`,
            });
            return response.text || "无法获取解释。";
        }
    } catch (e) {
        console.error(e);
        return "获取 AI 解释失败。";
    }
};

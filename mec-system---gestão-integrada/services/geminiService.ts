
import { GoogleGenAI, Type } from "@google/genai";
import { PartStatus, PartCategory, POPULAR_BRANDS } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const partSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    internalCode: { type: Type.STRING },
    originalCode: { type: Type.STRING },
    category: { type: Type.STRING },
    supplierName: { type: Type.STRING },
    supplierEmail: { type: Type.STRING },
    supplierPhone: { type: Type.STRING },
    description: { type: Type.STRING },
    status: { type: Type.STRING },
    compatibleBrands: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Lista de marcas compatíveis"
    }
  },
  required: ["name", "internalCode", "originalCode", "category", "supplierName", "description", "status"],
};

export const generatePartProfile = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Crie um cadastro de peça automotiva fictícia, realista para um sistema de autopeças (Linha Pesada/Diesel). 
      Baseie-se nesta descrição: "${prompt}".
      Gere códigos realistas (Código Interno estilo 'INT-XXX', Original estilo OEM).
      Gere dados de fornecedor (Nome, Email, Telefone fictícios brasileiros).
      Identifique as marcas compatíveis (ex: ${POPULAR_BRANDS.join(', ')}) e preencha o campo compatibleBrands.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: partSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta da IA");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Erro ao gerar peça:", error);
    throw error;
  }
};

export const analyzePartContext = async (partData: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise esta peça automotiva e sugira veículos compatíveis e cuidados na instalação: ${partData}`,
    });
    return response.text;
  } catch (error) {
    console.error("Erro na análise:", error);
    return "Análise indisponível no momento.";
  }
};

import { GoogleGenAI, Type } from "@google/genai";
import { PartStatus, PartCategory, POPULAR_BRANDS } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for generating an auto part profile
const partSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    internalCode: { type: Type.STRING },
    originalCode: { type: Type.STRING },
    category: { type: Type.STRING, enum: Object.values(PartCategory) },
    supplierName: { type: Type.STRING },
    supplierEmail: { type: Type.STRING },
    supplierPhone: { type: Type.STRING },
    description: { type: Type.STRING },
    status: { type: Type.STRING, enum: Object.values(PartStatus) },
    compatibleBrands: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Lista de marcas compatíveis (ex: Volvo, Mercedes, Cummins, Eaton, ZF, etc.)"
    }
  },
  required: ["name", "internalCode", "originalCode", "category", "supplierName", "description", "status"],
};

export const generatePartProfile = async (prompt: string) => {
  if (!process.env.API_KEY) throw new Error("API Key não encontrada");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Crie um cadastro de peça automotiva fictícia, realista para um sistema de autopeças (Linha Pesada/Diesel). 
      Baseie-se nesta descrição: "${prompt}".
      Gere códigos realistas (Código Interno estilo 'INT-XXX', Original estilo OEM).
      Gere dados de fornecedor (Nome, Email, Telefone fictícios brasileiros).
      Identifique as marcas compatíveis (ex: ${POPULAR_BRANDS.join(', ')}) e preencha o campo compatibleBrands.
      Se a descrição for vazia, crie uma peça aleatória popular (ex: pastilha de freio, alternador, kit embreagem).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: partSchema,
        temperature: 0.6,
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
  if (!process.env.API_KEY) return "API Key necessária para análise.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analise esta peça automotiva e sugira:
      1. Veículos compatíveis prováveis (Modelos específicos).
      2. Procedimento resumido de instalação ou cuidados.
      Dados da peça: ${partData}`,
      config: {
        maxOutputTokens: 250,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Erro na análise:", error);
    return "Não foi possível realizar a análise no momento.";
  }
};
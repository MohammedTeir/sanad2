
import { GoogleGenAI, Type } from "@google/genai";
import { DPProfile } from "../types";

export const geminiService = {
  async analyzeVulnerability(profile: DPProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      بناءً على البيانات التفصيلية التالية لعائلة نازحة في غزة، قم بحساب درجة الهشاشة (0-100) وتقديم مبرر منطقي.
      
      البيانات:
      - رب الأسرة: ${profile.headOfFamily} (${profile.gender})، العمر: ${profile.age}
      - الحالة: ${profile.maritalStatus} ${profile.widowReason ? `(سبب الترمل: ${profile.widowReason})` : ''}
      - العمل: ${profile.isWorking ? `يعمل كـ ${profile.job}` : 'عاطل عن العمل / لا يعمل'}
      - الصحة لرب الأسرة: إعاقة (${profile.disabilityType})، مزمن (${profile.chronicDiseaseType})، إصابة حرب (${profile.warInjuryType})
      
      معلومات الزوجة:
      - الاسم: ${profile.wifeName || 'لا يوجد'}
      - الصحة للزوجة: إعاقة (${profile.wifeDisabilityType})، مزمن (${profile.wifeChronicDiseaseType})، إصابة حرب (${profile.wifeWarInjuryType})
      - الحمل: ${profile.wifeIsPregnant ? `حامل في الشهر ${profile.wifePregnancyMonth}` : 'لا يوجد'}

      معايير التقييم:
      1. أرامل الشهداء والنساء اللواتي يعلنّ أسر بدون عمل لهن أولوية قصوى (90+).
      2. إصابات الحرب وبتر الأطراف ترفع الأولوية فوراً.
      3. إذا كان رب الأسرة والزوجة كلاهما يعاني من إعاقة أو مرض، تعتبر الحالة "هشاشة مركبة".
      4. العاطلين عن العمل في مراكز الإيواء يزيد احتياجهم الاقتصادي.
      
      قم بالرد بتنسيق JSON فقط يحتوي على score و reason.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              reason: { type: Type.STRING }
            },
            required: ["score", "reason"]
          }
        }
      });
      const text = response.text || "{}";
      return JSON.parse(text.trim());
    } catch (error) {
      console.error("Gemini Error:", error);
      return { score: 50, reason: "فشل التحليل التلقائي، تم تعيين درجة متوسطة بناءً على المعطيات الأساسية." };
    }
  }
};

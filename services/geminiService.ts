
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Chapter, Book } from "../types";

// HELPER: Cleans AI output to ensure JSON.parse doesn't fail
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  // Remove markdown code blocks if present
  let clean = text.replace(/```json/g, "").replace(/```/g, "");
  return clean.trim();
};

class GeminiService {
  
  private getClient(): GoogleGenAI {
    const apiKey = "AIzaSyAFn9ULvF0c076fnfAIOiUtZWL4pj9GQ7Y";
    if (!apiKey) {
        throw new Error("API_KEY_MISSING: The Gemini API key is not configured in the environment.");
    }
    return new GoogleGenAI({ apiKey: apiKey });
  }

  private async withRetry<T>(operation: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < retries + 1; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.error(`Gemini API Attempt ${i + 1} failed:`, error);
        
        const msg = error.toString().toLowerCase();
        
        // Don't retry on Auth or Safety errors as they are terminal for that specific prompt
        if (msg.includes("api_key") || msg.includes("auth") || msg.includes("401") || msg.includes("403")) {
          throw new Error("AUTHENTICATION_ERROR: Your API key is invalid or lacks permissions.");
        }
        
        if (msg.includes("safety") || msg.includes("blocked")) {
          throw new Error("CONTENT_SAFETY_ERROR: The prompt or generated content was flagged by safety filters.");
        }

        if (msg.includes("quota") || msg.includes("429")) {
          if (i === retries) throw new Error("QUOTA_EXCEEDED: You've reached the Gemini API rate limit. Please wait a minute.");
        }

        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    throw new Error(lastError?.message || "An unexpected error occurred during AI generation.");
  }

  private getMasterAuthorPrompt(genre: string, tone: string): string {
      return `
        You are an elite, award-winning, hyper-versatile master author.
        Your task is to write content for a \"${genre}\" book with a \"${tone}\" tone.
        
        TRANSFORMATION RULES:
        - If Comedy/Humor: Use wit, situational irony, funny dialogue, and lighthearted descriptions.
        - If Dark Romance: Use seductive, intoxicating, sensorial language. Deep emotional tension.
        - If Mythology/Eldritch Horror: Adopt a divine or terrifying, ancient, reverent tone.
        - If Thriller/True Crime: Use tight pacing, sharp sentences, suspense.
        
        WRITING STANDARDS:
        - Show, don't tell.
        - Strong hooks and vivid sensory details.
      `;
  }

  async generateBookStructure(title: string, genre: string, tone: string, audience: string, pacing: string, additionalPrompt: string): Promise<Partial<Book>> {
    return this.withRetry(async () => {
      const ai = this.getClient();
      const model = "gemini-3-flash-preview";
      
      const systemInstruction = this.getMasterAuthorPrompt(genre, tone);

      const prompt = `
        Create a complete book blueprint for a book titled \"${title}\".
        Target Audience: ${audience}.
        Pacing Strategy: ${pacing}.
        Additional Context: ${additionalPrompt}.
        
        Generate a JSON response with:
        1. title (string)
        2. author (string)
        3. chapters (array of objects with 'title' and 'summary')
        4. characters (array of objects with 'name', 'role', 'description')
        
        Generate exactly 8 chapters.
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              chapters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                  },
                  required: ["title", "summary"],
                },
              },
              characters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ["name", "role", "description"],
                },
              },
            },
            required: ["title", "author", "chapters", "characters"],
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error("EMPTY_RESPONSE: The model returned an empty response.");
      
      const data = JSON.parse(cleanJson(text));
      
      if (!data.chapters || !Array.isArray(data.chapters)) {
        throw new Error("INVALID_STRUCTURE: The AI failed to generate a valid chapter list.");
      }
      
      const chapters: Chapter[] = data.chapters.map((c: any, index: number) => ({
        id: `ch-${index}-${Date.now()}`,
        title: c.title,
        summary: c.summary,
        content: "",
        isGenerated: false,
      }));

      return {
        title: data.title,
        author: data.author,
        chapters: chapters,
        characters: data.characters || [],
      };
    });
  }

  async generateBookCover(title: string, genre: string, tone: string): Promise<string | undefined> {
    try {
      return await this.withRetry(async () => {
        const ai = this.getClient();
        const model = "gemini-2.5-flash-image";
        
        const prompt = `
          Professional book cover for \"${title}\". 
          Genre: ${genre}. Tone: ${tone}.
          Cinematic lighting, 8k resolution, award-winning digital art.
          The title \"${title}\" should be elegantly integrated.
        `;

        const response = await ai.models.generateContent({
          model: model,
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: "3:4" } }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
           if (part.inlineData && part.inlineData.mimeType.startsWith('image')) {
              return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
           }
        }
        return undefined;
      });
    } catch (error) {
      console.error("Cover generation failed, but continuing with book text:", error);
      return undefined;
    }
  }

  async generateChapterContent(bookTitle: string, chapter: Chapter, style: string, perspective: string, previousChapterSummary?: string): Promise<string> {
    return this.withRetry(async () => {
      const ai = this.getClient();
      const model = "gemini-3-flash-preview"; 
      
      const prompt = `
        Write the full content for chapter: \"${chapter.title}\" of the book \"${bookTitle}\".
        
        Chapter Summary: ${chapter.summary}
        ${previousChapterSummary ? `Context from previous chapter: ${previousChapterSummary}` : ''}
        
        Writing Style: ${style}
        Narrative Perspective: ${perspective}
        
        Requirements:
        - Approx 800 words.
        - Immersive, sensory details.
        - Use Markdown for emphasis.
        - Start directly with the prose.
      `;

      const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
      });

      const text = response.text;
      if (!text || text.trim().length < 100) {
          throw new Error("CONTENT_SHORT: Generated content was unexpectedly short.");
      }
      return text;
    });
  }

  async rewriteText(selectedText: string, instruction: string, bookContext: string): Promise<string> {
    const ai = this.getClient();
    const model = "gemini-3-flash-preview";
    const prompt = `Rewrite this text: \"${selectedText}\" based on: \"${instruction}\". Context: ${bookContext}. Return only the rewritten text.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text || selectedText;
  }

  async askBook(question: string, currentChapterContent: string, bookSummary: string): Promise<string> {
    const ai = this.getClient();
    const model = "gemini-3-flash-preview";
    const prompt = `Answer this: \"${question}\". Context: ${bookSummary}. Chapter: ${currentChapterContent.substring(0, 2000)}`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text || "I am lost for words...";
  }

  async generateSpeech(text: string, voiceName: string): Promise<string | undefined> {
    return this.withRetry(async () => {
        const ai = this.getClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    });
  }
}

export const geminiService = new GeminiService();

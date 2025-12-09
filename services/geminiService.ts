import { GoogleGenAI } from "@google/genai";
import { Chapter, Book } from "../types";

// HELPER: Cleans AI output to ensure JSON.parse doesn't fail
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  // Remove markdown code blocks if present
  let clean = text.replace(/```json/g, "").replace(/```/g, "");
  return clean.trim();
};

class GeminiService {
  
  // FIX: Robustly check for Vercel/Vite environment variables
  private getClient(): GoogleGenAI {
    // 1. Check process.env.VITE_GEMINI_API_KEY (Vercel Server / Node)
    // 2. Check process.env.API_KEY (Backup)
    // 3. Check import.meta.env.VITE_GEMINI_API_KEY (Vite Client Fallback)
    const apiKey = process.env.VITE_GEMINI_API_KEY || 
                   process.env.API_KEY || 
                   (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : undefined);

    if (!apiKey) {
      console.error("Configuration Error: API Key is missing.");
      console.error("Checked: VITE_GEMINI_API_KEY and API_KEY.");
      throw new Error("AUTH_ERROR: API Key is missing. Please check your Vercel Environment Variables.");
    }
    return new GoogleGenAI({ apiKey });
  }

  private async withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${i + 1} failed:`, error);
        
        const msg = error.toString().toLowerCase();
        if (msg.includes("api_key") || msg.includes("auth")) {
          throw new Error("AUTH_ERROR: API Key is invalid or not configured correctly.");
        }
        if (msg.includes("quota") || msg.includes("429")) {
          throw new Error("QUOTA_EXCEEDED");
        }

        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    throw lastError;
  }

  private getMasterAuthorPrompt(genre: string, tone: string): string {
      return `
        You are an elite, award-winning, hyper-versatile master author.
        Your task is to write content for a "${genre}" book with a "${tone}" tone.
        
        TRANSFORMATION RULES:
        - If Dark Romance: Use seductive, intoxicating, erotic (implied), exotic, sensorial language. Deep emotional tension.
        - If Mythology: Adopt a divine, ancient, reverent tone. Use poetic metaphors.
        - If Thriller: Use tight pacing, sharp sentences, suspense, dread, cinematic action.
        - If Fantasy: Lush world-building, magic systems, immersive geography.
        - If Non-fiction: Professional, structured, factual, clear.
        - If Cyberpunk/Sci-Fi: Tech-noir atmosphere, neon descriptions, grimy yet high-tech feel.
        
        WRITING STANDARDS:
        - Show, don't tell.
        - Strong hooks and vivid sensory details.
        - Cinematic pacing.
        - No clichés unless genre-appropriate.
      `;
  }

  async generateBookStructure(title: string, genre: string, tone: string, audience: string, additionalPrompt: string): Promise<Partial<Book>> {
    return this.withRetry(async () => {
      const ai = this.getClient();
      const model = "gemini-2.5-flash";
      
      const systemInstruction = this.getMasterAuthorPrompt(genre, tone);

      const prompt = `
        Create a complete, publish-worthy book blueprint for a book titled "${title}".
        Target Audience: ${audience}.
        Additional Context: ${additionalPrompt}.
        
        Generate a JSON response with:
        1. The book title (feel free to improve it).
        2. A creative author name.
        3. A list of 8-12 chapters. Each chapter must have a title and a compelling plot summary (2-3 sentences).
        4. A list of 3-5 main characters. Each character must have a name, role (e.g., Protagonist, Antagonist), and a brief description.
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          // FIX: Use String Literals for Schema Types to prevent build errors
          responseSchema: {
            type: 'OBJECT', 
            properties: {
              title: { type: 'STRING' },
              author: { type: 'STRING' },
              chapters: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    title: { type: 'STRING' },
                    summary: { type: 'STRING' },
                  },
                  required: ["title", "summary"],
                },
              },
              characters: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: { type: 'STRING' },
                    role: { type: 'STRING' },
                    description: { type: 'STRING' },
                  },
                  required: ["name", "role", "description"],
                },
              },
            },
            required: ["title", "author", "chapters", "characters"],
          },
        },
      });

      // FIX: Handle response.text safely
      const text = response.text || "{}";
      
      const data = JSON.parse(cleanJson(text));
      
      if (!data.chapters || !Array.isArray(data.chapters)) {
        throw new Error("Invalid book structure generated");
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
        const g = genre.toLowerCase();
        const t = tone.toLowerCase();
        
        let artDirection = "Highly contrasting, cinematic lighting, 8k resolution, award-winning digital art.";
        let typographyStyle = "Bold, readable, metallic typography.";

        if (g.includes('dark romance') || (g.includes('romance') && (t.includes('dark') || t.includes
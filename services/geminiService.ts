import { GoogleGenAI, SchemaType } from "@google/genai";
import { Chapter, Book } from "../types";

// HELPER: Cleans AI output to ensure JSON.parse doesn't fail
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  // Remove markdown code blocks if present
  let clean = text.replace(/```json/g, "").replace(/```/g, "");
  return clean.trim();
};

class GeminiService {
  
  // FIX: Updated to match your Vercel Environment Variable (VITE_GEMINI_API_KEY)
  private getClient(): GoogleGenAI {
    // 1. Check process.env.VITE_GEMINI_API_KEY (Vercel Server / Node)
    // 2. Check process.env.API_KEY (Standard Backup)
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
          responseSchema: {
            type: SchemaType.OBJECT, // FIX: Use SchemaType instead of Type
            properties: {
              title: { type: SchemaType.STRING },
              author: { type: SchemaType.STRING },
              chapters: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    title: { type: SchemaType.STRING },
                    summary: { type: SchemaType.STRING },
                  },
                  required: ["title", "summary"],
                },
              },
              characters: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    name: { type: SchemaType.STRING },
                    role: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING },
                  },
                  required: ["name", "role", "description"],
                },
              },
            },
            required: ["title", "author", "chapters", "characters"],
          },
        },
      });

      // FIX: response.text is a function in the new SDK
      const text = response.text ? response.text() : "{}";
      
      if (!text) throw new Error("No content generated");

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

        if (g.includes('dark romance') || (g.includes('romance') && (t.includes('dark') || t.includes('gothic')))) {
            artDirection = "Gothic Baroque masterpiece in the style of Tom Bagshaw and Brom. High Contrast. Deep obsidian shadows vs piercing ruby red highlights. A single symbolic object (a key, a mask, a wilting rose). Smoke tendrils, velvet textures, thorns. Dramatic Chiaroscuro lighting.";
            typographyStyle = "Elegant, sharp serif font in Silver or Gold leaf, subtly distressed. Title '${title}' MUST be clearly visible and integrated into the art.";
        } 
        else if (g.includes('cyberpunk') || (g.includes('sci') && t.includes('neon'))) {
            artDirection = "Neon Noir Cyberpunk in the style of Josan Gonzalez and Syd Mead. High Contrast. Deep midnight blues vs blinding neon pinks and cyans. Hyper-detailed, rain-slicked streets, holographic advertisements, chrome reflections.";
            typographyStyle = "Futuristic, glitch-effect sans-serif font in glowing Neon. Title '${title}' MUST be large and legible, as if part of a heads-up display.";
        }
        else if (g.includes('fantasy')) {
           artDirection = "Ethereal High Fantasy in the style of John Howe and Alan Lee. High Contrast. Deep ancient forest greens vs glowing golden magic. Oil painting texture. Epic scale, atmospheric perspective, a lone figure gazing at ancient ruins.";
           typographyStyle = "Ornate, hand-lettered gold calligraphy with a subtle glow. Title '${title}' MUST be woven into the artwork's composition.";
        }
        else if (g.includes('thriller') || g.includes('mystery')) {
          artDirection = "Psychological Thr
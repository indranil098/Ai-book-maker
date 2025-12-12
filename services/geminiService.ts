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
  
  // FIX: Updated to find 'VITE_GEMINI_API_KEY' for Vercel/Vite compatibility
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
        - If Comedy/Humor: Use wit, situational irony, funny dialogue, and lighthearted descriptions. Make the reader laugh.
        - If Dark Romance: Use seductive, intoxicating, erotic (implied), exotic, sensorial language. Deep emotional tension.
        - If Mythology/Eldritch Horror: Adopt a divine or terrifying, ancient, reverent tone. Use poetic metaphors. Unspeakable dread.
        - If Thriller/True Crime: Use tight pacing, sharp sentences, suspense, dread, cinematic action.
        - If Fantasy/Sci-Fi: Lush world-building, magic systems or tech details (as appropriate), immersive geography.
        - If Non-fiction/Self-Help: Professional, structured, factual, clear, inspiring, actionable.
        - If Western: Gritty, dusty, laconic, wide landscapes, tension.
        
        WRITING STANDARDS:
        - Show, don't tell.
        - Strong hooks and vivid sensory details.
        - Cinematic pacing.
        - No clichés unless genre-appropriate (like in Comedy).
      `;
  }

  async generateBookStructure(title: string, genre: string, tone: string, audience: string, pacing: string, additionalPrompt: string): Promise<Partial<Book>> {
    return this.withRetry(async () => {
      const ai = this.getClient();
      const model = "gemini-2.5-flash";
      
      const systemInstruction = this.getMasterAuthorPrompt(genre, tone);

      const prompt = `
        Create a complete, publish-worthy book blueprint for a book titled "${title}".
        Target Audience: ${audience}.
        Pacing Strategy: ${pacing}.
        Additional Context: ${additionalPrompt}.
        
        Generate a JSON response with:
        1. The book title (feel free to improve it).
        2. A creative author name.
        3. A list of 8-12 chapters. Each chapter must have a title and a compelling plot summary (2-3 sentences). ensure the chapter flow matches the requested pacing (${pacing}).
        4. A list of 3-5 main characters. Each character must have a name, role (e.g., Protagonist, Antagonist), and a brief description.
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          // FIX: Use string literals (e.g. 'OBJECT') instead of Type.OBJECT to avoid build errors
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

        if (g.includes('comedy') || t.includes('funny') || t.includes('humor') || t.includes('witty') || t.includes('lighthearted')) {
             artDirection = "Playful, vibrant, illustrated style cover. Bright colors like yellow, teal, or hot pink. Quirky, bold composition. Cartoon-style or vector art. Funny or ironic visual elements.";
             typographyStyle = "Bold, bubbly, or handwritten sans-serif font. Fun and approachable. Title '${title}' MUST be the focal point.";
        }
        else if (g.includes('romance') || t.includes('romantic')) {
             if (t.includes('dark') || g.includes('dark')) {
                artDirection = "Gothic Baroque masterpiece. Deep obsidian shadows vs piercing ruby red highlights. A single symbolic object (a key, a mask, a rose). Dramatic lighting.";
                typographyStyle = "Elegant, sharp serif font in Silver or Gold leaf.";
             } else {
                artDirection = "Soft, dreamy, pastel colors. Illustrated couple or symbolic romantic objects (flowers, letters). Warm lighting, watercolor or soft digital art style.";
                typographyStyle = "Flowing, elegant script font.";
             }
        } 
        else if (g.includes('sci') || g.includes('cyberpunk') || g.includes('space')) {
            artDirection = "Neon Noir Cyberpunk or Space Opera. Deep midnight blues vs blinding neon pinks and cyans. Hyper-detailed, futuristic cityscapes or nebulas. High-tech feel.";
            typographyStyle = "Futuristic, glitch-effect sans-serif font in glowing Neon.";
        }
        else if (g.includes('fantasy') || g.includes('magic')) {
           artDirection = "Ethereal High Fantasy in the style of John Howe. Deep ancient forest greens vs glowing golden magic. Oil painting texture. Epic scale.";
           typographyStyle = "Ornate, hand-lettered gold calligraphy with a subtle glow.";
        }
        else if (g.includes('horror') || g.includes('eldritch')) {
          artDirection = "Cosmic Horror or classic scary. Deep shadows, unsettling composition. Sickly greens or blood reds. Surreal and terrifying.";
          typographyStyle = "Jagged, hand-scratched or bleeding font.";
        }
        else if (g.includes('thriller') || g.includes('mystery') || g.includes('crime')) {
          artDirection = "Psychological Thriller cover. High Contrast Black and White with a single splash of Red. Double exposure photography, silhouettes in fog. Cinematic suspense.";
          typographyStyle = "Bold, distressed, condensed sans-serif font. Huge and imposing.";
        }
        else if (g.includes('western')) {
          artDirection = "Vintage Western poster style. Sunset orange and dusty brown palette. Silhouettes of cowboys, wide desert landscapes.";
          typographyStyle = "Vintage woodblock Western font.";
        }
        else if (g.includes('self-help') || g.includes('non-fiction')) {
          artDirection = "Clean, minimalist, Swiss design. Abstract geometric shapes or a single powerful metaphoric object. Lots of negative space. Calming colors.";
          typographyStyle = "Clean, modern Helvetica or geometric sans-serif.";
        }
        
        const prompt = `
          Design a professional, publishable, best-selling book cover for: "${title}".
          Genre: ${genre}. Tone: ${tone}.
          VISUAL STYLE: ${artDirection}
          TYPOGRAPHY: The title "${title}" MUST be written prominently on the cover. Use this style: ${typographyStyle}
          COMPOSITION: Vertical aspect ratio (3:4). Clean, professional layout.
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
      console.error("Cover generation failed:", error);
      return undefined;
    }
  }
  
  async generateWorldMap(book: Book): Promise<string | undefined> {
    try {
      return await this.withRetry(async () => {
        const ai = this.getClient();
        const model = "gemini-2.5-flash-image";
        const settingSummary = book.chapters.map(c => c.summary).join(' ').substring(0, 1000);

        const prompt = `
          Create a detailed world map for a ${book.genre} book titled "${book.title}".
          The world is described as having a ${book.tone} tone. 
          Key elements from the story include: ${settingSummary}.
          
          STYLE: Generate a beautiful, hand-drawn map in a vintage parchment or epic fantasy style. 
          Include geographical features like mountains, forests, rivers, and cities that fit the genre.
          Do NOT include any text or labels on the map. The map should be purely visual.
          ASPECT RATIO: 16:9, landscape.
        `;
        
        const response = await ai.models.generateContent({
          model: model,
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: "16:9" } }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
           if (part.inlineData && part.inlineData.mimeType.startsWith('image')) {
              return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
           }
        }
        return undefined;
      });
    } catch (error) {
      console.error("World map generation failed:", error);
      return undefined;
    }
  }

  async generateIllustration(sceneDescription: string, genre: string): Promise<string | undefined> {
    try {
      return await this.withRetry(async () => {
        const ai = this.getClient();
        const model = "gemini-2.5-flash-image";
        
        const prompt = `
          Create a stunning, high-contrast cinematic illustration for a ${genre} story.
          Scene Description: ${sceneDescription}
          
          STYLE: Cinematic, highly detailed, dramatic lighting, 8k resolution. 
          Use rich, deep colors and strong contrast. Make it look like a movie still or concept art.
          No text on the image.
        `;

        const response = await ai.models.generateContent({
          model: model,
          contents: {
            parts: [{ text: prompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          }
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
             if (part.inlineData && part.inlineData.mimeType.startsWith('image')) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
             }
          }
        }
        return undefined;
      });
    } catch (error) {
       console.error("Illustration failed:", error);
       return undefined;
    }
  }

  async generateChapterContent(bookTitle: string, chapter: Chapter, style: string = "Cinematic", perspective: string = "Third Person Limited", previousChapterSummary?: string): Promise<string> {
    try {
      return await this.withRetry(async () => {
        const ai = this.getClient();
        const model = "gemini-2.5-flash"; 
        
        const prompt = `
          You are writing the book "${bookTitle}".
          Write the full content for the chapter: "${chapter.title}".
          
          Chapter Summary: ${chapter.summary}
          ${previousChapterSummary ? `Previous context: ${previousChapterSummary}` : ''}
          
          STRICT CONSTRAINTS:
          - Writing Style: ${style}
          - Narrative Perspective: ${perspective}
          
          INSTRUCTIONS:
          - Write approx 800-1200 words.
          - Use immersive, sensory details.
          - Maintain pacing appropriate for the style (${style}).
          - Focus on "Show, don't tell".
          - Format with Markdown (bold, italics).
          - Do NOT include the chapter title at the start. Start directly with the story.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        const text = response.text;
        
        if (text && text.trim().length > 300) {
            return text;
        } else {
            throw new Error("Content generated was too short or empty.");
        }
      });
    } catch (error) {
       console.error("Chapter generation failed:", error);
       throw error;
    }
  }

  async rewriteText(selectedText: string, instruction: string, bookContext: string): Promise<string> {
    try {
      return await this.withRetry(async () => {
        const ai = this.getClient();
        const model = "gemini-2.5-flash";
        const prompt = `
          You are an expert editor. 
          Rewrite the following text selection according to this instruction: "${instruction}".
          
          Context of the book: ${bookContext}
          
          Original Text: "${selectedText}"
          
          Return ONLY the rewritten text. Do not add quotes or conversational filler.
        `;

        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
        });

        return response.text || selectedText;
      });
    } catch (error) {
      console.error("Rewrite failed:", error);
      throw error;
    }
  }

  async askBook(question: string, currentChapterContent: string, bookSummary: string): Promise<string> {
    try {
      return await this.withRetry(async () => {
        const ai = this.getClient();
        const model = "gemini-2.5-flash";
        const prompt = `
          You are the spirit of this book. Answer the reader's question based ONLY on the provided context.
          If the answer isn't in the text, answer in the persona of the book's narrator speculating plausibly.
          
          Book Context: ${bookSummary}
          Current Chapter Text: ${currentChapterContent.substring(0, 5000)}... (truncated)
          
          Reader Question: ${question}
        `;

        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
        });

        return response.text || "I am lost for words...";
      });
    } catch (error) {
      return "I couldn't connect to the spirit world (API Error).";
    }
  }
}

export const geminiService = new GeminiService();
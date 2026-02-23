import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Cosine Similarity Function
  function cosineSimilarity(a: number[], b: number[]) {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    if (normA === 0 || normB === 0) return 0;
    return dot / (normA * normB);
  }

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    try {
      const { original, translations } = req.body;

      // Validation
      if (!original || !translations || !Array.isArray(translations)) {
        return res.status(400).json({ status: "error", message: "Invalid input structure." });
      }

      if (translations.length < 3) {
        return res.status(400).json({ status: "error", message: "Minimum 3 translations required." });
      }

      if ([original, ...translations].some(t => !t || typeof t !== 'string' || t.trim() === '')) {
        return res.status(400).json({ status: "error", message: "Empty strings or null values are not allowed." });
      }

      // 1. Generate Embeddings
      // We need to embed the original and all translations
      const textsToEmbed = [original, ...translations];
      const embeddingPromises = textsToEmbed.map(text => 
        ai.models.embedContent({
          model: "text-embedding-004",
          contents: [{ parts: [{ text }] }]
        })
      );

      const embeddingResults = await Promise.all(embeddingPromises);
      const vectors = embeddingResults.map(res => res.embeddings[0].values);

      const originalVector = vectors[0];
      const translationVectors = vectors.slice(1);

      // 2. Compute Similarities
      const similarities = translationVectors.map(v => cosineSimilarity(originalVector, v));

      // 3. Compute Stats
      const mean = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      const variance = similarities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / similarities.length;
      const stdDev = Math.sqrt(variance);
      const stabilityIndex = mean - (0.5 * stdDev);

      // 4. Classification
      let classification = "Unstable Meaning";
      if (stabilityIndex > 0.80) classification = "Highly Stable";
      else if (stabilityIndex >= 0.60) classification = "Moderately Stable";

      // 5. Outlier Detection
      let minSim = similarities[0];
      let outlierIndex = 0;
      similarities.forEach((sim, idx) => {
        if (sim < minSim) {
          minSim = sim;
          outlierIndex = idx;
        }
      });

      // 6. Explanation (Deterministic as per requirements)
      const explanation = `Translation ${outlierIndex + 1} shows lowest similarity (${minSim.toFixed(4)}), increasing variance (${variance.toFixed(4)}) and reducing overall semantic stability.`;

      const result = {
        status: "success",
        similarity_scores: similarities.map(s => Number(s.toFixed(4))),
        mean_similarity: Number(mean.toFixed(4)),
        variance: Number(variance.toFixed(4)),
        stability_index: Number(stabilityIndex.toFixed(4)),
        classification,
        semantic_outlier_index: outlierIndex,
        explanation
      };

      res.json(result);
    } catch (error: any) {
      console.error("Analysis Error:", error);
      res.status(500).json({ status: "error", message: error.message || "Internal server error during analysis." });
    }
  });

  app.post("/api/translate", async (req, res) => {
    try {
      const { text, languages } = req.body;
      if (!text || !languages || !Array.isArray(languages) || languages.length === 0) {
        return res.status(400).json({ status: "error", message: "Text and at least one target language are required." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: [{ parts: [{ text: `Translate the following text into these languages: ${languages.join(", ")}. 
        Return the translations as a JSON array of strings in the same order as the languages provided.
        Text: "${text}"` }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const translations = JSON.parse(response.text || "[]");
      res.json({ status: "success", translations });
    } catch (error: any) {
      console.error("Translation Error:", error);
      res.status(500).json({ status: "error", message: error.message || "Internal server error during translation." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

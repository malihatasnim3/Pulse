import { GoogleGenerativeAI } from "@google/generative-ai";

type AnalyticsData = {
  totalAds: number;
  totalProducts: number;
  topPlatform: string;
  topTone: string;
  trendingColors: string[];
};

export async function generateAnalyticsInsights(data: AnalyticsData): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "Insights unavailable: API key not configured.";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an analytics expert. Based on the following ad generation data, write a single concise paragraph (2-3 sentences) with friendly insights. DO NOT make claims about ad performance or business outcomes. Focus on patterns and preferences.

Data:
- Total ads generated: ${data.totalAds}
- Total products added: ${data.totalProducts}
- Most used platform: ${data.topPlatform}
- Most used tone: ${data.topTone}
- Trending colors: ${data.trendingColors.join(", ")}

Write a friendly, concise insight paragraph:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.trim();
  } catch (err) {
    console.error("Failed to generate insights:", err);
    return "Unable to generate insights at this time. Keep creating ads to see patterns emerge!";
  }
}

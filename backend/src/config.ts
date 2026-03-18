import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  hn: {
    firebaseBaseUrl: "https://hacker-news.firebaseio.com/v0",
    algoliaBaseUrl: "https://hn.algolia.com/api/v1",
    cacheTtlMs: 3 * 60 * 1000, // 3 minutes
    defaultPageSize: 30,
  },
};

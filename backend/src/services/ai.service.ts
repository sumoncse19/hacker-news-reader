import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { prisma } from "../lib/prisma";
import { config } from "../config";
import { stripHtml } from "../utils/html";
import { logger } from "../utils/logger";
import { AiServiceError } from "../utils/errors";
import type { Comment } from "../types";

// Initialize both providers
const gemini = new GoogleGenAI({ apiKey: config.geminiApiKey });
const groq = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;

interface SummaryResult {
  keyPoints: string[];
  sentiment: "positive" | "negative" | "mixed" | "neutral";
  summary: string;
}

/**
 * Flatten comment tree into a readable string for the LLM prompt.
 * Limits total text to ~4000 chars to stay within token budget.
 */
function formatCommentsForPrompt(
  comments: Comment[],
  depth = 0,
  maxChars = 4000,
): string {
  let result = "";
  const indent = "  ".repeat(depth);

  for (const comment of comments) {
    if (result.length > maxChars) break;

    const text = stripHtml(comment.text).substring(0, 500);
    result += `${indent}[${comment.author}]: ${text}\n`;

    if (comment.children.length > 0) {
      result += formatCommentsForPrompt(
        comment.children,
        depth + 1,
        maxChars - result.length,
      );
    }
  }

  return result;
}

const SYSTEM_PROMPT = `You are analyzing a Hacker News discussion thread. Return a JSON object with exactly this shape:
{
  "keyPoints": ["point 1", "point 2", ...],
  "sentiment": "positive" | "negative" | "mixed" | "neutral",
  "summary": "2-4 sentence summary"
}

Rules:
- keyPoints: 3-7 concise sentences about what was discussed
- sentiment: exactly one of "positive", "negative", "mixed", "neutral"
- summary: 2-4 sentences summarizing the discussion
- Return ONLY valid JSON, no markdown, no code fences`;

/**
 * Call Gemini API
 */
async function callGemini(prompt: string): Promise<string> {
  const response = await gemini.models.generateContent({
    model: config.geminiModel,
    contents: prompt,
  });
  return response.text || "";
}

/**
 * Call Groq API (fallback)
 */
async function callGroq(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  if (!groq) throw new Error("Groq API key not configured");

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content || "";
}

/**
 * Parse and validate the AI response
 */
function parseResponse(responseText: string): SummaryResult {
  // Strip markdown code fences if present
  const cleaned = responseText
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  const parsed: SummaryResult = JSON.parse(cleaned);

  if (
    !Array.isArray(parsed.keyPoints) ||
    !parsed.sentiment ||
    !parsed.summary
  ) {
    throw new Error("Invalid response shape from AI");
  }

  const validSentiments = ["positive", "negative", "mixed", "neutral"];
  if (!validSentiments.includes(parsed.sentiment)) {
    parsed.sentiment = "neutral";
  }

  return parsed;
}

/**
 * Generate AI summary for a story's discussion.
 * Uses Gemini as primary, falls back to Groq on failure.
 * Returns cached result if available, unless force=true.
 */
export async function generateSummary(
  storyId: number,
  storyTitle: string,
  comments: Comment[],
  commentCount: number,
  force: boolean = false,
) {
  // Check cache first
  if (!force) {
    const cached = await prisma.aiSummary.findUnique({
      where: { hnStoryId: storyId },
    });

    if (cached) {
      return {
        keyPoints: cached.keyPoints,
        sentiment: cached.sentiment,
        summary: cached.summary,
        commentCount: cached.commentCount,
        cached: true,
      };
    }
  }

  // No comments to summarize
  if (comments.length === 0) {
    return {
      keyPoints: [],
      sentiment: "neutral" as const,
      summary: "No comments to summarize.",
      commentCount: 0,
      cached: false,
    };
  }

  const formattedComments = formatCommentsForPrompt(comments);

  const userPrompt = `Story: "${storyTitle}"

Comments:
---
${formattedComments}
---`;

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

  let parsed: SummaryResult;
  let provider = "gemini";

  try {
    // Try Gemini first
    logger.info(`Attempting Gemini for story ${storyId}`);
    const responseText = await callGemini(fullPrompt);
    parsed = parseResponse(responseText);
    provider = "gemini";
    logger.info(`Gemini succeeded for story ${storyId}`);
  } catch (geminiErr) {
    logger.warn(
      `Gemini failed for story ${storyId}, falling back to Groq`,
      geminiErr,
    );

    // Fallback to Groq
    try {
      if (!groq) {
        throw new AiServiceError(
          "Gemini rate limited and Groq not configured. Set GROQ_API_KEY in .env for fallback.",
        );
      }
      const responseText = await callGroq(SYSTEM_PROMPT, userPrompt);
      parsed = parseResponse(responseText);
      provider = "groq";
      logger.info(`Groq fallback succeeded for story ${storyId}`);
    } catch (groqErr) {
      logger.error("Both Gemini and Groq failed", groqErr);
      throw new AiServiceError(
        groqErr instanceof Error ? groqErr.message : "All AI providers failed",
      );
    }
  }

  // Cache in database
  try {
    await prisma.aiSummary.upsert({
      where: { hnStoryId: storyId },
      update: {
        keyPoints: parsed.keyPoints,
        sentiment: parsed.sentiment,
        summary: parsed.summary,
        commentCount,
        createdAt: new Date(),
      },
      create: {
        hnStoryId: storyId,
        keyPoints: parsed.keyPoints,
        sentiment: parsed.sentiment,
        summary: parsed.summary,
        commentCount,
      },
    });
  } catch (cacheErr) {
    logger.warn("Failed to cache AI summary", cacheErr);
  }

  return {
    keyPoints: parsed.keyPoints,
    sentiment: parsed.sentiment,
    summary: parsed.summary,
    commentCount,
    cached: false,
    provider,
  };
}

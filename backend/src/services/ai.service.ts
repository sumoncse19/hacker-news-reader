import { GoogleGenAI } from "@google/genai";
import { prisma } from "../lib/prisma";
import { config } from "../config";
import { stripHtml } from "../utils/html";
import { logger } from "../utils/logger";
import { AiServiceError } from "../utils/errors";
import type { Comment } from "../types";

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

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

/**
 * Generate AI summary for a story's discussion.
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

  // Format comments for prompt
  const formattedComments = formatCommentsForPrompt(comments);

  const prompt = `You are analyzing a Hacker News discussion thread for the story titled: "${storyTitle}"

Given the following comments, provide:

1. Key Points: A list of 3-7 key points discussed. Each should be a concise sentence.
2. Sentiment: The overall sentiment. Must be exactly one of: "positive", "negative", "mixed", "neutral".
3. Summary: A 2-4 sentence summary of the discussion.

Return ONLY valid JSON with this exact shape, no markdown, no code fences:
{
  "keyPoints": ["point 1", "point 2"],
  "sentiment": "mixed",
  "summary": "The discussion..."
}

Comments:
---
${formattedComments}
---`;

  try {
    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: prompt,
    });

    let responseText = response.text || "";

    // Strip markdown code fences if present
    responseText = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed: SummaryResult = JSON.parse(responseText);

    // Validate response shape
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

    // Cache in database (upsert to handle force=true)
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

    return {
      keyPoints: parsed.keyPoints,
      sentiment: parsed.sentiment,
      summary: parsed.summary,
      commentCount,
      cached: false,
    };
  } catch (err) {
    logger.error("AI summary generation failed", err);

    if (err instanceof SyntaxError) {
      throw new AiServiceError("AI returned invalid JSON response");
    }

    throw new AiServiceError(
      err instanceof Error ? err.message : "Failed to generate summary",
    );
  }
}

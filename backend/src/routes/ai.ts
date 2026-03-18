import { Router, Request, Response, NextFunction } from "express";
import { fetchStoryById, fetchCommentsAlgolia } from "../services/hn.service";
import { generateSummary } from "../services/ai.service";
import { ValidationError } from "../utils/errors";

export const aiRouter = Router();

// POST /api/stories/:id/summarize
aiRouter.post(
  "/stories/:id/summarize",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storyId = parseInt(req.params.id as string, 10);
      if (isNaN(storyId)) {
        throw new ValidationError("Invalid story ID");
      }

      const force = req.query.force === "true";

      // Fetch story and comments in parallel
      const [story, comments] = await Promise.all([
        fetchStoryById(storyId),
        fetchCommentsAlgolia(storyId),
      ]);

      const result = await generateSummary(
        storyId,
        story.title,
        comments,
        story.commentCount,
        force,
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

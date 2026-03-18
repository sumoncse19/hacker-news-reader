import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import {
  fetchStoriesPaginated,
  fetchStoryById,
  fetchCommentsAlgolia,
} from "../services/hn.service";
import { ValidationError } from "../utils/errors";
import { config } from "../config";

export const storiesRouter = Router();

const storiesQuerySchema = z.object({
  type: z.enum(["top", "new", "best"]).default("top"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(config.hn.defaultPageSize),
});

// GET /api/stories
storiesRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = storiesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationError("Invalid query parameters");
      }

      const { type, page, limit } = parsed.data;
      const result = await fetchStoriesPaginated(type, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/stories/:id
storiesRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        throw new ValidationError("Invalid story ID");
      }

      const story = await fetchStoryById(id);
      res.json(story);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/stories/:id/comments
storiesRouter.get(
  "/:id/comments",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        throw new ValidationError("Invalid story ID");
      }

      const comments = await fetchCommentsAlgolia(id);
      res.json({ comments });
    } catch (err) {
      next(err);
    }
  },
);

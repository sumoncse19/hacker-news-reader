import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import {
  createBookmark,
  deleteBookmark,
  getBookmarks,
  checkBookmarks,
} from "../services/bookmark.service";
import { ValidationError } from "../utils/errors";

export const bookmarksRouter = Router();

const bookmarkSchema = z.object({
  hnStoryId: z.number().int().positive(),
  title: z.string().min(1).max(500),
  url: z.string().nullable().optional(),
  author: z.string().min(1),
  points: z.number().int().min(0),
  commentCount: z.number().int().min(0),
  hnCreatedAt: z.string(),
});

const listQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

// GET /api/bookmarks
bookmarksRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = listQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationError("Invalid query parameters");
      }
      const { search, page, limit } = parsed.data;
      const result = await getBookmarks(search, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/bookmarks/check?ids=1,2,3
bookmarksRouter.get(
  "/check",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idsParam = req.query.ids as string;
      if (!idsParam) {
        res.json({ bookmarkedIds: [] });
        return;
      }
      const ids = idsParam
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n));
      const bookmarkedIds = await checkBookmarks(ids);
      res.json({ bookmarkedIds });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/bookmarks
bookmarksRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = bookmarkSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Invalid bookmark data");
      }
      const bookmark = await createBookmark(parsed.data);
      res.status(201).json(bookmark);
    } catch (err: any) {
      // Handle duplicate bookmark
      if (err?.code === "P2002") {
        res.status(409).json({
          error: {
            code: "DUPLICATE",
            message: "Story already bookmarked",
            status: 409,
          },
        });
        return;
      }
      next(err);
    }
  },
);

// DELETE /api/bookmarks/:hnStoryId
bookmarksRouter.delete(
  "/:hnStoryId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hnStoryId = parseInt(req.params.hnStoryId as string, 10);
      if (isNaN(hnStoryId)) {
        throw new ValidationError("Invalid story ID");
      }
      await deleteBookmark(hnStoryId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

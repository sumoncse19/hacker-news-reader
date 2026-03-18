import { prisma } from "../lib/prisma";
import { NotFoundError } from "../utils/errors";

interface CreateBookmarkInput {
  hnStoryId: number;
  title: string;
  url?: string | null;
  author: string;
  points: number;
  commentCount: number;
  hnCreatedAt: string;
}

export async function createBookmark(input: CreateBookmarkInput) {
  return prisma.bookmark.create({
    data: {
      hnStoryId: input.hnStoryId,
      title: input.title,
      url: input.url,
      author: input.author,
      points: input.points,
      commentCount: input.commentCount,
      hnCreatedAt: new Date(input.hnCreatedAt),
    },
  });
}

export async function deleteBookmark(hnStoryId: number) {
  const existing = await prisma.bookmark.findUnique({ where: { hnStoryId } });
  if (!existing) {
    throw new NotFoundError(`Bookmark for story ${hnStoryId} not found`);
  }
  return prisma.bookmark.delete({ where: { hnStoryId } });
}

export async function getBookmarks(
  search?: string,
  page: number = 1,
  limit: number = 30,
) {
  const where = search
    ? { title: { contains: search, mode: "insensitive" as const } }
    : {};

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bookmark.count({ where }),
  ]);

  return {
    bookmarks,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  };
}

export async function checkBookmarks(hnStoryIds: number[]) {
  const bookmarks = await prisma.bookmark.findMany({
    where: { hnStoryId: { in: hnStoryIds } },
    select: { hnStoryId: true },
  });
  return bookmarks.map((b: { hnStoryId: number }) => b.hnStoryId);
}

import { prisma } from "./db";

export type CatalogueKind = "catalogue" | "brochure";

export type CatalogueItemDto = {
  id: string;
  title: string;
  kind: CatalogueKind;
  description: string | null;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export function normalizeKind(raw: unknown): CatalogueKind {
  return String(raw || "").toLowerCase() === "brochure" ? "brochure" : "catalogue";
}

export function kindLabel(kind: CatalogueKind): string {
  return kind === "brochure" ? "Brochure" : "Catalogue";
}

function toDto(row: {
  id: string;
  title: string;
  kind: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CatalogueItemDto {
  return {
    id: row.id,
    title: row.title,
    kind: normalizeKind(row.kind),
    description: row.description,
    fileUrl: row.fileUrl,
    fileName: row.fileName,
    mimeType: row.mimeType,
    published: row.published,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listCatalogueItems(opts?: { publishedOnly?: boolean }) {
  const rows = await prisma.catalogueItem.findMany({
    where: opts?.publishedOnly ? { published: true } : undefined,
    orderBy: [{ kind: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(toDto);
}

export async function getCatalogueItem(id: string) {
  const row = await prisma.catalogueItem.findUnique({ where: { id } });
  return row ? toDto(row) : null;
}

export async function createCatalogueItem(input: {
  title: string;
  kind?: unknown;
  description?: string | null;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  published?: boolean;
}) {
  const title = String(input.title || "").trim();
  if (!title) throw new Error("Title is required");
  const row = await prisma.catalogueItem.create({
    data: {
      title,
      kind: normalizeKind(input.kind),
      description: input.description?.trim() || null,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      mimeType: input.mimeType,
      published: input.published !== false,
    },
  });
  return toDto(row);
}

export async function updateCatalogueItem(
  id: string,
  patch: {
    title?: string;
    kind?: unknown;
    description?: string | null;
    published?: boolean;
    fileUrl?: string;
    fileName?: string;
    mimeType?: string;
  },
) {
  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) {
    const title = String(patch.title).trim();
    if (!title) throw new Error("Title is required");
    data.title = title;
  }
  if (patch.kind !== undefined) data.kind = normalizeKind(patch.kind);
  if (patch.description !== undefined) {
    data.description = patch.description?.trim() || null;
  }
  if (patch.published !== undefined) data.published = Boolean(patch.published);
  if (patch.fileUrl !== undefined) data.fileUrl = patch.fileUrl;
  if (patch.fileName !== undefined) data.fileName = patch.fileName;
  if (patch.mimeType !== undefined) data.mimeType = patch.mimeType;

  const row = await prisma.catalogueItem.update({ where: { id }, data });
  return toDto(row);
}

export async function deleteCatalogueItem(id: string) {
  await prisma.catalogueItem.delete({ where: { id } });
}

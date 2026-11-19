import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import type { Access, CollectionConfig, GlobalConfig } from "payload";
import { validArticleAST } from "@/lib/article-ast";

export const contentAccess: Access = ({ req }) =>
  ["admin", "editor"].includes(req.user?.role || "");
const breakpoints = [
  { name: "desktop", label: "Desktop", width: 1440, height: 900 },
  { name: "mobile", label: "Mobile", width: 390, height: 844 },
];
const bodyField = (name: string, label: string) => ({
  name,
  label,
  type: "json" as const,
  validate: (v: unknown) =>
    v == null ||
    validArticleAST(v) ||
    "Unsupported article structure or unsafe link.",
  admin: { components: { Field: "/rich-editor#ArticleEditor" } },
});
const refresh = (req: { context: Record<string, unknown> }) => {
  if (!req.context.seedContent) revalidateTag("clinic-content", { expire: 0 });
};

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: { singular: "Blog article", plural: "Blog articles" },
  admin: {
    useAsTitle: "title",
    group: "Website",
    defaultColumns: ["title", "authorLabel", "_status", "publishedAt"],
    preview: (data) =>
      `/workspace-preview?kind=post&slug=${encodeURIComponent(String(data.slug || ""))}`,
    livePreview: {
      breakpoints,
      url: ({ data }) =>
        `/workspace-preview?kind=post&slug=${encodeURIComponent(String(data.slug || ""))}`,
    },
  },
  access: {
    create: contentAccess,
    read: contentAccess,
    update: contentAccess,
    delete: ({ req }) => req.user?.role === "admin",
    readVersions: contentAccess,
  },
  versions: {
    drafts: {
      autosave: { interval: 1500, showSaveDraftButton: true },
      validate: true,
    },
    maxPerDoc: 20,
  },
  hooks: {
    afterChange: [
      ({ req, doc }) => {
        refresh(req);
        return doc;
      },
    ],
    afterDelete: [
      ({ req, doc }) => {
        refresh(req);
        return doc;
      },
    ],
  },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      validate: (v: unknown) =>
        (typeof v === "string" && /^blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) ||
        "Use blog/article-title with lowercase letters, numbers and hyphens.",
      admin: {
        description: "Keep existing URLs to preserve links and search history.",
      },
    },
    { name: "excerpt", type: "textarea" },
    bodyField("body", "Article content"),
    { name: "authorLabel", type: "text", label: "Author / contributor" },
    bodyField("authorContent", "Author details and source attribution"),
    {
      name: "authorURL",
      type: "text",
      validate: (v: unknown) =>
        !v ||
        (typeof v === "string" && /^https?:\/\//.test(v)) ||
        "Use a complete http(s) URL.",
    },
    { name: "publishedAt", type: "date" },
    {
      name: "source",
      type: "text",
      admin: { description: "Original source retained during migration." },
    },
    { name: "seoTitle", type: "text" },
    { name: "seoDescription", type: "textarea", maxLength: 320 },
  ],
};

export const Media: CollectionConfig = {
  hooks: {
    beforeOperation: [
      ({ req }) => {
        if (req.file && !process.env.BLOB_READ_WRITE_TOKEN)
          req.file.name =
            randomUUID().slice(0, 8) + "-" + path.basename(req.file.name);
      },
    ],
    afterChange: [
      ({ req, doc }) => {
        refresh(req);
        return doc;
      },
    ],
  },
  slug: "media",
  admin: { group: "Website", useAsTitle: "alt" },
  access: {
    read: () => true,
    create: contentAccess,
    update: contentAccess,
    delete: () => false,
  },
  upload: {
    staticDir: path.resolve(process.cwd(), ".data/media"),
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  },
  fields: [
    { name: "alt", type: "text", required: true },
    { name: "credit", type: "text" },
  ],
};

export const HomePage: GlobalConfig = {
  slug: "home-page",
  label: "Dev Mode · Homepage",
  admin: {
    group: "Website",
    description:
      "Edit sections, save a draft, preview on desktop/mobile, then publish. Media uploads are public website assets only.",
    preview: () => "/workspace-preview?kind=home",
    livePreview: {
      breakpoints,
      openByDefault: true,
      url: "/workspace-preview?kind=home",
    },
  },
  access: {
    read: contentAccess,
    update: contentAccess,
    readVersions: contentAccess,
  },
  versions: {
    drafts: {
      autosave: { interval: 1500, showSaveDraftButton: true },
      validate: true,
    },
    max: 20,
  },
  hooks: {
    afterChange: [
      ({ req, doc }) => {
        refresh(req);
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "hero",
      type: "group",
      fields: [
        { name: "line1", type: "text", required: true },
        { name: "line2", type: "text", required: true },
        { name: "accent", type: "text", required: true },
        { name: "description1", type: "text", required: true },
        { name: "description2", type: "text", required: true },
        { name: "image", type: "upload", relationTo: "media" },
      ],
    },
    {
      name: "about",
      type: "group",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "line1", type: "text", required: true },
        { name: "line2", type: "text", required: true },
        { name: "line3", type: "text", required: true },
        { name: "accent", type: "text", required: true },
        { name: "description", type: "textarea", required: true },
        { name: "image", type: "upload", relationTo: "media" },
      ],
    },
    {
      name: "treatments",
      type: "group",
      fields: [
        { name: "line1", type: "text", required: true },
        { name: "line2", type: "text", required: true },
        { name: "accent", type: "text", required: true },
        { name: "description", type: "textarea", required: true },
      ],
    },
    {
      name: "cta",
      label: "Final banner",
      type: "group",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "line1", type: "text", required: true },
        { name: "accent", type: "text", required: true },
        { name: "description1", type: "text", required: true },
        { name: "description2", type: "text", required: true },
        { name: "image", type: "upload", relationTo: "media" },
      ],
    },
  ],
};

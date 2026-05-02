import { defineCollection, z } from "astro:content";

const rules = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    section: z.string().optional(),
    order: z.number().optional(),
    status: z.enum(["draft", "review", "published"]).default("draft"),
    updated: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const contracts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    attribution: z.string().optional(),
    contractType: z.string().optional(),
    status: z.enum(["draft", "review", "published"]).default("draft"),
    updated: z.string().optional(),
    sourceUrl: z.string().url().optional(),
  }),
});

export const collections = {
  rules,
  contracts,
};

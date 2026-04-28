import { defineCollection, z } from "astro:content";

const rules = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    section: z.string().optional(),
    status: z.enum(["draft", "review", "published"]).default("draft"),
    updated: z.string().optional()
  })
});

const contracts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    contractType: z.string().optional(),
    status: z.enum(["draft", "review", "published"]).default("draft"),
    updated: z.string().optional()
  })
});

export const collections = {
  rules,
  contracts
};

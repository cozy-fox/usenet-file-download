import { z } from 'zod'

// Search Schemas
export const SearchRequestSchema = z.object({
  query: z.string().min(1),
  category: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
})

export const SearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  size: z.number(),
  category: z.string().optional(),
  group: z.string().optional(),
  posted: z.string(),
  nzbId: z.string(),
  indexer: z.string(),
})
export type SearchRequest = z.infer<typeof SearchRequestSchema>
export type SearchResult = z.infer<typeof SearchResultSchema>
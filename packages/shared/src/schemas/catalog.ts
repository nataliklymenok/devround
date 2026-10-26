import { z } from 'zod'

export const CatalogTechnologySchema = z.object({
  id: z.string(),
  name: z.string(),
  isAvailable: z.boolean(),
})

export const CatalogTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  isAvailable: z.boolean(),
  technologies: z.array(CatalogTechnologySchema),
})

export const CatalogLevelSchema = z.object({
  id: z.string(),
  name: z.string(),
  rank: z.number().int(),
})

export const CatalogResponseSchema = z.object({
  tracks: z.array(CatalogTrackSchema),
  levels: z.array(CatalogLevelSchema),
})
export type CatalogResponse = z.infer<typeof CatalogResponseSchema>
export type CatalogTrack = z.infer<typeof CatalogTrackSchema>

import type { CatalogResponse } from '@devround/shared'
import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../app.js'

export function catalogRoutes(deps: AppDeps) {
  return async (api: FastifyInstance) => {
    api.get('/catalog', { preHandler: api.requireAuth }, async (): Promise<CatalogResponse> => {
      const [tracks, levels] = await Promise.all([
        deps.db.track.findMany({
          orderBy: { position: 'asc' },
          include: { technologies: { orderBy: { position: 'asc' } } },
        }),
        deps.db.level.findMany({ orderBy: { rank: 'asc' } }),
      ])
      return {
        tracks: tracks.map((t) => ({
          id: t.id,
          name: t.name,
          isAvailable: t.isAvailable,
          technologies: t.technologies.map(({ id, name, isAvailable, recommends }) => ({
            id,
            name,
            isAvailable,
            recommends,
          })),
        })),
        levels: levels.map(({ id, name, rank }) => ({ id, name, rank })),
      }
    })
  }
}

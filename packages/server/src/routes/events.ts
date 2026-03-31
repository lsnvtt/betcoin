import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const listEventsSchema = z.object({
  sport: z.string().optional(),
  league: z.string().optional(),
  status: z.enum(['UPCOMING', 'LIVE', 'FINISHED', 'SETTLED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const eventIdSchema = z.object({
  eventId: z.string().min(1),
});

export async function eventsRoutes(app: FastifyInstance) {
  /**
   * GET /api/events - List sport events with pagination.
   */
  app.get('/api/events', async (request, reply) => {
    const parsed = listEventsSchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parsed.error.issues,
      });
    }

    const { sport, league, status, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (sport) where.sport = sport;
    if (league) where.league = league;
    if (status) where.status = status;

    try {
      const [events, total] = await Promise.all([
        prisma.sportEvent.findMany({
          where,
          orderBy: { startTime: 'asc' },
          skip,
          take: limit,
          include: {
            oddsHistory: {
              orderBy: { capturedAt: 'desc' },
              take: 1,
            },
          },
        }),
        prisma.sportEvent.count({ where }),
      ]);

      return reply.status(200).send({
        events: events.map((e) => ({
          id: e.id,
          eventHash: e.eventHash,
          sport: e.sport,
          league: e.league,
          homeTeam: e.homeTeam,
          awayTeam: e.awayTeam,
          startTime: e.startTime,
          status: e.status,
          latestOdds: e.oddsHistory[0]
            ? {
                homeOdds: e.oddsHistory[0].homeOdds.toString(),
                drawOdds: e.oddsHistory[0].drawOdds?.toString() ?? null,
                awayOdds: e.oddsHistory[0].awayOdds.toString(),
              }
            : null,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      request.log.error(err, 'List events failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET /api/events/:eventId - Get event details.
   */
  app.get('/api/events/:eventId', async (request, reply) => {
    const params = eventIdSchema.safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: params.error.issues,
      });
    }

    try {
      const event = await prisma.sportEvent.findUnique({
        where: { id: params.data.eventId },
        include: {
          oddsHistory: {
            orderBy: { capturedAt: 'desc' },
            take: 10,
          },
          poolOdds: {
            include: {
              pool: {
                select: {
                  id: true,
                  contractAddress: true,
                  name: true,
                  active: true,
                },
              },
            },
          },
        },
      });

      if (!event) {
        return reply.status(404).send({ error: 'Event not found' });
      }

      return reply.status(200).send({
        id: event.id,
        eventHash: event.eventHash,
        sport: event.sport,
        league: event.league,
        homeTeam: event.homeTeam,
        awayTeam: event.awayTeam,
        startTime: event.startTime,
        status: event.status,
        result: event.result,
        settledAt: event.settledAt,
        oddsHistory: event.oddsHistory.map((o) => ({
          homeOdds: o.homeOdds.toString(),
          drawOdds: o.drawOdds?.toString() ?? null,
          awayOdds: o.awayOdds.toString(),
          source: o.source,
          capturedAt: o.capturedAt,
        })),
        pools: event.poolOdds.map((po) => ({
          pool: po.pool,
          homeOdds: po.homeOdds.toString(),
          drawOdds: po.drawOdds?.toString() ?? null,
          awayOdds: po.awayOdds.toString(),
        })),
      });
    } catch (err) {
      request.log.error(err, 'Get event failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}

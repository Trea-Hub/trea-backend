import request from 'supertest';
import { app } from '../index';
import { pool } from '../db/client';

jest.mock('../db/client', () => ({
  pool: {
    query: jest.fn(),
    on: jest.fn(),
  },
}));

describe('GET /events', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return events without any filters', async () => {
    const mockEvents = [{ id: '1', title: 'Event 1' }];
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: mockEvents });

    const res = await request(app).get('/events');
    expect(res.status).toBe(200);
    expect(res.body.events).toEqual(mockEvents);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM events WHERE 1=1', []);
  });

  it('should filter by tag', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    await request(app).get('/events?tag=music');
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM events WHERE 1=1 AND $1 = ANY(tags)',
      ['music']
    );
  });

  it('should filter by location', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    await request(app).get('/events?location=NYC');
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM events WHERE 1=1 AND location = $1',
      ['NYC']
    );
  });

  it('should filter by date range', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const from = '2026-01-01';
    const to = '2026-12-31';
    await request(app).get(`/events?date_from=${from}&date_to=${to}`);
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM events WHERE 1=1 AND date >= $1 AND date <= $2',
      [from, to]
    );
  });

  it('should filter by free-vs-paid', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    await request(app).get('/events?is_free=true');
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM events WHERE 1=1 AND is_free = $1',
      [true]
    );
  });

  it('should perform basic text search on title/description', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    await request(app).get('/events?q=party');
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM events WHERE 1=1 AND (title ILIKE $1 OR description ILIKE $1)',
      ['%party%']
    );
  });

  it('should combine multiple filters', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    await request(app).get('/events?tag=music&is_free=true&q=festival');
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM events WHERE 1=1 AND $1 = ANY(tags) AND is_free = $2 AND (title ILIKE $3 OR description ILIKE $3)',
      ['music', true, '%festival%']
    );
  });
});

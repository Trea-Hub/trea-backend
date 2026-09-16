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

  describe('GET /events/:id/attendees', () => {
    it('should return 401 if x-user-address header is missing', async () => {
      const res = await request(app).get('/events/123/attendees');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Missing x-user-address header/);
    });

    it('should return 404 if event is not found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/events/123/attendees')
        .set('x-user-address', 'G_ORGANIZER');

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Event not found/);
    });

    it('should return 403 if requester is not the organizer', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ organizer: 'G_REAL_ORGANIZER' }] });

      const res = await request(app)
        .get('/events/123/attendees')
        .set('x-user-address', 'G_FAKE_ORGANIZER');

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Only the organizer can view attendees/);
    });

    it('should return attendees if requester is the organizer', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ organizer: 'G_ORGANIZER' }] })
        .mockResolvedValueOnce({ rows: [{ attendee_address: 'G_ATTENDEE', paid_amount: '100', check_in_status: true }] });

      const res = await request(app)
        .get('/events/123/attendees')
        .set('x-user-address', 'G_ORGANIZER');

      expect(res.status).toBe(200);
      expect(res.body.attendees).toEqual([
        { attendee_address: 'G_ATTENDEE', paid_amount: '100', check_in_status: true },
      ]);
    });
  });
});

import { Router } from 'express';
import { pool } from '../db/client';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { tag, location, date_from, date_to, is_free, q } = req.query;
    
    let query = 'SELECT * FROM events WHERE 1=1';
    const params: any[] = [];
    
    if (tag) {
      params.push(tag);
      query += ` AND $${params.length} = ANY(tags)`;
    }
    
    if (location) {
      params.push(location);
      query += ` AND location = $${params.length}`;
    }
    
    if (date_from) {
      params.push(date_from);
      query += ` AND date >= $${params.length}`;
    }
    
    if (date_to) {
      params.push(date_to);
      query += ` AND date <= $${params.length}`;
    }
    
    if (is_free !== undefined) {
      const isFreeBool = is_free === 'true';
      params.push(isFreeBool);
      query += ` AND is_free = $${params.length}`;
    }
    
    if (q) {
      params.push(`%${q}%`);
      query += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }
    
    const result = await pool.query(query, params);
    res.json({ events: result.rows });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/:id/attendees', async (req, res) => {
  try {
    const eventId = req.params.id;
    const organizer = req.header('x-user-address');

    if (!organizer) {
      res.status(401).json({ error: 'Unauthorized: Missing x-user-address header' });
      return;
    }

    const eventResult = await pool.query('SELECT organizer FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const event = eventResult.rows[0];
    if (event.organizer !== organizer) {
      res.status(403).json({ error: 'Forbidden: Only the organizer can view attendees' });
      return;
    }

    const registrationsResult = await pool.query(
      'SELECT attendee_address, paid_amount, check_in_status FROM registrations WHERE event_id = $1',
      [eventId]
    );

    res.json({ attendees: registrationsResult.rows });
  } catch (err) {
    console.error('Error fetching attendees:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

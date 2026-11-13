const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// All event routes require valid JWT authentication
router.use(authenticateToken);

// GET /api/events - Get all events for the logged-in user
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT 
        id, 
        date, 
        event_name AS "eventName", 
        client_name AS "clientName", 
        service_type AS "serviceType", 
        amount, 
        notes 
       FROM bridal_event 
       WHERE user_id = $1 
       ORDER BY id DESC`,
      [req.user.id]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// POST /api/events - Add new event
router.post('/', async (req, res) => {
  try {
    const { date, eventName, clientName, serviceType, amount, notes } = req.body;

    const { rows } = await db.query(
      `INSERT INTO bridal_event (date, event_name, client_name, service_type, amount, notes, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING 
        id, 
        date, 
        event_name AS "eventName", 
        client_name AS "clientName", 
        service_type AS "serviceType", 
        amount, 
        notes`,
      [date || '', eventName || '', clientName || '', serviceType || 'Bridal', amount || 0, notes || '', req.user.id]
    );

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// PUT /api/events/:id - Update existing event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, eventName, clientName, serviceType, amount, notes } = req.body;

    const { rows } = await db.query(
      `UPDATE bridal_event 
       SET date = $1, 
           event_name = $2, 
           client_name = $3, 
           service_type = $4, 
           amount = $5, 
           notes = $6 
       WHERE id = $7 AND user_id = $8
       RETURNING 
        id, 
        date, 
        event_name AS "eventName", 
        client_name AS "clientName", 
        service_type AS "serviceType", 
        amount, 
        notes`,
      [date || '', eventName || '', clientName || '', serviceType || 'Bridal', amount || 0, notes || '', id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found or unauthorized' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// DELETE /api/events/:id - Delete an event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'DELETE FROM bridal_event WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.status(200).send();
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

module.exports = router;

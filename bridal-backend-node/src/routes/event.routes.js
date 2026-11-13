const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// All event routes require valid JWT authentication
router.use(authenticateToken);

// GET /api/events - Get events (Admin can filter by customerId or see all)
router.get('/', async (req, res) => {
  try {
    const { customerId } = req.query;
    const isAdmin = req.user.role === 'admin';

    let queryText = '';
    let queryParams = [];

    if (isAdmin && customerId === 'all') {
      // Admin viewing all customers' events
      queryText = `
        SELECT 
          e.id, 
          e.date, 
          e.event_name AS "eventName", 
          e.client_name AS "clientName", 
          e.service_type AS "serviceType", 
          e.amount, 
          e.notes,
          e.user_id AS "userId",
          u.email AS "userEmail"
        FROM bridal_event e
        LEFT JOIN users u ON u.id = e.user_id
        ORDER BY e.id DESC`;
    } else if (isAdmin && customerId && customerId !== 'all') {
      // Admin viewing specific customer
      queryText = `
        SELECT 
          e.id, 
          e.date, 
          e.event_name AS "eventName", 
          e.client_name AS "clientName", 
          e.service_type AS "serviceType", 
          e.amount, 
          e.notes,
          e.user_id AS "userId"
        FROM bridal_event e
        WHERE e.user_id = $1 
        ORDER BY e.id DESC`;
      queryParams = [customerId];
    } else {
      // Normal user (or admin without filter) viewing own events
      queryText = `
        SELECT 
          id, 
          date, 
          event_name AS "eventName", 
          client_name AS "clientName", 
          service_type AS "serviceType", 
          amount, 
          notes,
          user_id AS "userId"
        FROM bridal_event 
        WHERE user_id = $1 
        ORDER BY id DESC`;
      queryParams = [req.user.id];
    }

    const { rows } = await db.query(queryText, queryParams);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Failed to fetch events: ' + err.message });
  }
});

// POST /api/events - Add new event
router.post('/', async (req, res) => {
  try {
    const { date, eventName, clientName, serviceType, amount, notes, userId } = req.body;
    const isAdmin = req.user.role === 'admin';

    // If admin specifies a target customer, use that userId; otherwise use own id
    const targetUserId = (isAdmin && userId) ? userId : req.user.id;

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
        notes,
        user_id AS "userId"`,
      [date || '', eventName || '', clientName || '', serviceType || 'Bridal', amount || 0, notes || '', targetUserId]
    );

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Failed to create event: ' + err.message });
  }
});

// PUT /api/events/:id - Update existing event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, eventName, clientName, serviceType, amount, notes } = req.body;
    const isAdmin = req.user.role === 'admin';

    // Admin can update any event; regular user can only update their own
    const condition = isAdmin ? 'WHERE id = $7' : 'WHERE id = $7 AND user_id = $8';
    const params = [
      date || '', 
      eventName || '', 
      clientName || '', 
      serviceType || 'Bridal', 
      amount || 0, 
      notes || '', 
      id
    ];
    if (!isAdmin) {
      params.push(req.user.id);
    }

    const { rows } = await db.query(
      `UPDATE bridal_event 
       SET date = $1, 
           event_name = $2, 
           client_name = $3, 
           service_type = $4, 
           amount = $5, 
           notes = $6 
       ${condition}
       RETURNING 
        id, 
        date, 
        event_name AS "eventName", 
        client_name AS "clientName", 
        service_type AS "serviceType", 
        amount, 
        notes,
        user_id AS "userId"`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found or unauthorized' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Failed to update event: ' + err.message });
  }
});

// DELETE /api/events/:id - Delete an event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    const condition = isAdmin ? 'WHERE id = $1' : 'WHERE id = $1 AND user_id = $2';
    const params = isAdmin ? [id] : [id, req.user.id];

    await db.query(`DELETE FROM bridal_event ${condition}`, params);

    res.status(200).send();
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Failed to delete event: ' + err.message });
  }
});

module.exports = router;

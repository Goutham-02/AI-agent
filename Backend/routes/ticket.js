import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createTicket, getTickets, resolveTicket, getGraphData, getTicket } from '../controllers/ticket.js';

const router = express.Router();

router.post('/', authenticate, createTicket);
router.get('/', authenticate, getTickets);
router.get('/graph', authenticate, getGraphData);
router.get('/:id', authenticate, getTicket);
router.post('/:id/resolve', authenticate, resolveTicket);

export default router;
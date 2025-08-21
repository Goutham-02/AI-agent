import express from 'express';
import { authenticate } from "../middleware/auth.js";
import { createTicket, getTickets } from "../controllers/ticket.js";

const router = express.Router();

router.get("/", authenticate, getTickets);
router.get("/:id", authenticate, getTickets);
router.post("/", authenticate, createTicket);

export default router;
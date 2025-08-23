import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket.js";

export const createTicket = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ error: "Title and description are required" });
        }

        const newTicket = await Ticket.create({
            title,
            description,
            createdBy: req.user._id.toString()
        });
        
        try {
            await inngest.send({
                name: "ticket/created",
                data: {
                    ticketId: newTicket._id.toString(),
                    title,
                    description,
                    createdBy: req.user._id.toString()
                }
            });
        } catch (inngestErr) {
            console.error("Failed to send inngest event:", inngestErr);
        }
        
        res.status(201).json({
            message: "Ticket created and processing started",
            ticket: newTicket
        });
    } catch (error) {
        res.status(500).json({ error: "Ticket creation failed", details: error.message });
    }
};

export const getTickets = async (req, res) => {
    try {
        const user = req.user;
        let tickets = [];
        
        if (user.role !== "user") {
            tickets = await Ticket.find({})
                .populate("assignedTo", ["email", "_id"])
                .sort({ createdAt: -1 });
        } else {
            tickets = await Ticket.find({ createdBy: user._id })
                .select("title description status createdAt")
                .sort({ createdAt: -1 });
        }
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve tickets", details: error.message });
    }
};

export const getTicket = async (req, res) => {
    try {
        const user = req.user;
        console.log("[getTicket] Request for ticket:", {
            ticketId: req.params.id,
            userId: user._id,
            userRole: user.role
        });
        
        let ticket;

        if (user.role !== "user") {
            console.log("[getTicket] Admin/moderator access, fetching ticket");
            ticket = await Ticket.findById(req.params.id)
                .populate("assignedTo", ["email", "_id"]);
        } else {
            console.log("[getTicket] User access, fetching own ticket");
            ticket = await Ticket.findOne({ _id: req.params.id, createdBy: user._id })
                .select("title description status createdAt");
        }
        
        if (!ticket) {
            console.log("[getTicket] Ticket not found");
            return res.status(404).json({ error: "Ticket not found" });
        }
        
        console.log("[getTicket] Ticket found, sending response");
        res.status(200).json({ ticket });
    } catch (error) {
        console.error("[getTicket] Error:", error);
        res.status(500).json({ error: "Failed to retrieve ticket", details: error.message });
    }
};
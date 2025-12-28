import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket.js";
import driver from "../utils/graph.js";

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

export const resolveTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution } = req.body;
        const user = req.user;

        if (user.role !== "admin" && user.role !== "moderator") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const ticket = await Ticket.findByIdAndUpdate(
            id,
            { status: "RESOLVED", resolution },
            { new: true }
        );

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        // Trigger Inngest event for learning
        await inngest.send({
            name: "ticket/resolved",
            data: {
                ticketId: ticket._id,
                title: ticket.title,
                description: ticket.description,
                resolution: ticket.resolution,
                relatedSkills: ticket.relatedSkills || []
            }
        });

        res.json({ message: "Ticket resolved", ticket });
    } catch (error) {
        console.error("Error resolving ticket:", error);
        res.status(500).json({ error: "Failed to resolve ticket", details: error.message });
    }
};

export const getGraphData = async (req, res) => {
    try {
        const session = driver.session();
        const result = await session.run(`
            MATCH (n)-[r]->(m)
            RETURN n, r, m
            UNION
            MATCH (n)
            WHERE NOT (n)--()
            RETURN n, null AS r, null AS m
        `);

        const nodes = new Map();
        const links = [];

        result.records.forEach(record => {
            const n = record.get('n');
            const m = record.get('m');
            const r = record.get('r');

            if (!nodes.has(n.identity.toString())) {
                nodes.set(n.identity.toString(), {
                    id: n.identity.toString(),
                    label: n.labels[0],
                    ...n.properties
                });
            }

            if (m) {
                if (!nodes.has(m.identity.toString())) {
                    nodes.set(m.identity.toString(), {
                        id: m.identity.toString(),
                        label: m.labels[0],
                        ...m.properties
                    });
                }
                links.push({
                    source: n.identity.toString(),
                    target: m.identity.toString(),
                    type: r.type
                });
            }
        });

        await session.close();
        res.json({ nodes: Array.from(nodes.values()), links });
    } catch (error) {
        console.error("Graph fetch error:", error);
        res.status(500).json({ error: "Failed to fetch graph data" });
    }
};
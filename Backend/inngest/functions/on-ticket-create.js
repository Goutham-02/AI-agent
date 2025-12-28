import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";
import analyzeTicket from "../../utils/ai.js";
import User from "../../models/user.js";
import mongoose from "mongoose";

export const onTicketCreated = inngest.createFunction(
    { id: "on-ticket-created", retries: 2 },
    { event: "ticket/created" },
    async ({ event, step }) => {
        const { ticketId } = event.data;

        // Validate ObjectId before querying
        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            throw new NonRetriableError("Invalid ticket ID");
        }

        const ticket = await step.run("fetch-ticket", async () => {
            const ticketObj = await Ticket.findById(ticketId);
            if (!ticketObj) throw new NonRetriableError("Ticket not found");
            return ticketObj;
        });

        await step.run("update-ticket-status", async () => {
            await Ticket.findByIdAndUpdate(ticket._id, { status: "TODO" });
        });

        const aiResponse = await step.run("analyze-ticket", async () => {
            return await analyzeTicket(ticket);
        });

        const relatedSkills = await step.run("ai-processing", async () => {
            let skills = [];
            if (aiResponse) {
                const priority = ["low", "medium", "high"].includes(aiResponse.priority)
                    ? aiResponse.priority
                    : "medium";

                await Ticket.findByIdAndUpdate(ticket._id, {
                    priority,
                    helpfulNotes: aiResponse.helpfulNotes,
                    status: "IN_PROGRESS",
                    relatedSkills: aiResponse.relatedSkills
                });

                skills = aiResponse.relatedSkills || [];
            }
            return skills;
        });

        const moderator = await step.run("assign-moderator", async () => {
            let user = null;

            if (relatedSkills.length > 0) {
                user = await User.findOne({
                    role: "moderator",
                    skills: { $regex: relatedSkills.join("|"), $options: "i" }
                });
            }

            if (!user) {
                user = await User.findOne({ role: "admin" });
            }

            await Ticket.findByIdAndUpdate(ticket._id, {
                assignedTo: user?._id || null
            });

            return user;
        });

        await step.run("send-email-notification", async () => {
            if (moderator) {
                const finalTicket = await Ticket.findById(ticket._id);
                await sendMail(
                    moderator.email,
                    "Ticket Assigned",
                    `A new ticket is assigned to you:\n${finalTicket.title}`
                );
            }
        });

        return { success: true };
    }
);


import { inngest } from "../client.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { storeTicketInGraph, initVectorIndex } from "../../utils/graph.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

export const onTicketResolved = inngest.createFunction(
    { id: "on-ticket-resolved" },
    { event: "ticket/resolved" },
    async ({ event, step }) => {
        const { ticketId, title, description, resolution, relatedSkills } = event.data;

        await step.run("init-vector-index", async () => {
            await initVectorIndex();
        });

        const embedding = await step.run("generate-embedding", async () => {
            const textToEmbed = `Title: ${title}\nDescription: ${description}\nResolution: ${resolution}`;
            const result = await model.embedContent(textToEmbed);
            return result.embedding.values;
        });

        await step.run("store-in-graph", async () => {
            await storeTicketInGraph(ticketId, title, resolution, relatedSkills, embedding);
        });

        return { success: true };
    }
);

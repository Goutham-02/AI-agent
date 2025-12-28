import { createAgent, gemini } from "@inngest/agent-kit";

const analyzeTicket = async (ticket) => {
    const supportAgent = createAgent({
        model: gemini({
            model: "gemini-2.0-flash-lite",
            apiKey: process.env.GEMINI_API_KEY,
        }),
        name: "AI Ticket Triage Assistant",
        system: `You are an AI assistant that processes technical support tickets.
        
        Your job is to:
        1. Summerize the issue.
        2. Estimate its priority.
        3. Provide helpful notes and resource links for humen moderators.
        4. List relevant technical skills required.

        IMPORTANT:
        - Respond with *only* valid raw JSON.
        - DO NOT include markdown, code fences, comments, or any extra formatting.
        - The format must be a raw JSON object.

        Repeat: DO NOT wrap your content output in markdown or code fences.
        `
    });

    const response = await supportAgent.run(`You are a ticket triage agent. Only return a strict JSON object with no extra text, headers, or markdown.
        
    Analyze the following support ticket and provide a JSON object with:

    - summary: A short 1-2 sentence summary of the issue.
    - priority: One of "low", "medium", or "high".
    - helpfulNotes: A detailed technical explanation that a moderator can use to solve this issue. Include useful external links or resources if possible.
    - relatedSkills: An array of relevant skills required to solve the issue (e.g., ["React", "MongoDB"]).

    Respond ONLY in this JSON format and do not include any other text or markdown in the answer:

    {
    "summary": "Short summary of the ticket",
    "priority": "high",
    "helpfulNotes": "Here are useful tips...",
    "relatedSkills": ["React", "Node.js"]
    }

    ---

    Ticket information:

    - Title: ${ticket.title}
    - Description: ${ticket.description}`);

    console.log(response.raw);
    try {
        const text = response.raw || response.text || "";
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Failed to parse AI JSON:", response.raw);
        throw error;
    }
};

export default analyzeTicket;
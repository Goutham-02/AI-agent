import neo4j from "neo4j-driver";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

let driver;

try {
    if (uri && user && password) {
        driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
        console.log("✅ Neo4j Driver Created");
    } else {
        console.warn("⚠️ Neo4j credentials missing in .env");
    }
} catch (error) {
    console.error("❌ Failed to create Neo4j driver:", error);
}

export const initVectorIndex = async () => {
    if (!driver) return;
    const session = driver.session();
    try {
        // Create vector index for Ticket description/resolution embeddings
        // Using 768 dimensions for Gemini embeddings
        await session.run(`
            CREATE VECTOR INDEX ticket_embeddings IF NOT EXISTS
            FOR (t:Ticket)
            ON (t.embedding)
            OPTIONS {indexConfig: {
                `+ "`vector.dimensions`" + `: 768,
                `+ "`vector.similarity_function`" + `: 'cosine'
            }}
        `);
        console.log("✅ Neo4j Vector Index Verified/Created");
    } catch (error) {
        console.error("Error creating vector index:", error);
    } finally {
        await session.close();
    }
};

export const storeTicketInGraph = async (ticketId, title, resolution, skills = [], embedding) => {
    if (!driver) return;
    const session = driver.session();
    try {
        await session.run(`
            MERGE (t:Ticket {id: $ticketId})
            SET t.title = $title,
                t.resolution = $resolution,
                t.embedding = $embedding,
                t.createdAt = datetime()
            
            WITH t
            UNWIND $skills AS skillName
            MERGE (s:Skill {name: skillName})
            MERGE (t)-[:REQUIRES]->(s)
        `, {
            ticketId: ticketId.toString(),
            title,
            resolution,
            embedding,
            skills
        });
        console.log(`✅ Stored Ticket ${ticketId} in Graph`);
    } catch (error) {
        console.error("Error storing ticket in graph:", error);
        throw error;
    } finally {
        await session.close();
    }
};

export const findSimilarTickets = async (embedding) => {
    if (!driver) return [];
    const session = driver.session();
    try {
        const result = await session.run(`
            CALL db.index.vector.queryNodes('ticket_embeddings', 3, $embedding)
            YIELD node, score
            RETURN node.resolution AS resolution, node.title AS title, score
        `, { embedding });

        return result.records.map(record => ({
            title: record.get('title'),
            resolution: record.get('resolution'),
            score: record.get('score')
        }));
    } catch (error) {
        console.error("Error finding similar tickets:", error);
        return [];
    } finally {
        await session.close();
    }
};

export default driver;

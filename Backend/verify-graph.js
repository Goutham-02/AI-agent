import driver from "./utils/graph.js";

async function verify() {
    const session = driver.session();
    try {
        const result = await session.run("MATCH (n) RETURN n LIMIT 10");
        console.log(`Found ${result.records.length} nodes in the graph.`);
        result.records.forEach(r => {
            console.log(r.get('n').properties);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await session.close();
        await driver.close();
    }
}

verify();

import { useEffect, useState, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function GraphPage() {
    const [data, setData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const graphRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${process.env.VITE_SERVER_URL}/tickets/graph`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch graph data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleNodeClick = (node) => {
        if (node.label === "Ticket") {
            navigate(`/tickets/${node.id}`);
        }
    };

    if (loading) return <div className="text-center mt-10">Loading Knowledge Graph...</div>;

    return (
        <div className="h-[80vh] w-full border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
            <h2 className="text-xl font-bold p-4 absolute z-10 text-white bg-black/50 rounded">Knowledge Graph</h2>
            <ForceGraph2D
                ref={graphRef}
                graphData={data}
                nodeLabel={(node) => node.title || node.name || node.label}
                nodeColor={(node) => (node.label === "Ticket" ? "#3b82f6" : "#10b981")}
                nodeRelSize={6}
                linkColor={() => "rgba(255,255,255,0.2)"}
                onNodeClick={handleNodeClick}
                backgroundColor="#111827"
            />
        </div>
    );
}

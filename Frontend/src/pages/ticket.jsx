import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import axios from "axios";

export default function TicketDetailsPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchTicket = async () => {
    try {
      const res = await axios.get(
        `${process.env.VITE_SERVER_URL}/tickets/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.status === 200) {
        setTicket(res.data.ticket);
      } else {
        alert(res.data.message || "Failed to fetch ticket");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  if (loading)
    return <div className="text-center mt-10">Loading ticket details...</div>;
  if (!ticket) return <div className="text-center mt-10">Ticket not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Ticket Details</h2>

      <div className="card bg-gray-800 shadow p-4 space-y-4">
        <h3 className="text-xl font-semibold">{ticket.title}</h3>
        <p>{ticket.description}</p>

        {/* Conditionally render extended details */}
        {ticket.status && (
          <>
            <div className="divider">Metadata</div>
            <p>
              <strong>Status:</strong> {ticket.status}
            </p>
            {ticket.priority && (
              <p>
                <strong>Priority:</strong> {ticket.priority}
              </p>
            )}

            {ticket.relatedSkills?.length > 0 && (
              <p>
                <strong>Related Skills:</strong>{" "}
                {ticket.relatedSkills.join(", ")}
              </p>
            )}

            {ticket.helpfulNotes && (
              <div>
                <strong>Helpful Notes:</strong>
                <div className="prose max-w-none rounded mt-2">
                  <ReactMarkdown>{ticket.helpfulNotes}</ReactMarkdown>
                </div>
              </div>
            )}

            {ticket.assignedTo && (
              <p>
                <strong>Assigned To:</strong> {ticket.assignedTo?.email}
              </p>
            )}

            {ticket.createdAt && (
              <p className="text-sm text-gray-500 mt-2">
                Created At: {new Date(ticket.createdAt).toLocaleString()}
              </p>
            )}

            {ticket.resolution && (
              <div>
                <div className="divider">Resolution</div>
                <div className="bg-green-900/20 p-4 rounded border border-green-500/30">
                  <h4 className="font-bold text-green-500 mb-2">🎉 Resolved</h4>
                  <p>{ticket.resolution}</p>
                </div>
              </div>
            )}

            {ticket.status !== "RESOLVED" &&
              ["admin", "moderator"].includes(JSON.parse(localStorage.getItem("user") || "{}").role) && (
                <div className="mt-6 border-t pt-4 border-gray-700">
                  <h4 className="font-semibold mb-2">Moderator Actions</h4>
                  <ResolveTicketForm ticketId={ticket._id} onResolved={() => fetchTicket()} />
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}

function ResolveTicketForm({ ticketId, onResolved }) {
  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.VITE_SERVER_URL}/tickets/${ticketId}/resolve`,
        { resolution },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status === 200) {
        onResolved(); // Refresh parent
      } else {
        alert("Failed to resolve ticket");
      }
    } catch (err) {
      console.error("Resolve error:", err);
      alert("Error resolving ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-base-200 p-4 rounded-lg">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Resolution Notes</span>
        </label>
        <textarea
          className="textarea textarea-bordered h-24"
          placeholder="Describe how the ticket was resolved..."
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          required
        ></textarea>
      </div>
      <div className="form-control mt-4">
        <button
          type="submit"
          className={`btn btn-success ${loading ? "loading" : ""}`}
          disabled={loading}
        >
          {loading ? "Resolving..." : "Mark as Resolved"}
        </button>
      </div>
    </form>
  );
}

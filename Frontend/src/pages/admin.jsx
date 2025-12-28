import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ role: "", skills: "" });
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${process.env.VITE_SERVER_URL}/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error("Error fetching users", err);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user.email);
    setFormData({
      role: user.role,
      skills: user.skills?.join(", "),
    });
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.post(
        `${process.env.VITE_SERVER_URL}/auth/update-user`,
        {
          email: editingUser,
          role: formData.role,
          skills: formData.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status !== 200) {
        console.error(res.data.error || "Failed to update user");
        return;
      }

      setEditingUser(null);
      setFormData({ role: "", skills: "" });
      fetchUsers();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredUsers(
      users.filter((user) => user.email.toLowerCase().includes(query))
    );
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">Admin Panel - Manage Users</h1>
      <input
        type="text"
        className="input input-bordered w-full mb-6"
        placeholder="Search by email"
        value={searchQuery}
        onChange={handleSearch}
      />
      {filteredUsers.map((user) => (
        <div
          key={user._id}
          className="bg-base-100 shadow rounded p-4 mb-4 border"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold">{user.email}</p>
              <p className="text-sm">Role: {user.role}</p>
              <p className="text-sm">Skills: {user.skills?.join(", ")}</p>
            </div>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => handleEditClick(user)}
            >
              Edit
            </button>
          </div>
        </div>
      ))}

      {editingUser && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Edit User: {editingUser}</h3>
            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text">Role</span>
              </label>
              <select
                className="select select-bordered"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text">Skills (comma separated)</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={formData.skills}
                onChange={(e) =>
                  setFormData({ ...formData, skills: e.target.value })
                }
              />
            </div>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setEditingUser(null);
                  setFormData({ role: "", skills: "" });
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdate}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

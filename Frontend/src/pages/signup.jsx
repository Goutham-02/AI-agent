import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "", role: "user", skills: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.role === "moderator" && typeof payload.skills === "string") {
        payload.skills = payload.skills.split(",").map(s => s.trim()).filter(Boolean);
      } else {
        payload.skills = []; // Ensure empty array for others
      }

      const res = await axios.post(
        `${process.env.VITE_SERVER_URL}/auth/signup`,
        payload
      );

      if (res.status === 201) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/");
      } else {
        alert(res.data.message || "Signup failed");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-sm shadow-xl bg-base-100">
        <form onSubmit={handleSignup} className="card-body">
          <h2 className="card-title justify-center">Sign Up</h2>

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="input input-bordered"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input input-bordered"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />

          <select
            name="role"
            className="select select-bordered w-full"
            value={form.role}
            onChange={handleChange}
          >
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>

          {form.role === "moderator" && (
            <input
              type="text"
              name="skills"
              placeholder="Skills (comma separated, e.g. React, Node)"
              className="input input-bordered"
              value={form.skills}
              onChange={handleChange}
            />
          )}

          <div className="form-control mt-4">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

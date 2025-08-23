
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { inngest } from "../inngest/client.js";

console.log("[user.js] Controller file loaded");

export const signup = async (req, res) => {
    const { email, password, role = "user", skills = [] } = req.body;
    try {
        console.log("[signup] Signup called with email:", email, "role:", role);
        
        // Validate role
        if (!["user", "moderator", "admin"].includes(role)) {
            return res.status(400).json({ error: "Invalid role. Must be user, moderator, or admin" });
        }
        
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashed, role, skills });

        // fire inngest
        try {
            const inngestResult = await inngest.send({
                name: "user/signup",
                data: { email, role }
            });
            console.log("[signup] Inngest event sent:", inngestResult);
        } catch (inngestErr) {
            console.error("[signup] Error sending Inngest event:", inngestErr);
        }

        const token = jwt.sign(
            { _id: user._id, role: user.role },
            process.env.JWT_SECRET
        );

        res.json({ user, token });
    } catch (error) {
        console.error("[signup] Signup failed:", error);
        if (error.code === 11000) {
            return res.status(400).json({ error: "Email already exists" });
        }
        res.status(500).json({ error: "signup failed", details: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: "user not found" });

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid Credentials" })

        const token = jwt.sign(
            {
                _id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET
        );
        res.json({ user, token });

    } catch (error) {
        res.status(500).json({ error: "Login failed", details: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        res.json({ message: "Logout successful" });
    } catch (error) {
        console.error("[logout] Error:", error);
        res.status(500).json({ error: "Logout failed" });
    }
};

export const updateUser = async (req, res) => {
    const { skills = [], role, email } = req.body;
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ error: "Forbidden" });
        }
        
        if (role && !["user", "moderator", "admin"].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }
        
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });
        
        await User.updateOne(
            { email },
            { 
                skills: skills.length ? skills : user.skills, 
                role: role || user.role 
            }
        );
        
        return res.json({ message: "User updated successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Update failed", details: error.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        console.log("[getUsers] Request from user:", {
            userId: req.user._id,
            role: req.user.role,
            isAdmin: req.user.role === "admin"
        });
        
        if (req.user?.role !== "admin") {
            console.log("[getUsers] Access denied - user role:", req.user?.role);
            return res.status(403).json({ error: "Forbidden" });
        }
        
        console.log("[getUsers] Admin access granted, fetching users...");
        const users = await User.find().select("-password");
        console.log("[getUsers] Found users:", users.length);
        return res.json({ users });
    } catch (error) {
        console.error("[getUsers] Error:", error);
        return res.status(500).json({ error: "Failed to retrieve users", details: error.message });
    }
};
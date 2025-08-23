import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log("[auth] Authenticating request:", {
        hasToken: !!token,
        path: req.path,
        method: req.method
    });
    
    if (!token) {
        console.log("[auth] No token found");
        return res.status(401).json({ error: "Access Denied. No token found" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("[auth] Token decoded successfully:", {
            userId: decoded._id,
            role: decoded.role
        });
        req.user = decoded;
        next();
    } catch (error) {
        console.log("[auth] Token verification failed:", error.message);
        res.status(401).json({ error: "Invalid Token" });
    }
}
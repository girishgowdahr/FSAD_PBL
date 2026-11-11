import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: {
          message: "Authentication required",
        },
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        error: {
          message: "Authentication required",
        },
      });
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({
        error: {
          message: "Authentication required",
        },
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      req.user = null;
      return next();
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: {
          message: "Authentication required",
        },
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        error: {
          message: "Authentication required",
        },
      });
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({
        error: {
          message: "Authentication required",
        },
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    next(error);
  }
}

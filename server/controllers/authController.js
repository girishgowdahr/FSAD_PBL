import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

// Dummy hash for timing attack mitigation on unknown email
const DUMMY_HASH = "$2a$12$e80yVj.1sYxLg8g9kU1u1.8LpP7j9R5B7G6Y8E5w2P5B7G6Y8E5w2";

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Strict type validation against operator injection
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: {
          message: "Name, email, and password must all be strings",
        },
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({
        error: {
          message: "Name must be between 2 and 50 characters",
        },
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        error: {
          message: "Please enter a valid email address",
        },
      });
    }

    // Password rules: 8 to 72 chars, at least one letter and one number
    if (
      password.length < 8 ||
      password.length > 72 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return res.status(400).json({
        error: {
          message: "Password must be 8-72 characters long and contain at least one letter and one number",
        },
      });
    }

    // Check existing email
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(409).json({
        error: {
          message: "Email is already registered",
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      passwordHash,
    });

    const token = signToken(user._id.toString());

    return res.status(201).json({
      message: "Account created successfully",
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: {
          message: "Email is already registered",
        },
      });
    }
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        error: {
          message: "Email and password must be strings",
        },
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail }).select("+passwordHash");

    if (!user) {
      // Run dummy compare to mitigate timing attacks
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({
        error: {
          message: "Invalid email or password",
        },
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          message: "Invalid email or password",
        },
      });
    }

    const token = signToken(user._id.toString());

    return res.status(200).json({
      message: "Logged in successfully",
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    return res.status(200).json({
      message: "User fetched successfully",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

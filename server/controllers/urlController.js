import mongoose from "mongoose";
import { Url } from "../models/Url.js";
import { Click } from "../models/Click.js";
import { generateCode } from "../utils/generateCode.js";
import { validateUrl } from "../utils/validateUrl.js";

const RESERVED_CODES = new Set(["api", "health"]);

export async function createShortUrl(req, res, next) {
  try {
    const { originalUrl } = req.body;
    const validation = validateUrl(originalUrl, process.env.BASE_URL);

    if (!validation.valid) {
      return res.status(400).json({
        error: {
          message: validation.message,
        },
      });
    }

    const maxRetries = 5;
    let attempts = 0;
    let urlDoc = null;

    while (attempts < maxRetries) {
      attempts++;
      let shortCode = generateCode(6);
      while (RESERVED_CODES.has(shortCode.toLowerCase())) {
        shortCode = generateCode(6);
      }

      try {
        urlDoc = await Url.create({
          originalUrl: validation.url,
          shortCode,
        });
        break;
      } catch (err) {
        if (err.code === 11000 && attempts < maxRetries) {
          // Duplicate key collision, retry
          continue;
        }
        throw err;
      }
    }

    if (!urlDoc) {
      return res.status(500).json({
        error: {
          message: "Failed to generate a unique short URL. Please try again.",
        },
      });
    }

    return res.status(201).json({
      message: "Short URL created successfully",
      data: urlDoc,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUrls(req, res, next) {
  try {
    const urls = await Url.find().sort({ createdAt: -1 });
    return res.status(200).json({
      message: "URLs fetched successfully",
      data: urls,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUrlById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          message: "Invalid URL ID",
        },
      });
    }

    const url = await Url.findById(id);
    if (!url) {
      return res.status(404).json({
        error: {
          message: "URL not found",
        },
      });
    }

    return res.status(200).json({
      message: "URL fetched successfully",
      data: url,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUrl(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          message: "Invalid URL ID",
        },
      });
    }

    const url = await Url.findByIdAndDelete(id);
    if (!url) {
      return res.status(404).json({
        error: {
          message: "URL not found",
        },
      });
    }

    // Delete associated clicks
    await Click.deleteMany({ urlId: id });

    return res.status(200).json({
      message: "URL deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function handleRedirect(req, res, next) {
  try {
    const { shortCode } = req.params;

    if (RESERVED_CODES.has(shortCode.toLowerCase()) || !/^[A-Za-z0-9]{4,12}$/.test(shortCode)) {
      return next();
    }

    // Atomically increment clicks and retrieve original URL
    const url = await Url.findOneAndUpdate(
      { shortCode },
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!url) {
      return res.status(404).format({
        html: () => {
          res.send(`
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <title>404 - Short Link Not Found</title>
                <style>
                  body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
                  .card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 450px; }
                  h1 { color: #ef4444; margin-top: 0; font-size: 1.8rem; }
                  p { color: #64748b; line-height: 1.5; }
                  a { display: inline-block; margin-top: 1rem; padding: 0.5rem 1.25rem; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
                  a:hover { background: #1d4ed8; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>404 - Link Not Found</h1>
                  <p>The short link you are trying to visit does not exist or has been deleted.</p>
                  <a href="${process.env.CLIENT_URL || "http://localhost:5173"}">Go to Homepage</a>
                </div>
              </body>
            </html>
          `);
        },
        json: () => {
          res.json({
            error: {
              message: "Short link not found",
            },
          });
        },
        default: () => {
          res.type("txt").send("404 - Short link not found");
        },
      });
    }

    // Record click asynchronously; failure must never block redirect
    const rawReferrer = req.get("referer") || req.get("referrer") || "";
    const referrer = rawReferrer.slice(0, 500).trim();

    try {
      await Click.create({
        urlId: url._id,
        referrer,
      });
    } catch (clickErr) {
      console.error("Failed to record click:", clickErr.message);
    }

    return res.redirect(302, url.originalUrl);
  } catch (error) {
    next(error);
  }
}

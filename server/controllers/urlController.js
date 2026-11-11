import mongoose from "mongoose";
import { Url } from "../models/Url.js";
import { Click } from "../models/Click.js";
import { generateCode } from "../utils/generateCode.js";
import { validateUrl } from "../utils/validateUrl.js";
import { validateAlias } from "../utils/validateAlias.js";

const RESERVED_CODES = new Set([
  "api",
  "health",
  "login",
  "register",
  "logout",
  "dashboard",
  "admin",
  "assets",
  "static",
  "favicon",
  "robots",
  "sitemap",
  "about",
  "help",
  "me",
]);

export async function createShortUrl(req, res, next) {
  try {
    const { originalUrl, customAlias, expiresAt } = req.body;

    // Check guest restrictions on custom alias and expiry
    if (!req.user) {
      if (
        (customAlias && typeof customAlias === "string" && customAlias.trim() !== "") ||
        (expiresAt && typeof expiresAt === "string" && expiresAt.trim() !== "")
      ) {
        return res.status(401).json({
          error: {
            message: "Authentication required to use custom aliases and expiry dates",
          },
        });
      }
    }

    const validation = validateUrl(originalUrl, process.env.BASE_URL);
    if (!validation.valid) {
      return res.status(400).json({
        error: {
          message: validation.message,
        },
      });
    }

    // Expiry validation
    let parsedExpiry = null;
    if (expiresAt) {
      if (typeof expiresAt !== "string") {
        return res.status(400).json({
          error: {
            message: "Expiry date must be a valid ISO 8601 string",
          },
        });
      }

      const dateObj = new Date(expiresAt);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          error: {
            message: "Invalid expiry date format",
          },
        });
      }

      const now = Date.now();
      const minFuture = now + 60 * 1000; // at least 1 minute ahead
      const maxFuture = now + 365 * 24 * 60 * 60 * 1000; // at most 365 days ahead

      if (dateObj.getTime() < minFuture || dateObj.getTime() > maxFuture) {
        return res.status(400).json({
          error: {
            message: "Expiry date must be at least 1 minute and at most 365 days in the future",
          },
        });
      }

      parsedExpiry = dateObj;
    }

    const userId = req.user ? req.user.id : null;

    // Custom alias path
    if (customAlias && typeof customAlias === "string" && customAlias.trim() !== "") {
      const aliasValidation = validateAlias(customAlias);
      if (!aliasValidation.valid) {
        return res.status(400).json({
          error: {
            message: aliasValidation.message,
          },
        });
      }

      try {
        const urlDoc = await Url.create({
          originalUrl: validation.url,
          shortCode: aliasValidation.alias,
          userId,
          isCustom: true,
          expiresAt: parsedExpiry,
        });

        return res.status(201).json({
          message: "Short URL created successfully",
          data: urlDoc,
        });
      } catch (err) {
        if (err.code === 11000) {
          return res.status(409).json({
            error: {
              message: "This alias is already taken",
            },
          });
        }
        throw err;
      }
    }

    // Auto-generated short code path with collision retry
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
          userId,
          isCustom: false,
          expiresAt: parsedExpiry,
        });
        break;
      } catch (err) {
        if (err.code === 11000 && attempts < maxRetries) {
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
    const userId = req.user.id;
    const {
      search,
      status = "all",
      sort = "newest",
      page = "1",
      limit = "10",
    } = req.query;

    const filter = { userId: new mongoose.Types.ObjectId(userId) };

    // Search query with regex escaping and limit
    if (search && typeof search === "string" && search.trim() !== "") {
      const sanitizedSearch = search.trim().slice(0, 100);
      const escaped = sanitizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");
      filter.$or = [
        { originalUrl: searchRegex },
        { shortCode: searchRegex },
      ];
    }

    // Status filter
    const now = new Date();
    if (status === "active") {
      filter.$or = filter.$or
        ? [
            {
              $and: [
                { $or: filter.$or },
                { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
              ],
            },
          ]
        : [{ expiresAt: null }, { expiresAt: { $gt: now } }];
    } else if (status === "expired") {
      filter.expiresAt = { $ne: null, $lte: now };
    }

    // Sort mapping
    let sortObj = { createdAt: -1 };
    if (sort === "oldest") {
      sortObj = { createdAt: 1 };
    } else if (sort === "clicks") {
      sortObj = { clicks: -1, createdAt: -1 };
    }

    // Pagination
    let parsedPage = parseInt(page, 10);
    if (isNaN(parsedPage) || parsedPage < 1) parsedPage = 1;

    let parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) parsedLimit = 10;
    if (parsedLimit > 50) parsedLimit = 50;

    const skip = (parsedPage - 1) * parsedLimit;

    const [total, urls] = await Promise.all([
      Url.countDocuments(filter),
      Url.find(filter).sort(sortObj).skip(skip).limit(parsedLimit),
    ]);

    const totalPages = Math.ceil(total / parsedLimit) || 1;

    return res.status(200).json({
      message: "URLs fetched successfully",
      data: urls,
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
      },
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

    const url = await Url.findOne({
      _id: id,
      userId: req.user.id,
    });

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

    const url = await Url.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!url) {
      return res.status(404).json({
        error: {
          message: "URL not found",
        },
      });
    }

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

    if (RESERVED_CODES.has(shortCode.toLowerCase()) || !/^[A-Za-z0-9_-]{4,20}$/.test(shortCode)) {
      return next();
    }

    const url = await Url.findOne({ shortCode });
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

    // Check if expired
    const now = new Date();
    if (url.expiresAt && new Date(url.expiresAt) <= now) {
      return res.status(410).format({
        html: () => {
          res.send(`
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <title>410 - Link Expired</title>
                <style>
                  body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
                  .card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 450px; }
                  h1 { color: #f59e0b; margin-top: 0; font-size: 1.8rem; }
                  p { color: #64748b; line-height: 1.5; }
                  a { display: inline-block; margin-top: 1rem; padding: 0.5rem 1.25rem; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
                  a:hover { background: #1d4ed8; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>410 - Link Expired</h1>
                  <p>This short link had an expiration date and is no longer active.</p>
                  <a href="${process.env.CLIENT_URL || "http://localhost:5173"}">Go to Homepage</a>
                </div>
              </body>
            </html>
          `);
        },
        json: () => {
          res.json({
            error: {
              message: "This link has expired",
            },
          });
        },
        default: () => {
          res.type("txt").send("410 - This link has expired");
        },
      });
    }

    // Atomic increment conditional on link being non-expired
    const updated = await Url.findOneAndUpdate(
      {
        shortCode,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      },
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!updated) {
      return res.status(410).json({
        error: {
          message: "This link has expired",
        },
      });
    }

    // Record click asynchronously; failure must never block redirect
    const rawReferrer = req.get("referer") || req.get("referrer") || "";
    const referrer = rawReferrer.slice(0, 500).trim();

    try {
      await Click.create({
        urlId: updated._id,
        referrer,
      });
    } catch (clickErr) {
      console.error("Failed to record click:", clickErr.message);
    }

    return res.redirect(302, updated.originalUrl);
  } catch (error) {
    next(error);
  }
}

import mongoose from "mongoose";
import { Url } from "../models/Url.js";
import { Click } from "../models/Click.js";

function getPastDaysArray(numDays) {
  const dates = [];
  const now = new Date();
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export async function getUrlAnalytics(req, res, next) {
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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

    // Clicks grouped by day for the past 30 days
    const dailyClicks = await Click.aggregate([
      {
        $match: {
          urlId: new mongoose.Types.ObjectId(id),
          clickedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$clickedAt", timezone: "UTC" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const clickMap = new Map();
    for (const item of dailyClicks) {
      clickMap.set(item._id, item.count);
    }

    const past30Days = getPastDaysArray(30);
    const clicksByDay = past30Days.map((date) => ({
      date,
      clicks: clickMap.get(date) || 0,
    }));

    // Top 5 referrers
    const referrersAgg = await Click.aggregate([
      {
        $match: {
          urlId: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $group: {
          _id: { $ifNull: ["$referrer", ""] },
          clicks: { $sum: 1 },
        },
      },
      {
        $sort: { clicks: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    const topReferrers = referrersAgg.map((item) => ({
      referrer: item._id && item._id.trim() !== "" ? item._id : "Direct",
      clicks: item.clicks,
    }));

    return res.status(200).json({
      message: "Analytics fetched successfully",
      data: {
        url,
        totalClicks: url.clicks,
        clicksByDay,
        topReferrers,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSummary(req, res, next) {
  try {
    const totalLinks = await Url.countDocuments();

    // Total clicks sum
    const totalClicksAgg = await Url.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$clicks" },
        },
      },
    ]);
    const totalClicks = totalClicksAgg.length > 0 ? totalClicksAgg[0].total : 0;

    // Top 5 links by clicks
    const topLinks = await Url.find()
      .sort({ clicks: -1 })
      .limit(5)
      .select("_id shortCode originalUrl clicks createdAt");

    // Past 7 days clicks
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const dailyClicks = await Click.aggregate([
      {
        $match: {
          clickedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$clickedAt", timezone: "UTC" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const clickMap = new Map();
    for (const item of dailyClicks) {
      clickMap.set(item._id, item.count);
    }

    const past7Days = getPastDaysArray(7);
    const clicksByDay = past7Days.map((date) => ({
      date,
      clicks: clickMap.get(date) || 0,
    }));

    return res.status(200).json({
      message: "Summary fetched successfully",
      data: {
        totalLinks,
        totalClicks,
        topLinks,
        clicksByDay,
      },
    });
  } catch (error) {
    next(error);
  }
}

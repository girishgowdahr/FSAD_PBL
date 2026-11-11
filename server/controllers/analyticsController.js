import mongoose from "mongoose";
import { Url } from "../models/Url.js";
import { Click } from "../models/Click.js";
import { buildDateSeries } from "../utils/dateSeries.js";
import { formatCsv } from "../utils/csv.js";

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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

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

    const clicksByDay = buildDateSeries(dailyClicks, 30);

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
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();

    const [totalLinks, activeLinks, expiredLinks] = await Promise.all([
      Url.countDocuments({ userId }),
      Url.countDocuments({
        userId,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      }),
      Url.countDocuments({
        userId,
        expiresAt: { $ne: null, $lte: now },
      }),
    ]);

    const totalClicksAgg = await Url.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$clicks" },
        },
      },
    ]);
    const totalClicks = totalClicksAgg.length > 0 ? totalClicksAgg[0].total : 0;

    const topLinks = await Url.find({ userId })
      .sort({ clicks: -1 })
      .limit(5)
      .select("_id shortCode originalUrl clicks isCustom expiresAt status createdAt");

    // Last 7 days clicks
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const userUrls = await Url.find({ userId }).select("_id");
    const userUrlIds = userUrls.map((u) => u._id);

    let dailyClicks = [];
    if (userUrlIds.length > 0) {
      dailyClicks = await Click.aggregate([
        {
          $match: {
            urlId: { $in: userUrlIds },
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
    }

    const clicksByDay = buildDateSeries(dailyClicks, 7);

    return res.status(200).json({
      message: "Summary fetched successfully",
      data: {
        totalLinks,
        activeLinks,
        expiredLinks,
        totalClicks,
        topLinks,
        clicksByDay,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function exportAllUrlsCsv(req, res, next) {
  try {
    const userId = req.user.id;
    const urls = await Url.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });

    const columns = [
      { key: "shortCode", label: "shortCode" },
      { key: "shortUrl", label: "shortUrl" },
      { key: "originalUrl", label: "originalUrl" },
      { key: "clicks", label: "clicks" },
      { key: "status", label: "status" },
      { key: "isCustom", label: "isCustom" },
      { key: "createdAt", label: "createdAt" },
      { key: "expiresAt", label: "expiresAt" },
    ];

    const rows = urls.map((u) => ({
      shortCode: u.shortCode,
      shortUrl: u.shortUrl,
      originalUrl: u.originalUrl,
      clicks: u.clicks,
      status: u.status,
      isCustom: u.isCustom,
      createdAt: u.createdAt ? u.createdAt.toISOString() : "",
      expiresAt: u.expiresAt ? u.expiresAt.toISOString() : "",
    }));

    const csvContent = formatCsv(columns, rows);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `links-analytics-${dateStr}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

export async function exportUrlAnalyticsCsv(req, res, next) {
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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

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

    const clicksByDay = buildDateSeries(dailyClicks, 30);
    const columns = [
      { key: "date", label: "date" },
      { key: "clicks", label: "clicks" },
    ];

    const csvContent = formatCsv(columns, clicksByDay);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${url.shortCode}-clicks-${dateStr}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

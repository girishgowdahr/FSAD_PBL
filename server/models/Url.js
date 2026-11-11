import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 4,
      maxlength: 20,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for user queries
urlSchema.index({ userId: 1, createdAt: -1 });

// Virtual for shortUrl
urlSchema.virtual("shortUrl").get(function () {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  return `${baseUrl}/${this.shortCode}`;
});

// Virtual for status
urlSchema.virtual("status").get(function () {
  if (this.expiresAt && new Date(this.expiresAt) <= new Date()) {
    return "expired";
  }
  return "active";
});

export const Url = mongoose.model("Url", urlSchema);

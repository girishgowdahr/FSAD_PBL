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
      maxlength: 12,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for shortUrl
urlSchema.virtual("shortUrl").get(function () {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  return `${baseUrl}/${this.shortCode}`;
});

export const Url = mongoose.model("Url", urlSchema);

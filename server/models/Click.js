import mongoose from "mongoose";

const clickSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Url",
    required: true,
    index: true,
  },
  clickedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  referrer: {
    type: String,
    trim: true,
    maxlength: 500,
    default: "",
  },
});

export const Click = mongoose.model("Click", clickSchema);

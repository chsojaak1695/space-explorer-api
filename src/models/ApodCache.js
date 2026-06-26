const mongoose = require('mongoose');

const apodCacheSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      unique: true,
      index: true,
    },
    title: String,
    explanation: String,
    url: String,
    hdurl: String,
    media_type: String,
    copyright: String,
    rawPayload: mongoose.Schema.Types.Mixed,
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApodCache', apodCacheSchema);

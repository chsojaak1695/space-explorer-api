const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['apod', 'mars', 'neo'],
      required: [true, 'Favorite type is required'],
    },
    nasaId: {
      type: String,
      required: [true, 'NASA resource ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    url: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
      default: '',
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'Cannot have more than 20 tags',
      },
    },
    // Flexible metadata field for storing the original NASA payload
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate favorites of the same resource
favoriteSchema.index({ type: 1, nasaId: 1 }, { unique: true });

// Text search index
favoriteSchema.index({ title: 'text', notes: 'text', tags: 'text' });

module.exports = mongoose.model('Favorite', favoriteSchema);

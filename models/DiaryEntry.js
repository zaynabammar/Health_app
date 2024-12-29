const mongoose = require('mongoose');
const User = require('./User');

const diaryEntrySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId, // References the User model
    ref: 'User', // Name of the related collection/model
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  mood_scale: {
    type: Number,
    required: true,
  },
  sleep_quality_scale: {
    type: Number,
    required: true,
  },
  sleep_duration_length: {
    type: Number,
    required: true,
  },
  stool_consistency_scale: {
    type: Number,
    required: true,
  },
  stool_quantity_scale: {
    type: Number,
    required: true,
  },
  stool_mucus: {
    type: Boolean,
    required: true,
  },
  stool_blood: {
    type: Boolean,
    required: true,
  },
  stool_urgency: {
    type: Boolean,
    required: true,
  },
  stomach_pain: {
    type: Boolean,
    required: true,
  },
  stomach_bloating: {
    type: Boolean,
    required: true,
  },
  stomach_flatulence: {
    type: Boolean,
    required: true,
  },
  food: {
    type: [String], 
    required: true,
  },
  drink: {
    type: [String], 
    required: true,
  },
 
});

const DiaryEntry = mongoose.model('DiaryEntry', diaryEntrySchema);

module.exports = DiaryEntry;

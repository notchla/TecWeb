const mongoose = require("mongoose");

const ResultsSchema = mongoose.Schema({
  resultId: String,
  id: String,
  name: String,
  username: String,
  totalTime: String,
  totalPoints: Number,
  activities: {},
  time: { type: Date, default: Date.now },
});

const Results = mongoose.model("results", ResultsSchema);
module.exports = Results;

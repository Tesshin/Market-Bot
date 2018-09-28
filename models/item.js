const mongoose = require("mongoose");

const itemSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  itemName: String,
  submittedBy: String,
  createdAt: Date,
}, { collection: "test" });

module.exports = mongoose.model("Item", itemSchema);
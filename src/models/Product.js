const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  requestID: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  inputImageUrls: { type: [String], required: true },
  outputImageUrls: { type: [String], default: [] },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  webhookURL: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);

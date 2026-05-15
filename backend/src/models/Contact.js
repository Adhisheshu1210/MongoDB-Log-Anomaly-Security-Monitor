const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

ContactSchema.statics.createFrom = async function ({ name, email, message }) {
  const doc = new this({ name, email, message });
  return doc.save();
};

module.exports = mongoose.model('Contact', ContactSchema);

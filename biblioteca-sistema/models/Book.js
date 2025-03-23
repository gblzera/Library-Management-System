// models/Book.js
const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  publisher: {
    type: String,
    trim: true
  },
  publicationYear: {
    type: Number
  },
  isbn: {
    type: String,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  copies: {
    type: Number,
    default: 1
  },
  availableCopies: {
    type: Number,
    default: 1
  },
  location: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Book', BookSchema);
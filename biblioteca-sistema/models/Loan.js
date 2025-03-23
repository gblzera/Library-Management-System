// models/Loan.js
const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue', 'lost'],
    default: 'active'
  },
  fine: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  }
});

// Método para calcular multa
LoanSchema.methods.calculateFine = function(finePerDay = 0.50) {
  if (this.status === 'returned' || this.status === 'lost') {
    return this.fine;
  }
  
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  
  if (today > dueDate) {
    const diffTime = Math.abs(today - dueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * finePerDay;
  }
  
  return 0;
};

module.exports = mongoose.model('Loan', LoanSchema);
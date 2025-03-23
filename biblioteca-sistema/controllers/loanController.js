// controllers/loanController.js
const Loan = require('../models/Loan');
const Book = require('../models/Book');
const User = require('../models/User');

// Obter todos os empréstimos
exports.getLoans = async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate('book', 'title author')
      .populate('user', 'name email')
      .sort({ issueDate: -1 });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Obter um empréstimo específico
exports.getLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('book', 'title author')
      .populate('user', 'name email');
    
    if (!loan) {
      return res.status(404).json({ message: 'Empréstimo não encontrado' });
    }
    
    res.json(loan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Criar um novo empréstimo
exports.createLoan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Verificar se o livro existe e tem cópias disponíveis
    const book = await Book.findById(req.body.bookId);
    if (!book) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Livro não encontrado' });
    }
    
    if (book.availableCopies <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Livro sem cópias disponíveis' });
    }
    
    // Verificar se o usuário existe
    const user = await User.findById(req.body.userId);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Calcular data de devolução (padrão: 14 dias)
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 dias como padrão
    
    // Criar o empréstimo
    const loan = new Loan({
      book: book._id,
      user: user._id,
      issueDate,
      dueDate: req.body.dueDate || dueDate,
      status: 'active',
      notes: req.body.notes
    });
    
    const newLoan = await loan.save({ session });
    
    // Atualizar o livro (decrementar cópias disponíveis)
    book.availableCopies -= 1;
    await book.save({ session });
    
    // Atualizar o usuário (incrementar empréstimos ativos)
    user.activeLoans += 1;
    user.totalLoans += 1;
    await user.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    const populatedLoan = await Loan.findById(newLoan._id)
      .populate('book', 'title author')
      .populate('user', 'name email');
    
    res.status(201).json(populatedLoan);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message });
  }
};

// Marcar empréstimo como devolvido
exports.returnLoan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const loan = await Loan.findById(req.params.id).session(session);
    if (!loan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Empréstimo não encontrado' });
    }
    
    if (loan.status === 'returned') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Este livro já foi devolvido' });
    }
    
    // Atualizar o empréstimo
    loan.returnDate = new Date();
    loan.status = 'returned';
    
    // Calcular multa se estiver atrasado
    if (loan.returnDate > loan.dueDate) {
      loan.fine = loan.calculateFine();
    }
    
    await loan.save({ session });
    
    // Atualizar o livro (incrementar cópias disponíveis)
    const book = await Book.findById(loan.book).session(session);
    book.availableCopies += 1;
    await book.save({ session });
    
    // Atualizar o usuário (decrementar empréstimos ativos)
    const user = await User.findById(loan.user).session(session);
    user.activeLoans -= 1;
    await user.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    const populatedLoan = await Loan.findById(loan._id)
      .populate('book', 'title author')
      .populate('user', 'name email');
    
    res.json(populatedLoan);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message });
  }
};

// Atualizar status de empréstimo (ex: marcar como perdido)
exports.updateLoanStatus = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Empréstimo não encontrado' });
    }
    
    // Atualizar apenas o status e notas
    loan.status = req.body.status;
    if (req.body.notes) {
      loan.notes = req.body.notes;
    }
    
    // Para livros perdidos, podemos definir uma multa
    if (req.body.status === 'lost') {
      loan.fine = req.body.fine || 0;
    }
    
    await loan.save();
    
    const populatedLoan = await Loan.findById(loan._id)
      .populate('book', 'title author')
      .populate('user', 'name email');
    
    res.json(populatedLoan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Obter empréstimos por usuário
exports.getUserLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.params.userId })
      .populate('book', 'title author')
      .sort({ issueDate: -1 });
    
    res.json(loans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verificar empréstimos atrasados
exports.checkOverdueLoans = async (req, res) => {
  try {
    const today = new Date();
    const overdueLoans = await Loan.find({
      status: 'active',
      dueDate: { $lt: today }
    })
      .populate('book', 'title author')
      .populate('user', 'name email')
      .sort({ dueDate: 1 });
    
    // Atualizar status dos empréstimos para 'overdue'
    for (const loan of overdueLoans) {
      loan.status = 'overdue';
      await loan.save();
    }
    
    res.json(overdueLoans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Importação do mongoose
const mongoose = require('mongoose');
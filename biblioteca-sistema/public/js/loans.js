// models/Loan.js (referência)
/*
const loanSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueDate: { type: Date, default: Date.now },
  returnDate: { type: Date, required: true },
  actualReturnDate: { type: Date },
  status: { type: String, enum: ['active', 'overdue', 'returned'], default: 'active' }
});
*/

// routes/loans.js
const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const Book = require('../models/Book');
const User = require('../models/User');
const mongoose = require('mongoose');

// Middleware para verificar funcionário
// (placeholder - você deve implementar autenticação adequada depois)
const checkStaff = async (req, res, next) => {
  try {
    // Por enquanto, vamos apenas verificar se o ID do funcionário existe
    const staffId = req.body.createdBy || req.query.staffId;
    
    if (!staffId) {
      return res.status(400).json({ 
        msg: 'ID do funcionário não fornecido' 
      });
    }
    
    // Verificar se é um ID válido
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ msg: 'ID de funcionário inválido' });
    }
    
    const staff = await User.findById(staffId);
    
    if (!staff) {
      return res.status(404).json({ msg: 'Funcionário não encontrado' });
    }
    
    if (staff.role !== 'funcionario') {
      return res.status(403).json({ 
        msg: 'Acesso negado. Apenas funcionários podem gerenciar empréstimos.' 
      });
    }
    
    req.staffId = staffId;
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

// @rota    GET /api/loans
// @desc    Obter todos os empréstimos (com opções de filtro)
// @acesso  Público (por enquanto)
router.get('/', async (req, res) => {
  try {
    const { status, userId, bookId, limit = 10, sort = '-issueDate' } = req.query;
    
    // Construir o objeto de consulta
    const query = {};
    if (status) query.status = status;
    if (userId) query.user = userId;
    if (bookId) query.book = bookId;
    
    // Buscar empréstimos com população de referências
    const loans = await Loan.find(query)
      .populate('book', 'title author isbn')
      .populate('user', 'name email role')
      .populate('createdBy', 'name')
      .limit(parseInt(limit))
      .sort(sort);
    
    res.json(loans);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
});

// @rota    GET /api/loans/:id
// @desc    Obter empréstimo por ID
// @acesso  Público (por enquanto)
router.get('/:id', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('book', 'title author isbn')
      .populate('user', 'name email role')
      .populate('createdBy', 'name');
    
    if (!loan) {
      return res.status(404).json({ msg: 'Empréstimo não encontrado' });
    }
    
    res.json(loan);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Empréstimo não encontrado' });
    }
    
    res.status(500).send('Erro no servidor');
  }
});

// @rota    POST /api/loans
// @desc    Criar um novo empréstimo
// @acesso  Apenas funcionários
router.post('/', checkStaff, async (req, res) => {
  const { bookId, userId, returnDate } = req.body;
  
  // Validar dados
  if (!bookId || !userId || !returnDate) {
    return res.status(400).json({ 
      msg: 'Por favor, forneça o ID do livro, ID do usuário e data de devolução' 
    });
  }
  
  try {
    // Verificar se o livro existe e está disponível
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ msg: 'Livro não encontrado' });
    }
    
    if (book.status !== 'available') {
      return res.status(400).json({ msg: 'Livro não está disponível para empréstimo' });
    }
    
    // Verificar se o usuário existe e pode tomar emprestado
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    if (!['estudante', 'professor'].includes(user.role)) {
      return res.status(400).json({ 
        msg: 'Apenas estudantes e professores podem tomar livros emprestados' 
      });
    }
    
    // Verificar se o usuário já tem muitos empréstimos ativos
    const activeLoans = await Loan.countDocuments({ 
      user: userId, 
      status: { $in: ['active', 'overdue'] } 
    });
    
    const maxLoans = user.role === 'professor' ? 10 : 5; // Professores podem ter mais livros
    if (activeLoans >= maxLoans) {
      return res.status(400).json({ 
        msg: `Usuário atingiu o limite de ${maxLoans} empréstimos ativos` 
      });
    }
    
    // Criar o empréstimo
    const loan = new Loan({
      book: bookId,
      user: userId,
      createdBy: req.staffId,
      returnDate: new Date(returnDate)
    });
    
    // Salvar o empréstimo
    await loan.save();
    
    // Atualizar o status do livro
    book.status = 'borrowed';
    await book.save();
    
    // Retornar o empréstimo com dados populados
    const populatedLoan = await Loan.findById(loan._id)
      .populate('book', 'title author isbn')
      .populate('user', 'name email role')
      .populate('createdBy', 'name');
    
    res.status(201).json(populatedLoan);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
});

// @rota    PUT /api/loans/:id/return
// @desc    Registrar devolução de livro
// @acesso  Apenas funcionários
router.put('/:id/return', checkStaff, async (req, res) => {
  try {
    // Encontrar o empréstimo
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ msg: 'Empréstimo não encontrado' });
    }
    
    if (loan.status === 'returned') {
      return res.status(400).json({ msg: 'Este livro já foi devolvido' });
    }
    
    // Atualizar o empréstimo
    loan.status = 'returned';
    loan.actualReturnDate = new Date();
    await loan.save();
    
    // Atualizar o status do livro
    const book = await Book.findById(loan.book);
    if (book) {
      book.status = 'available';
      await book.save();
    }
    
    // Retornar o empréstimo atualizado
    const updatedLoan = await Loan.findById(req.params.id)
      .populate('book', 'title author isbn')
      .populate('user', 'name email role')
      .populate('createdBy', 'name');
    
    res.json(updatedLoan);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Empréstimo não encontrado' });
    }
    
    res.status(500).send('Erro no servidor');
  }
});

// @rota    PUT /api/loans/:id/extend
// @desc    Estender a data de devolução de um empréstimo
// @acesso  Apenas funcionários
router.put('/:id/extend', checkStaff, async (req, res) => {
  const { newReturnDate } = req.body;
  
  if (!newReturnDate) {
    return res.status(400).json({ msg: 'Nova data de devolução é obrigatória' });
  }
  
  try {
    // Encontrar o empréstimo
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ msg: 'Empréstimo não encontrado' });
    }
    
    if (loan.status === 'returned') {
      return res.status(400).json({ msg: 'Não é possível estender um empréstimo já devolvido' });
    }
    
    // Validar a nova data (deve ser futura)
    const newDate = new Date(newReturnDate);
    if (newDate <= new Date()) {
      return res.status(400).json({ msg: 'A nova data deve ser futura' });
    }
    
    // Atualizar o empréstimo
    loan.returnDate = newDate;
    
    // Se estiver atrasado e a nova data for válida, atualizar para ativo
    if (loan.status === 'overdue') {
      loan.status = 'active';
    }
    
    await loan.save();
    
    // Retornar o empréstimo atualizado
    const updatedLoan = await Loan.findById(req.params.id)
      .populate('book', 'title author isbn')
      .populate('user', 'name email role')
      .populate('createdBy', 'name');
    
    res.json(updatedLoan);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Empréstimo não encontrado' });
    }
    
    res.status(500).send('Erro no servidor');
  }
});

// @rota    DELETE /api/loans/:id
// @desc    Deletar um empréstimo (apenas para testes ou correções)
// @acesso  Apenas funcionários
router.delete('/:id', checkStaff, async (req, res) => {
  try {
    // Encontrar o empréstimo
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ msg: 'Empréstimo não encontrado' });
    }
    
    // Se o empréstimo estiver ativo, liberar o livro
    if (loan.status !== 'returned') {
      const book = await Book.findById(loan.book);
      if (book) {
        book.status = 'available';
        await book.save();
      }
    }
    
    // Remover o empréstimo
    await Loan.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Empréstimo removido' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Empréstimo não encontrado' });
    }
    
    res.status(500).send('Erro no servidor');
  }
});

// @rota    GET /api/loans/overdue
// @desc    Buscar todos os empréstimos atrasados 
// @acesso  Público (por enquanto)
router.get('/status/overdue', async (req, res) => {
  try {
    // Atualizar empréstimos vencidos
    const today = new Date();
    await Loan.updateMany(
      { 
        returnDate: { $lt: today }, 
        status: 'active' 
      },
      { $set: { status: 'overdue' } }
    );
    
    // Obter todos os atrasados
    const overdueLoans = await Loan.find({ status: 'overdue' })
      .populate('book', 'title author isbn')
      .populate('user', 'name email role')
      .populate('createdBy', 'name')
      .sort('returnDate');
    
    res.json(overdueLoans);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
});

module.exports = router;
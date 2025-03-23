// routes/loans.js
const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

// Rota para obter todos os empréstimos
router.get('/', loanController.getLoans);

// Rota para verificar empréstimos atrasados
router.get('/overdue', loanController.checkOverdueLoans);

// Rota para obter empréstimos de um usuário específico
router.get('/user/:userId', loanController.getUserLoans);

// Rota para obter um empréstimo específico
router.get('/:id', loanController.getLoan);

// Rota para criar um novo empréstimo
router.post('/', loanController.createLoan);

// Rota para marcar empréstimo como devolvido
router.put('/:id/return', loanController.returnLoan);

// Rota para atualizar o status de um empréstimo
router.put('/:id/status', loanController.updateLoanStatus);

module.exports = router;
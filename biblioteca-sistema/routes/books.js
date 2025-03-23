// routes/books.js
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// Rota para obter todos os livros
router.get('/', bookController.getBooks);

// Rota para obter um livro específico
router.get('/:id', bookController.getBook);

// Rota para adicionar um novo livro
router.post('/', bookController.addBook);

// Rota para atualizar um livro
router.put('/:id', bookController.updateBook);

// Rota para excluir um livro
router.delete('/:id', bookController.deleteBook);

module.exports = router;
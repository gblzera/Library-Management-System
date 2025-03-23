// controllers/bookController.js
const Book = require('../models/Book');

// Obter todos os livros
exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Obter um livro específico
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Adicionar um novo livro
exports.addBook = async (req, res) => {
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publisher: req.body.publisher,
    publicationYear: req.body.publicationYear,
    isbn: req.body.isbn,
    category: req.body.category,
    copies: req.body.copies,
    availableCopies: req.body.copies,
    location: req.body.location
  });

  try {
    const newBook = await book.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Atualizar um livro
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }
    
    // Atualizar os campos
    Object.keys(req.body).forEach(key => {
      book[key] = req.body[key];
    });
    
    const updatedBook = await book.save();
    res.json(updatedBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Excluir um livro
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }
    
    await book.remove();
    res.json({ message: 'Livro removido com sucesso' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
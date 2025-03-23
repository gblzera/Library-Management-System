// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rota para obter todos os usuários
router.get('/', userController.getUsers);

// Rota para obter um usuário específico
router.get('/:id', userController.getUser);

// Rota para adicionar um novo usuário
router.post('/', userController.addUser);

// Rota para atualizar um usuário
router.put('/:id', userController.updateUser);

// Rota para excluir um usuário
router.delete('/:id', userController.deleteUser);

module.exports = router;
// models/User.js (referência)
/*
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['funcionario', 'estudante', 'professor'], required: true },
  createdAt: { type: Date, default: Date.now }
});
*/

// routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @rota    GET /api/users
// @desc    Obter todos os usuários
// @acesso  Público (considerando que você irá implementar autenticação depois)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
});

// @rota    GET /api/users/:id
// @desc    Obter usuário por ID
// @acesso  Público
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    res.status(500).send('Erro no servidor');
  }
});

// @rota    POST /api/users
// @desc    Registrar um usuário
// @acesso  Público
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Verificar se o usuário já existe
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'Usuário já existe' });
    }

    // Criar o novo usuário
    user = new User({
      name,
      email,
      password,
      role
    });

    // Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Salvar o usuário
    await user.save();

    // Retornar o usuário sem a senha
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
});

// @rota    PUT /api/users/:id
// @desc    Atualizar um usuário
// @acesso  Público (por enquanto)
router.put('/:id', async (req, res) => {
  const { name, email, role, password } = req.body;

  // Construir o objeto de usuário
  const userFields = {};
  if (name) userFields.name = name;
  if (email) userFields.email = email;
  if (role) userFields.role = role;

  try {
    // Verificar se o usuário existe
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }

    // Atualizar a senha se fornecida
    if (password) {
      const salt = await bcrypt.genSalt(10);
      userFields.password = await bcrypt.hash(password, salt);
    }

    // Atualizar o usuário
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    res.status(500).send('Erro no servidor');
  }
});

// @rota    DELETE /api/users/:id
// @desc    Deletar um usuário
// @acesso  Público (por enquanto)
router.delete('/:id', async (req, res) => {
  try {
    // Verificar se o usuário existe
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }

    // Remover o usuário
    await User.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Usuário removido' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    res.status(500).send('Erro no servidor');
  }
});

// @rota    GET /api/users/role/:role
// @desc    Obter usuários por role (funcionário, estudante, professor)
// @acesso  Público
router.get('/role/:role', async (req, res) => {
  try {
    const users = await User.find({ role: req.params.role }).select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
});

module.exports = router;
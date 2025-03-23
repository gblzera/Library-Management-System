// controllers/userController.js
const User = require('../models/User');

// Obter todos os usuários
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Obter um usuário específico
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Adicionar um novo usuário
exports.addUser = async (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    userType: req.body.userType,
    studentId: req.body.studentId,
    department: req.body.department,
    phone: req.body.phone,
    address: req.body.address,
    status: req.body.status || 'active'
  });

  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Este email já está cadastrado' });
    }
    
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Atualizar um usuário
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Verificar se o email está sendo alterado e se já existe
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ message: 'Este email já está cadastrado' });
      }
    }
    
    // Atualizar os campos
    Object.keys(req.body).forEach(key => {
      user[key] = req.body[key];
    });
    
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Excluir um usuário
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Verificar se usuário tem empréstimos ativos
    if (user.activeLoans > 0) {
      return res.status(400).json({ 
        message: 'Este usuário possui empréstimos ativos e não pode ser excluído' 
      });
    }
    
    await user.remove();
    res.json({ message: 'Usuário removido com sucesso' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
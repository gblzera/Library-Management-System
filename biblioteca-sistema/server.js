// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const bookRoutes = require('./routes/books');
const userRoutes = require('./routes/users');
const loanRoutes = require('./routes/loans');

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao banco de dados
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/loans', loanRoutes);

// Rotas para o dashboard
app.get('/api/statistics', async (req, res) => {
  try {
    const Book = require('./models/Book');
    const User = require('./models/User');
    const Loan = require('./models/Loan');
    
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments();
    const activeLoans = await Loan.countDocuments({ status: 'active' });
    const overdueLoans = await Loan.countDocuments({ status: 'overdue' });
    
    // Top 5 livros mais emprestados
    const topBooks = await Loan.aggregate([
      { $group: { _id: '$book', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'bookDetails' } },
      { $unwind: '$bookDetails' },
      { $project: { _id: 0, title: '$bookDetails.title', author: '$bookDetails.author', count: 1 } }
    ]);
    
    // Estatísticas de empréstimos por mês (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const loansByMonth = await Loan.aggregate([
      { $match: { issueDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { 
            year: { $year: '$issueDate' }, 
            month: { $month: '$issueDate' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json({
      totalBooks,
      totalUsers,
      activeLoans,
      overdueLoans,
      topBooks,
      loansByMonth: loansByMonth.map(item => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        count: item.count
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rota para servir o aplicativo frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Porta do servidor
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
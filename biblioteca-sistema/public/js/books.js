// Constantes e configurações
const API_URL = 'http://localhost:5000/api';
const booksTableBody = document.getElementById('booksTableBody');
const bookModal = document.getElementById('bookModal');
const bookForm = document.getElementById('bookForm');
const modalTitle = document.getElementById('modalTitle');
const loader = document.getElementById('loader');
const noBooks = document.getElementById('noBooks');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Estado da aplicação
let books = [];
let currentBookId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', init);
document.getElementById('addBookBtn').addEventListener('click', showAddBookModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.querySelector('.close').addEventListener('click', closeModal);
bookForm.addEventListener('submit', handleBookSubmit);
searchBtn.addEventListener('click', searchBooks);
searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') searchBooks();
});

// Quando clica fora do modal, fecha ele
window.addEventListener('click', (e) => {
    if (e.target === bookModal) {
        closeModal();
    }
});

// Inicializa a aplicação
function init() {
    fetchBooks();
}

// Funções para API
async function fetchBooks() {
    showLoader();
    try {
        const response = await fetch(`${API_URL}/books`);
        if (!response.ok) throw new Error('Erro ao buscar livros');
        
        books = await response.json();
        renderBooks(books);
    } catch (error) {
        showError('Não foi possível carregar os livros.');
        console.error(error);
    } finally {
        hideLoader();
    }
}

async function addBook(bookData) {
    showLoader();
    try {
        const response = await fetch(`${API_URL}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
        });
        
        if (!response.ok) throw new Error('Erro ao adicionar livro');
        
        const newBook = await response.json();
        books.push(newBook);
        renderBooks(books);
        closeModal();
        showMessage('Livro adicionado com sucesso!');
    } catch (error) {
        showError('Erro ao adicionar livro.');
        console.error(error);
    } finally {
        hideLoader();
    }
}

async function updateBook(id, bookData) {
    showLoader();
    try {
        const response = await fetch(`${API_URL}/books/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
        });
        
        if (!response.ok) throw new Error('Erro ao atualizar livro');
        
        const updatedBook = await response.json();
        books = books.map(book => book._id === id ? updatedBook : book);
        renderBooks(books);
        closeModal();
        showMessage('Livro atualizado com sucesso!');
    } catch (error) {
        showError('Erro ao atualizar livro.');
        console.error(error);
    } finally {
        hideLoader();
    }
}

async function deleteBook(id) {
    if (!confirm('Tem certeza que deseja excluir este livro?')) return;
    
    showLoader();
    try {
        const response = await fetch(`${API_URL}/books/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erro ao excluir livro');
        
        books = books.filter(book => book._id !== id);
        renderBooks(books);
        showMessage('Livro excluído com sucesso!');
    } catch (error) {
        showError('Erro ao excluir livro.');
        console.error(error);
    } finally {
        hideLoader();
    }
}

// Funções de UI
function renderBooks(booksToRender) {
    if (booksToRender.length === 0) {
        booksTableBody.innerHTML = '';
        noBooks.classList.remove('hidden');
        return;
    }
    
    noBooks.classList.add('hidden');
    booksTableBody.innerHTML = booksToRender.map(book => `
        <tr>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.category || '-'}</td>
            <td>${book.availableCopies}/${book.copies}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="showEditBookModal('${book._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteBook('${book._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddBookModal() {
    currentBookId = null;
    modalTitle.textContent = 'Adicionar Livro';
    bookForm.reset();
    bookModal.style.display = 'block';
}

function showEditBookModal(id) {
    currentBookId = id;
    modalTitle.textContent = 'Editar Livro';
    
    const book = books.find(b => b._id === id);
    if (!book) return;
    
    document.getElementById('title').value = book.title;
    document.getElementById('author').value = book.author;
    document.getElementById('publisher').value = book.publisher || '';
    document.getElementById('publicationYear').value = book.publicationYear || '';
    document.getElementById('isbn').value = book.isbn || '';
    document.getElementById('category').value = book.category || '';
    document.getElementById('copies').value = book.copies;
    document.getElementById('location').value = book.location || '';
    
    bookModal.style.display = 'block';
}

function closeModal() {
    bookModal.style.display = 'none';
}

function handleBookSubmit(e) {
    e.preventDefault();
    
    const bookData = {
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        publisher: document.getElementById('publisher').value,
        publicationYear: document.getElementById('publicationYear').value ? parseInt(document.getElementById('publicationYear').value) : null,
        isbn: document.getElementById('isbn').value,
        category: document.getElementById('category').value,
        copies: parseInt(document.getElementById('copies').value),
        location: document.getElementById('location').value
    };
    
    if (currentBookId) {
        updateBook(currentBookId, bookData);
    } else {
        addBook(bookData);
    }
}

function searchBooks() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderBooks(books);
        return;
    }
    
    const filteredBooks = books.filter(book => 
        book.title.toLowerCase().includes(searchTerm) || 
        book.author.toLowerCase().includes(searchTerm) ||
        (book.category && book.category.toLowerCase().includes(searchTerm))
    );
    
    renderBooks(filteredBooks);
}

// Funções utilitárias
function showLoader() {
    loader.style.display = 'block';
}

function hideLoader() {
    loader.style.display = 'none';
}

function showMessage(message) {
    alert(message); // Posteriormente podemos implementar um sistema de notificações mais elegante
}

function showError(message) {
    alert(`Erro: ${message}`);
}

// Funções globais (precisam estar acessíveis no escopo global para os botões na tabela)
window.showEditBookModal = showEditBookModal;
window.deleteBook = deleteBook;
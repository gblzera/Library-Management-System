const API_URL = 'http://localhost:5000/api';
const usersTableBody = document.getElementById('usersTableBody');
const userModal = document.getElementById('userModal');
const userForm = document.getElementById('userForm');
const modalTitle = document.getElementById('modalTitleUser');
const loader = document.getElementById('loader');
const noUsers = document.getElementById('noUsers');
const searchInput = document.getElementById('searchUserInput');
const searchBtn = document.getElementById('searchUserBtn');

let users = [];
let currentUserId = null;

document.addEventListener('DOMContentLoaded', fetchUsers);
document.getElementById('addUserBtn').addEventListener('click', showAddUserModal);
document.getElementById('cancelUserBtn').addEventListener('click', closeUserModal);
document.querySelector('.closeUser').addEventListener('click', closeUserModal);
userForm.addEventListener('submit', handleUserSubmit);
searchBtn.addEventListener('click', searchUsers);
searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') searchUsers();
});

window.addEventListener('click', (e) => {
    if (e.target === userModal) {
        closeUserModal();
    }
});

async function fetchUsers() {
    showLoader();
    try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) throw new Error('Erro ao buscar usuários');

        users = await response.json();
        renderUsers(users);
    } catch (error) {
        showError('Não foi possível carregar os usuários.');
        console.error(error);
    } finally {
        hideLoader();
    }
}

async function addUser(userData) {
    showLoader();
    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!response.ok) throw new Error('Erro ao adicionar usuário');

        const newUser = await response.json();
        users.push(newUser);
        renderUsers(users);
        closeUserModal();
        showMessage('Usuário adicionado com sucesso!');
    } catch (error) {
        showError('Erro ao adicionar usuário.');
        console.error(error);
    } finally {
        hideLoader();
    }
}

async function updateUser(id, userData) {
    showLoader();
    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!response.ok) throw new Error('Erro ao atualizar usuário');

        users = users.map(user => user._id === id ? { ...user, ...userData } : user);
        renderUsers(users);
        closeUserModal();
        showMessage('Usuário atualizado com sucesso!');
    } catch (error) {
        showError('Erro ao atualizar usuário.');
        console.error(error);
    } finally {
        hideLoader();
    }
}

async function deleteUser(id) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    showLoader();
    try {
        const response = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });

        if (!response.ok) throw new Error('Erro ao excluir usuário');

        users = users.filter(user => user._id !== id);
        renderUsers(users);
        showMessage('Usuário excluído com sucesso!');
    } catch (error) {
        showError('Erro ao excluir usuário.');
        console.error(error);
    } finally {
        hideLoader();
    }
}

function renderUsers(usersToRender) {
    if (usersToRender.length === 0) {
        usersTableBody.innerHTML = '';
        noUsers.classList.remove('hidden');
        return;
    }

    noUsers.classList.add('hidden');
    usersTableBody.innerHTML = usersToRender.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="showEditUserModal('${user._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteUser('${user._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddUserModal() {
    currentUserId = null;
    modalTitle.textContent = 'Adicionar Usuário';
    userForm.reset();
    userModal.style.display = 'block';
}

function showEditUserModal(id) {
    currentUserId = id;
    modalTitle.textContent = 'Editar Usuário';

    const user = users.find(u => u._id === id);
    if (!user) return;

    document.getElementById('name').value = user.name;
    document.getElementById('email').value = user.email;
    document.getElementById('role').value = user.role || 'Usuário';

    userModal.style.display = 'block';
}

function closeUserModal() {
    userModal.style.display = 'none';
}

function handleUserSubmit(e) {
    e.preventDefault();

    const userData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        role: document.getElementById('role').value || 'Usuário'
    };

    if (currentUserId) {
        updateUser(currentUserId, userData);
    } else {
        addUser(userData);
    }
}

function searchUsers() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (!searchTerm) {
        renderUsers(users);
        return;
    }

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );

    renderUsers(filteredUsers);
}

// Funções globais
window.showEditUserModal = showEditUserModal;
window.deleteUser = deleteUser;

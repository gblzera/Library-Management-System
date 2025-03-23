async function createLoan(loanData) {
    showLoader();
    try {
        const response = await fetch(`${API_URL}/loans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loanData)
        });

        if (!response.ok) throw new Error('Erro ao registrar empréstimo');

        const newLoan = await response.json();
        loans.push(newLoan);
        renderLoans(loans);
        showMessage('Empréstimo registrado com sucesso!');
    } catch (error) {
        showError('Erro ao registrar empréstimo.');
        console.error(error);
    } finally {
        hideLoader();
    }
}

async function markAsReturned(id) {
    showLoader();
    try {
        const response = await fetch(`${API_URL}/loans/${id}/return`, { method: 'PUT' });

        if (!response.ok) throw new Error('Erro ao marcar como devolvido');

        loans = loans.map(loan => loan._id === id ? { ...loan, returned: true } : loan);
        renderLoans(loans);
        showMessage('Livro devolvido com sucesso!');
    } catch (error) {
        showError('Erro ao atualizar empréstimo.');
        console.error(error);
    } finally {
        hideLoader();
    }
}

const API_BASE_URL = '/mail'

async function loadLetters() {
    try {
        const response = await fetch(`${API_BASE_URL}/outgoing`);
        if (!response.ok) {
            throw new Error(`HTTP error! status : ${response.status}`);
        }
        const letters = await response.json();
        renderLetters(letters)
    } catch (error) {
        console.error('Ошибка при загрузке писем:', error);
        showError('Не удалось загрузить письма');
    }
}

// Функция для отображения писем в таблице
function renderLetters(letters) {
    const tbody = document.getElementById('lettersTable');
    
    if (letters.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div>📭</div>
                        <h3>Письма не найдены</h3>
                        <p>Попробуйте изменить параметры поиска</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = letters.map(letter => `
        <tr>
            <td><strong>${letter.internalNumber}</strong></td>
            <td>${formatDate(letter.registrationDate)}</td>
            <td>${letter.recipient}</td>
            <td title="${letter.subject}">${truncateText(letter.subject, 50)}</td>
            <td>${letter.executor}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-download" onclick="downloadLetter(${letter.id})" ${!letter.hasFile ? 'disabled' : ''}>
                        📥 Скачать
                    </button>
                    <button class="btn btn-edit" onclick="editLetter(${letter.id})">
                        ✏️ Редакт.
                    </button>
                    <button class="btn btn-view" onclick="viewLetter(${letter.id})">
                        👁 Просмотр
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Вспомогательные функции
async function downloadLetter(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/outgoing/${id}/download`);
        if (!response.ok) {
            throw new Error('Файл не найден');
        }
        
        // Создаем временную ссылку для скачивания
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `letter_${id}.pdf`; // или другое расширение
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Ошибка при скачивании:', error);
        alert('Не удалось скачать файл');
    }
}

async function viewLetter(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/outgoing/${id}`);
        if (!response.ok) {
            throw new Error('Письмо не найдено');
        }
        const letter = await response.json();
        
        // Показываем модальное окно с деталями
        showLetterDetails(letter);
    } catch (error) {
        console.error('Ошибка при загрузке письма:', error);
        alert('Не удалось загрузить данные письма');
    }
}

function showLetterDetails(letter) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Детали письма</h2>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="detail-row">
                    <label>Номер:</label>
                    <span>${letter.internal_number}</span>
                </div>
                <div class="detail-row">
                    <label>Дата регистрации:</label>
                    <span>${formatDate(letter.registration_date)}</span>
                </div>
                <div class="detail-row">
                    <label>Адресат:</label>
                    <span>${letter.recipient}</span>
                </div>
                <div class="detail-row">
                    <label>Исполнитель:</label>
                    <span>${letter.executor}</span>
                </div>
                <div class="detail-row">
                    <label>Содержание:</label>
                    <span>${letter.subject}</span>
                </div>
                ${letter.file_path ? `
                <div class="detail-row">
                    <label>Файл:</label>
                    <span>${letter.file_path}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}


function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Обработчики действий
function addLetter() {
    alert('Функция "Добавить письмо" будет реализована позже');
    // Здесь будет логика открытия формы добавления письма
}

function editLetter(id) {
    alert(`Редактирование письма #${id}`);
    // Здесь будет логика открытия формы редактирования
}

// Поиск и фильтрация
document.getElementById('searchInput').addEventListener('input', function(e) {
    // Здесь будет логика поиска
    console.log('Поиск:', e.target.value);
});

document.getElementById('executorFilter').addEventListener('change', function(e) {
    // Здесь будет логика фильтрации по исполнителю
    console.log('Фильтр:', e.target.value);
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    renderLetters();
});
const API_BASE_URL = '/mail';
let currentSection = 'outgoing';

async function loadLetters() {
    try {
        const response = await fetch(`${API_BASE_URL}/${currentSection}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const letters = await response.json();
        renderLetters(letters);
    } catch (error) {
        console.error('Ошибка при загрузке писем:', error);
        showError('Не удалось загрузить письма');
    }
}

// Переключение разделов
document.querySelectorAll('.switch-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Убираем класс "active" у всех кнопок
        document.querySelectorAll('.switch-btn').forEach(btn => btn.classList.remove('active'));

        // Добавляем класс "active" к нажатой кнопке
        button.classList.add('active');

        // Обновляем текущий раздел
        currentSection = button.dataset.section;

        // Обновляем заголовок раздела
        document.getElementById('currentSection').textContent =
            currentSection === 'outgoing' ? 'Исходящие письма' : 'Входящие письма';

        // Переключаем видимость таблиц
        document.getElementById('outgoingTable').style.display = 
            currentSection === 'outgoing' ? 'block' : 'none';
        document.getElementById('incomingTable').style.display = 
            currentSection === 'incoming' ? 'block' : 'none';

        // Загружаем письма для нового раздела
        loadLetters();
    });
});

// Функция для отображения писем в таблице
function renderLetters(letters) {
    if (currentSection === 'outgoing') {
        renderOutgoingLetters(letters);
    } else {
        renderIncomingLetters(letters);
    }
}

function renderOutgoingLetters(letters) {
    const tbody = document.getElementById('outgoingLettersTable');
    
    if (!letters || letters.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div>📭</div>
                        <h3>Исходящие письма не найдены</h3>
                        <p>Попробуйте изменить параметры поиска</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = letters.map(letter => `
        <tr>
            <td><strong>${letter.outgoing_number}</strong></td>
            <td>${formatDate(letter.registration_date)}</td>
            <td>${letter.recipient}</td>
            <td title="${letter.subject}">${truncateText(letter.subject, 50)}</td>
            <td>${letter.executor}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-download" onclick="downloadLetter(${letter.id}, 'outgoing')" ${!letter.file_path ? 'disabled' : ''}>
                        📥 Скачать
                    </button>
                    <button class="btn btn-edit" onclick="editLetter(${letter.id}, 'outgoing')">
                        ✏️ Редакт.
                    </button>
                    <button class="btn btn-view" onclick="viewLetter(${letter.id}, 'outgoing')">
                        👁 Просмотр
                    </button>
                    <button class="btn btn-delete" onclick="deleteLetter(${letter.id}, 'outgoing')">
                        🗑 Удалить
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Рендер входящих писем
function renderIncomingLetters(letters) {
    const tbody = document.getElementById('incomingLettersTable');
    
    if (!letters || letters.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div>📭</div>
                        <h3>Входящие письма не найдены</h3>
                        <p>Попробуйте изменить параметры поиска</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = letters.map(letter => `
        <tr>
            <td><strong>${letter.internal_number}</strong></td>
            <td>${formatDate(letter.registration_date)}</td>
            <td>${letter.sender}</td>
            <td title="${letter.subject}">${truncateText(letter.subject, 50)}</td>
            <td>${letter.registered_by}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-download" onclick="downloadLetter(${letter.id}, 'incoming')" ${!letter.file_path ? 'disabled' : ''}>
                        📥 Скачать
                    </button>
                    <button class="btn btn-edit" onclick="editLetter(${letter.id}, 'incoming')">
                        ✏️ Редакт.
                    </button>
                    <button class="btn btn-view" onclick="viewLetter(${letter.id}, 'incoming')">
                        👁 Просмотр
                    </button>
                    <button class="btn btn-delete" onclick="deleteLetter(${letter.id}, 'incoming')">
                        🗑 Удалить
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Вспомогательные функции
async function downloadLetter(id, type) {
    try {
        const response = await fetch(`${API_BASE_URL}/${type}/${id}/download`);
        if (!response.ok) {
            throw new Error('Файл не найден');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `letter_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Ошибка при скачивании:', error);
        alert('Не удалось скачать файл');
    }
}

async function viewLetter(id, type) {
    try {
        const response = await fetch(`${API_BASE_URL}/${type}/${id}`);
        if (!response.ok) {
            throw new Error('Письмо не найдено');
        }
        const letter = await response.json();
        
        showLetterDetails(letter, type);
    } catch (error) {
        console.error('Ошибка при загрузке письма:', error);
        alert('Не удалось загрузить данные письма');
    }
}

function showLetterDetails(letter, type) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Создаем красивый заголовок с иконкой
    const headerIcon = type === 'outgoing' ? '📤' : '📥';
    const headerText = type === 'outgoing' ? 'Исходящее письмо' : 'Входящее письмо';
    
    let detailsHTML = '';
    
    if (type === 'outgoing') {
        detailsHTML = `
            <div class="detail-row">
                <label>📋 Исходящий номер:</label>
                <span><strong>${letter.outgoing_number}</strong></span>
            </div>
            <div class="detail-row">
                <label>📅 Дата регистрации:</label>
                <span>${formatDate(letter.registration_date)}</span>
            </div>
            <div class="detail-row">
                <label>🏢 Адресат:</label>
                <span>${letter.recipient}</span>
            </div>
            <div class="detail-row">
                <label>👤 Исполнитель:</label>
                <span>${letter.executor}</span>
            </div>
        `;
    } else {
        detailsHTML = `
            <div class="detail-row">
                <label>📋 Входящий номер:</label>
                <span><strong>${letter.internal_number}</strong></span>
            </div>
            <div class="detail-row">
                <label>🔢 Внешний номер:</label>
                <span>${letter.external_number || '<em>Не указан</em>'}</span>
            </div>
            <div class="detail-row">
                <label>📅 Дата регистрации:</label>
                <span>${formatDate(letter.registration_date)}</span>
            </div>
            <div class="detail-row">
                <label>📨 Отправитель:</label>
                <span>${letter.sender}</span>
            </div>
            <div class="detail-row">
                <label>🏢 Адресат:</label>
                <span>${letter.addressee}</span>
            </div>
            <div class="detail-row">
                <label>👤 Зарегистрировал:</label>
                <span>${letter.registered_by}</span>
            </div>
        `;
    }
    
    // Добавляем содержание
    detailsHTML += `
        <div class="detail-row">
            <label>📝 Содержание:</label>
            <span style="white-space: pre-wrap;">${letter.subject}</span>
        </div>
    `;
    
    // Добавляем информацию о файле, если есть
    if (letter.file_path) {
        const fileName = letter.file_path.split('/').pop();
        detailsHTML += `
            <div class="detail-row">
                <label>📎 Прикрепленный файл:</label>
                <span>${fileName}</span>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>
                    ${headerIcon} ${headerText}
                    <span class="letter-type-badge">${type === 'outgoing' ? 'Исходящее' : 'Входящее'}</span>
                </h2>
                <button class="close-btn" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                ${detailsHTML}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Добавляем обработчик закрытия по клику вне окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // Добавляем обработчик закрытия по ESC
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeModal(modal);
            document.removeEventListener('keydown', escHandler);
        }
    });
}

// Функция для закрытия модального окна
function closeModal(element) {
    const modal = element.closest ? element.closest('.modal') : element;
    if (modal && modal.parentElement) {
        modal.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            if (modal.parentElement) {
                modal.parentElement.removeChild(modal);
            }
        }, 300);
    }
}

// Добавьте эту анимацию в CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.9);
        }
    }
`;
document.head.appendChild(style);

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function showError(message) {
    alert(message);
}

function editLetter(id, type) {
    alert(`Редактирование ${type === 'outgoing' ? 'исходящего' : 'входящего'} письма #${id} будет реализовано позже`);
}

// Поиск и фильтрация
document.getElementById('searchInput').addEventListener('input', function(e) {
    console.log('Поиск:', e.target.value);
    // Здесь будет реализация поиска
});

document.getElementById('executorFilter').addEventListener('change', function(e) {
    console.log('Фильтр:', e.target.value);
    // Здесь будет реализация фильтрации
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadLetters();
});

async function deleteLetter(id, type) {
    const letterType = type === 'outgoing' ? 'исходящее' : 'входящее';
    
    if (!confirm(`Вы уверены, что хотите удалить ${letterType} письмо #${id}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${type}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка при удалении письма');
        }

        // Показываем уведомление об успехе
        showNotification(`${letterType} письмо успешно удалено!`, 'success');
        
        // Обновляем список писем
        loadLetters();
        
    } catch (error) {
        console.error('❌ Ошибка при удалении письма:', error);
        showNotification('Ошибка при удалении письма: ' + error.message, 'error');
    }
}
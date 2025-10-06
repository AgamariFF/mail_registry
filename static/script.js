const API_BASE_URL = '/mail';
let currentSection = 'outgoing';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

// Функция удаления письма
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
        await sleep(1000);
        loadLetters();
        
    } catch (error) {
        console.error('❌ Ошибка при удалении письма:', error);
        showNotification('Ошибка при удалении письма: ' + error.message, 'error');
    }
}

// Функция редактирования письма (полностью переписанная)
async function editLetter(id, type) {
    try {
        console.log(`Загрузка письма ${type} #${id} для редактирования...`);
        
        const response = await fetch(`${API_BASE_URL}/${type}/${id}`);
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        const letter = await response.json();
        console.log('Письмо загружено:', letter);
        
        await openEditModal(letter, type);
    } catch (error) {
        console.error('Ошибка при загрузке письма для редактирования:', error);
        showNotification(`Не удалось загрузить данные письма: ${error.message}`, 'error');
    }
}

// Открытие модального окна редактирования (исправленная)
async function openEditModal(letter, type) {

    console.log('Открытие модального окна для письма:', letter);
    debugFileIssue(letter);
    return new Promise((resolve) => {
        setTimeout(() => {
            try {
                const modal = document.getElementById('editModal');
                const form = document.getElementById('editForm');
                
                if (!modal || !form) {
                    throw new Error('Элементы модального окна не найдены');
                }

                // Сбрасываем форму
                form.reset();
                
                // Очищаем старые hidden поля
                const oldRemoveFlag = document.getElementById('removeFileFlag');
                if (oldRemoveFlag) {
                    oldRemoveFlag.remove();
                }

                // Заполняем скрытые поля
                document.getElementById('editId').value = letter.id || '';
                document.getElementById('editType').value = type || '';
                
                // Устанавливаем заголовок
                document.getElementById('editModalTitle').textContent = 
                    `Редактирование ${type === 'outgoing' ? 'исходящего' : 'входящего'} письма`;
                
                // Показываем/скрываем соответствующие поля
                const outgoingFields = document.getElementById('outgoingFields');
                const incomingFields = document.getElementById('incomingFields');
                
                if (outgoingFields && incomingFields) {
                    outgoingFields.style.display = type === 'outgoing' ? 'block' : 'none';
                    incomingFields.style.display = type === 'incoming' ? 'block' : 'none';
                }
                
                // Заполняем общие поля
                document.getElementById('editSubject').value = letter.subject || '';
                
                // Форматируем дату для input[type="date"]
                if (letter.registration_date) {
                    const date = new Date(letter.registration_date);
                    if (!isNaN(date.getTime())) {
                        const formattedDate = date.toISOString().split('T')[0];
                        document.getElementById('editRegistrationDate').value = formattedDate;
                    }
                }
                
                // Заполняем поля в зависимости от типа письма
                if (type === 'outgoing') {
                    document.getElementById('editOutgoingNumber').value = letter.outgoing_number || '';
                    document.getElementById('editRecipient').value = letter.recipient || '';
                    document.getElementById('editExecutor').value = letter.executor || '';
                } else {
                    document.getElementById('editInternalNumber').value = letter.internal_number || '';
                    document.getElementById('editExternalNumber').value = letter.external_number || '';
                    document.getElementById('editSender').value = letter.sender || '';
                    document.getElementById('editAddressee').value = letter.addressee || '';
                    document.getElementById('editRegisteredBy').value = letter.registered_by || '';
                }
                
                // Обработка информации о файле
                const fileInfo = document.getElementById('currentFileInfo');
                const currentFileName = document.getElementById('currentFileName');
                
                if (fileInfo && currentFileName) {
                    if (letter.file_path && letter.file_path !== 'null' && letter.file_path !== '') {
                        const fileName = letter.file_path.split('/').pop() || letter.file_path;
                        currentFileName.textContent = fileName;
                        fileInfo.style.display = 'block';
                        
                        // Создаем скрытое поле для управления удалением файла
                        const removeFlag = document.createElement('input');
                        removeFlag.type = 'hidden';
                        removeFlag.id = 'removeFileFlag';
                        removeFlag.name = 'remove_file';
                        removeFlag.value = 'false';
                        form.appendChild(removeFlag);
                    } else {
                        fileInfo.style.display = 'none';
                    }
                }
                
                // Показываем модальное окно с анимацией
                modal.style.display = 'flex';
                modal.style.animation = 'modalAppear 0.3s ease forwards';
                
                // Добавляем обработчики событий
                modal.addEventListener('click', handleModalClick);
                document.addEventListener('keydown', handleEscapeKey);
                
                resolve();
            } catch (error) {
                console.error('Ошибка при открытии модального окна:', error);
                showNotification(`Ошибка при открытии формы редактирования: ${error.message}`, 'error');
                reject(error);
            }
        }, 10);
    });
}

// Закрытие модального окна редактирования (исправленная)
function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.animation = '';
            
            // Убираем обработчики событий
            modal.removeEventListener('click', handleModalClick);
            document.removeEventListener('keydown', handleEscapeKey);
        }, 300);
    }
}

// Обработчик клика вне модального окна
function handleModalClick(e) {
    const modal = document.getElementById('editModal');
    if (e.target === modal) {
        closeEditModal();
    }
}

// Обработчик клавиши Escape
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeEditModal();
    }
}

// Удаление прикрепленного файла (исправленная)
function removeFile() {
    const fileInfo = document.getElementById('currentFileInfo');
    const removeFlag = document.getElementById('removeFileFlag');
    
    if (fileInfo) {
        fileInfo.style.display = 'none';
    }
    
    if (removeFlag) {
        removeFlag.value = 'true';
    }
    
    // Очищаем поле выбора файла
    const fileInput = document.getElementById('editFile');
    if (fileInput) {
        fileInput.value = '';
    }
}

// Обработка отправки формы редактирования (исправленная)
document.getElementById('editForm').addEventListener('submit', async function(e) {
    console.log('Кнопка отправки изменений нажата')

    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const type = document.getElementById('editType').value;
    
    if (!id || !type) {
        showNotification('Ошибка: не указан ID или тип письма', 'error');
        return;
    }
    
    const formData = new FormData(this);
    
    // Добавляем проверку на удаление файла
    const removeFlag = document.getElementById('removeFileFlag');
    if (removeFlag && removeFlag.value === 'true') {
        formData.append('remove_file', 'true');
    }
    
    try {
        console.log(`Отправка обновления для письма ${type} #${id}...`);
        
        const response = await fetch(`${API_BASE_URL}/${type}/${id}`, {
            method: 'PUT',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Письмо обновлено:', result);
        
        showNotification('Письмо успешно обновлено!', 'success');
        closeEditModal();
        
        // Обновляем список писем
        setTimeout(() => {
            loadLetters();
        }, 500);
        
    } catch (error) {
        console.error('❌ Ошибка при обновлении письма:', error);
        showNotification(`Ошибка при обновлении письма: ${error.message}`, 'error');
    }
});

// Функция для отладки проблем с файлами
function debugFileIssue(letter) {
    console.log('=== ДЕБАГ ИНФОРМАЦИЯ О ФАЙЛЕ ===');
    console.log('file_path:', letter.file_path);
    console.log('file_path тип:', typeof letter.file_path);
    console.log('file_path равно null:', letter.file_path === null);
    console.log('file_path равно "null":', letter.file_path === 'null');
    console.log('file_path пустая строка:', letter.file_path === '');
    console.log('file_path undefined:', letter.file_path === undefined);
    console.log('Есть файл?:', letter.file_path && letter.file_path !== 'null' && letter.file_path !== '');
    console.log('================================');
}   

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

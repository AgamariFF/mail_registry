// Переключение полей в зависимости от типа письма
function toggleLetterFields() {
    const letterType = document.getElementById('letterType').value;
    const outgoingFields = document.getElementById('outgoingFields');
    const incomingFields = document.getElementById('incomingFields');
    const internalNumberLabel = document.getElementById('internalNumberLabel');
    
    if (letterType === 'outgoing') {
        outgoingFields.style.display = 'block';
        incomingFields.style.display = 'none';
        internalNumberLabel.textContent = 'Исходящий номер *';
        document.getElementById('internalNumber').placeholder = 'Например: 281-СКС';
    } else if (letterType === 'incoming') {
        outgoingFields.style.display = 'none';
        incomingFields.style.display = 'block';
        internalNumberLabel.textContent = 'Входящий номер *';
        document.getElementById('internalNumber').placeholder = 'Например: 50';
    } else {
        outgoingFields.style.display = 'none';
        incomingFields.style.display = 'none';
        internalNumberLabel.textContent = 'Номер *';
    }
}

// Переключение кастомного отправителя для входящих
function toggleSender() {
    const senderSelect = document.getElementById('sender');
    const customSender = document.getElementById('senderCustom');
    
    if (senderSelect.value === 'other') {
        customSender.style.display = 'block';
        // Очищаем значение селекта при выборе "другой"
        senderSelect.value = '';
    } else {
        customSender.style.display = 'none';
        // Очищаем кастомное поле
        document.getElementById('senderInput').value = '';
    }
}

// Переключение кастомного автора для исходящих
function toggleOutgoingAuthor() {
    const authorSelect = document.getElementById('outgoingAuthor');
    const customAuthor = document.getElementById('outgoingAuthorCustom');
    
    if (authorSelect.value === 'other') {
        customAuthor.style.display = 'block';
        authorSelect.value = '';
    } else {
        customAuthor.style.display = 'none';
        document.getElementById('outgoingAuthorInput').value = '';
    }
}

// Переключение кастомного автора для входящих
function toggleAddressee() {
    const addresseeSelect = document.getElementById('addressee');
    const customAddressee = document.getElementById('addresseeCustom');
    
    if (addresseeSelect.value === 'other') {
        customAddressee.style.display = 'block';
        // Очищаем значение селекта при выборе "другой"
        addresseeSelect.value = '';
    } else {
        customAddressee.style.display = 'none';
        // Очищаем кастомное поле
        document.getElementById('addresseeInput').value = '';
    }
}

// Получение финального значения с учетом кастомного ввода
function getFinalValue(selectId, customInputId) {
    const select = document.getElementById(selectId);
    const customInput = document.getElementById(customInputId);
    
    if (customInput && customInput.style.display !== 'none' && customInput.value.trim()) {
        return customInput.value.trim();
    }
    return select.value;
}

// Валидация формы
function validateForm(letterType) {
    const internalNumber = document.getElementById('internalNumber').value.trim();
    const subject = document.getElementById('subject').value.trim();
    
    if (!internalNumber) {
        showNotification('Введите номер письма', 'error');
        return false;
    }
    
    if (!subject) {
        showNotification('Введите краткое содержание', 'error');
        return false;
    }
    
    if (letterType === 'outgoing') {
        const recipient = document.getElementById('recipient').value.trim();
        const author = getFinalValue('outgoingAuthor', 'outgoingAuthorInput');
        
        if (!recipient) {
            showNotification('Введите адресата для исходящего письма', 'error');
            return false;
        }
        
        if (!author) {
            showNotification('Выберите или введите исполнителя', 'error');
            return false;
        }
    } else if (letterType === 'incoming') {
        const sender = document.getElementById('sender').value.trim();
        const addressee = getFinalValue('addressee', 'addresseeInput');
        const author = getFinalValue('incomingAuthor', 'incomingAuthorInput');
        
        if (!sender) {
            showNotification('Введите отправителя', 'error');
            return false;
        }
        
        if (!addressee) {
            showNotification('Выберите или введите адресата', 'error');
            return false;
        }
        
        if (!author) {
            showNotification('Выберите или введите кто зарегистрировал письмо', 'error');
            return false;
        }
    }
    
    return true;
}

// Обработчик отправки формы
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const letterType = document.getElementById('letterType').value;
    
    if (!letterType) {
        showNotification('Выберите тип письма', 'error');
        return;
    }
    
    // Валидация
    if (!validateForm(letterType)) {
        return;
    }

    // Показываем индикатор загрузки
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Добавление...';
    submitBtn.disabled = true;

    try {
        const formData = new FormData(e.target);
        
        // Добавляем финальные значения
        if (letterType === 'outgoing') {
            const author = getFinalValue('outgoingAuthor', 'outgoingAuthorInput');
            formData.set('executor', author);
        } else if (letterType === 'incoming') {
            const addressee = getFinalValue('addressee', 'addresseeInput');
            const author = getFinalValue('incomingAuthor', 'incomingAuthorInput');
            formData.set('addressee', addressee);
            formData.set('registered_by', author);
        }

        let response;
        if (letterType === 'outgoing') {
            response = await fetch(`${API_BASE_URL}/outgoing`, {
                method: 'POST',
                body: formData
            });
        } else if (letterType === 'incoming') {
            response = await fetch(`${API_BASE_URL}/incoming`, {
                method: 'POST',
                body: formData
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка при добавлении письма');
        }

        const newLetter = await response.json();
        console.log('✅ Письмо добавлено:', newLetter);
        
        // Показываем уведомление об успехе
        showNotification('Письмо успешно добавлено!', 'success');
        
        // Перенаправляем на главную страницу через 2 секунды
        setTimeout(() => {
            window.location.href = '/mail/';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Ошибка при добавлении письма:', error);
        showNotification('Ошибка при добавлении письма: ' + error.message, 'error');
        
        // Восстанавливаем кнопку
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    document.getElementById('notificationContainer').appendChild(notification);
    
    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Устанавливаем сегодняшнюю дату по умолчанию
    document.getElementById('registrationDate').valueAsDate = new Date();
    
    // Инициализируем обработчики
    toggleLetterFields();
    toggleAddressee();
    toggleOutgoingAuthor();
    toggleIncomingAuthor();
    
    // Обработчик отправки формы
    document.getElementById('addLetterForm').addEventListener('submit', handleFormSubmit);
});
const API_BASE_URL = '/mail';
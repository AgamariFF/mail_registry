// Получение финального значения с учетом кастомного ввода
function getFinalValue(selectId, customInputId) {
    const select = document.getElementById(selectId);
    const customInput = document.getElementById(customInputId);
    
    if (customInput && customInput.style.display !== 'none' && customInput.value.trim()) {
        return customInput.value.trim();
    }
    return select.value;
}

// Переключение кастомного автора для входящих
function toggleIncomingAuthor() {
    const authorSelect = document.getElementById('incomingAuthor');
    const customAuthor = document.getElementById('incomingAuthorCustom');
    
    if (authorSelect.value === 'other') {
        customAuthor.style.display = 'block';
    } else {
        customAuthor.style.display = 'none';
        document.getElementById('incomingAuthorInput').value = '';
    }
}

// Переключение кастомного адресата для входящих
function toggleAddressee() {
    const addresseeSelect = document.getElementById('addressee');
    const customAddressee = document.getElementById('addresseeCustom');
    
    if (addresseeSelect.value === 'other') {
        customAddressee.style.display = 'block';
    } else {
        customAddressee.style.display = 'none';
        document.getElementById('addresseeInput').value = '';
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

// Валидация формы входящих писем
function validateIncomingForm() {
    const internalNumber = document.getElementById('internalNumber').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const sender = document.getElementById('sender').value.trim();
    const addressee = getFinalValue('addressee', 'addresseeInput');
    const author = getFinalValue('incomingAuthor', 'incomingAuthorInput');
    
    if (!internalNumber) {
        showNotification('Введите входящий номер', 'error');
        return false;
    }
    
    if (!subject) {
        showNotification('Введите краткое содержание', 'error');
        return false;
    }
    
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
    
    return true;
}

// Обработчик отправки формы входящих писем
async function handleIncomingFormSubmit(e) {
    e.preventDefault();
    
    // Валидация
    if (!validateIncomingForm()) {
        return;
    }

    // Показываем индикатор загрузки
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Добавление...';
    submitBtn.disabled = true;

    try {
        const formData = new FormData(e.target);
        
        const addressee = getFinalValue('addressee', 'addresseeInput');
        const registeredBy = getFinalValue('incomingAuthor', 'incomingAuthorInput');
        formData.set('addressee', addressee);
        formData.set('registered_by', registeredBy);

        console.log('Отправляемые данные:', Object.fromEntries(formData.entries()));

        const response = await fetch(`${API_BASE_URL}/incoming`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            showNotification("Ошибка добавления письма!", "error");
            throw new Error(errorData.error || 'Ошибка при добавлении письма');
        }

        const newLetter = await response.json();
        console.log('✅ Входящее письмо добавлено:', newLetter);
        
        // Показываем уведомление об успехе
        showNotification('Входящее письмо успешно добавлено!', 'success');
        
        // Перенаправляем на главную страницу через 2 секунды
        setTimeout(() => {
            window.location.href = '/mail/';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Ошибка при добавлении входящего письма:', error);
        showNotification('Ошибка при добавлении письма: ' + error.message, 'error');
        
        // Восстанавливаем кнопку
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Устанавливаем сегодняшнюю дату по умолчанию
    document.getElementById('registrationDate').valueAsDate = new Date();
    
    // Инициализируем обработчики
    toggleAddressee();
    toggleIncomingAuthor();
    
    // Обработчик отправки формы
    document.getElementById('addIncomingLetterForm').addEventListener('submit', handleIncomingFormSubmit);
});

const API_BASE_URL = '/mail';
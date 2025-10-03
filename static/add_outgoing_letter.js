// Получение финального значения с учетом кастомного ввода
function getFinalValue(selectId, customInputId) {
    const select = document.getElementById(selectId);
    const customInput = document.getElementById(customInputId);
    
    if (customInput && customInput.style.display !== 'none' && customInput.value.trim()) {
        return customInput.value.trim();
    }
    return select.value;
}

// Переключение кастомного автора для исходящих
function toggleOutgoingAuthor() {
    const authorSelect = document.getElementById('outgoingAuthor');
    const customAuthor = document.getElementById('outgoingAuthorCustom');
    
    if (authorSelect.value === 'other') {
        customAuthor.style.display = 'block';
    } else {
        customAuthor.style.display = 'none';
        document.getElementById('outgoingAuthorInput').value = '';
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

// Валидация формы исходящих писем
function validateOutgoingForm() {
    const outgoingNumber = document.getElementById('outgoingNumber').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const recipient = document.getElementById('recipient').value.trim();
    const author = getFinalValue('outgoingAuthor', 'outgoingAuthorInput');
    
    if (!outgoingNumber) {
        showNotification('Введите исходящий номер', 'error');
        return false;
    }
    
    if (!subject) {
        showNotification('Введите краткое содержание', 'error');
        return false;
    }
    
    if (!recipient) {
        showNotification('Введите адресата для исходящего письма', 'error');
        return false;
    }
    
    if (!author) {
        showNotification('Выберите или введите исполнителя', 'error');
        return false;
    }
    
    return true;
}

// Обработчик отправки формы исходящих писем
async function handleOutgoingFormSubmit(e) {
    e.preventDefault();
    
    // Валидация
    if (!validateOutgoingForm()) {
        return;
    }

    // Показываем индикатор загрузки
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Добавление...';
    submitBtn.disabled = true;

    try {
        const formData = new FormData(e.target);
        
        console.log('Отправляемые данные:', Object.fromEntries(formData.entries()));

        // Добавляем финальное значение исполнителя
        const author = getFinalValue('outgoingAuthor', 'outgoingAuthorInput');
        formData.set('executor', author);

        const response = await fetch(`${API_BASE_URL}/outgoing`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка при добавлении письма');
        }

        const newLetter = await response.json();
        console.log('✅ Исходящее письмо добавлено:', newLetter);
        
        // Показываем уведомление об успехе
        showNotification('Исходящее письмо успешно добавлено!', 'success');
        
        // Перенаправляем на главную страницу через 2 секунды
        setTimeout(() => {
            window.location.href = '/mail/';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Ошибка при добавлении исходящего письма:', error);
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
    toggleOutgoingAuthor();
    
    // Обработчик отправки формы
    document.getElementById('addOutgoingLetterForm').addEventListener('submit', handleOutgoingFormSubmit);
});

const API_BASE_URL = '/mail';
-- Таблица для исходящих писем
CREATE TABLE outgoing_letters (
    id SERIAL PRIMARY KEY,
    outgoing_number VARCHAR(50) NOT NULL,
    registration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    executor VARCHAR(100) NOT NULL,
    file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для входящих писем
CREATE TABLE incoming_letters (
    id SERIAL PRIMARY KEY,
    internal_number VARCHAR(50) NOT NULL,
    external_number VARCHAR(100),
    registration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sender VARCHAR(255) NOT NULL,
    addressee VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    registered_by VARCHAR(100) NOT NULL,
    file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_outgoing_internal_number ON outgoing_letters(internal_number);
CREATE INDEX idx_outgoing_registration_date ON outgoing_letters(registration_date);
CREATE INDEX idx_outgoing_recipient ON outgoing_letters(recipient);
CREATE INDEX idx_outgoing_executor ON outgoing_letters(executor);
CREATE INDEX idx_outgoing_file_path ON outgoing_letters(file_path);

-- Таблица для отслеживания миграций
CREATE TABLE IF NOT EXISTS schema_migrations (
    version BIGINT PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
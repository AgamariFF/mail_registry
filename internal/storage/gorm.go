package storage

import (
	"mail_registry/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Storage struct {
	db *gorm.DB
}

func NewStorage(dsn string) (*Storage, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(
		&models.OutgoingLetter{},
		&models.IncomingLetter{},
	)
	if err != nil {
		return nil, err
	}

	return &Storage{db: db}, nil
}

// Методы для работы с исходящими письмами
func (s *Storage) CreateOutgoingLetter(letter *models.OutgoingLetter) error {
	return s.db.Create(letter).Error
}

func (s *Storage) GetOutgoingLetters() ([]models.OutgoingLetter, error) {
	var letters []models.OutgoingLetter
	err := s.db.Order("registration_date DESC").Find(&letters).Error
	return letters, err
}

func (s *Storage) GetOutgoingLetterByID(id int) (*models.OutgoingLetter, error) {
	var letter models.OutgoingLetter
	err := s.db.First(&letter, id).Error
	if err != nil {
		return nil, err
	}
	return &letter, nil
}

// Методы для работы с входящими письмами
func (s *Storage) CreateIncomingLetter(letter *models.IncomingLetter) error {
	return s.db.Create(letter).Error
}

func (s *Storage) GetIncomingLetters() ([]models.IncomingLetter, error) {
	var letters []models.IncomingLetter
	err := s.db.Order("registration_date DESC").Find(&letters).Error
	return letters, err
}

func (s *Storage) GetIncomingLetterByID(id int) (*models.IncomingLetter, error) {
	var letter models.IncomingLetter
	err := s.db.First(&letter, id).Error
	if err != nil {
		return nil, err
	}
	return &letter, nil
}

// Поиск по номеру
func (s *Storage) SearchByInternalNumber(number string) (interface{}, error) {
	var outgoing []models.OutgoingLetter
	var incoming []models.IncomingLetter

	// Ищем в обеих таблицах
	s.db.Where("internal_number ILIKE ?", "%"+number+"%").Find(&outgoing)
	s.db.Where("internal_number ILIKE ?", "%"+number+"%").Find(&incoming)

	result := map[string]interface{}{
		"outgoing": outgoing,
		"incoming": incoming,
	}

	return result, nil
}

// DeleteOutgoingLetter - удаление исходящего письма
func (s *Storage) DeleteOutgoingLetter(id int) error {
	result := s.db.Delete(&models.OutgoingLetter{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// DeleteIncomingLetter - удаление входящего письма
func (s *Storage) DeleteIncomingLetter(id int) error {
	result := s.db.Delete(&models.IncomingLetter{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (s *Storage) UpdateOutgoingLetter(letter *models.OutgoingLetter) error {
	return s.db.Save(letter).Error
}

// UpdateIncomingLetter - обновление входящего письма
func (s *Storage) UpdateIncomingLetter(letter *models.IncomingLetter) error {
	return s.db.Save(letter).Error
}

package migrations

import (
	"embed"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed *.sql
var fs embed.FS

func RunMigrations(databaseURL string) error {
	driver, err := iofs.New(fs, ".")
	if err != nil {
		return fmt.Errorf("failed to create migration driver: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", driver, databaseURL)
	if err != nil {
		return fmt.Errorf("failed to create migration instance: %w", err)
	}

	// Применяем все миграции
	err = m.Up()
	if err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to apply migrations: %w", err)
	}

	return nil
}

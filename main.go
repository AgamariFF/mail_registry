package main

import (
	"fmt"
	"mail_registry/internal/config"
	"mail_registry/internal/handlers"
	"mail_registry/internal/logger"
	"mail_registry/internal/migrations"
	"mail_registry/internal/storage"
)

func main() {
	config := config.LoadConfig()

	logger.InitLogger(config.LogLevel)
	defer logger.Close()

	logger.SugaredLogger.Info("mail_registry was running")

	databaseURL := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		config.DBUser,
		config.DBPassword,
		config.DBHost,
		config.DBPort,
		config.DBName,
		config.DBSSLMode,
	)

	logger.SugaredLogger.Info("Applying database migrations...")
	if err := migrations.RunMigrations(databaseURL); err != nil {
		logger.SugaredLogger.Fatal("Failed to run migrations:", err)
	}

	logger.SugaredLogger.Info("Initializing database connection...")
	store, err := storage.NewStorage(databaseURL)
	if err != nil {
		logger.SugaredLogger.Fatal("Failed to initialize storage:", err)
	}

	router := handlers.SetupRouter(store)

	logger.SugaredLogger.Info("Starting the server on the port " + config.AppPort)

	if err := router.Run(":" + config.AppPort); err != nil {
		logger.SugaredLogger.Fatal("Failed to start server:", err)
	}
}

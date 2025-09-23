package main

import (
	"mail_registry/internal/config"
	"mail_registry/internal/logger"
)

func main() {
	config := config.LoadConfig()

	logger.InitLogger(config.LogLevel)
	defer logger.Close()

	logger.SugaredLogger.Info("mail_registry was running")

}

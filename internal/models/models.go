package models

import "time"

type OutgoingLetter struct {
	ID               int       `json:"id"`
	OutgoingNumber   string    `json:"outgoing_number"`
	RegistrationDate time.Time `json:"registration_date"`
	Recipient        string    `json:"recipient"`
	Summary          string    `json:"summary"`
	Executor         string    `json:"executor"`
	FilePath         string    `json:"file_path"`
}

type IncomingLetter struct {
	ID                  int       `json:"id"`
	IncomingNumber      string    `json:"incoming_number"`
	LetterNumberAndDate string    `json:"letter_number_and_date"`
	RegistrationDate    time.Time `json:"registration_date"`
	Sender              string    `json:"sender"`
	Recipient           string    `json:"recipient"`
	Summary             string    `json:"summary"`
	RegisteredBy        string    `json:"registered_by"`
	FilePath            string    `json:"file_path"`
}

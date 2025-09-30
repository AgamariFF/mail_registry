package models

import "time"

type OutgoingLetter struct {
	ID               int       `json:"id"`
	OutgoingNumber   string    `json:"outgoing_number"`
	RegistrationDate time.Time `json:"registration_date"`
	Recipient        string    `json:"recipient"`
	Subject          string    `json:"subject"`
	Executor         string    `json:"executor"`
	FilePath         string    `json:"file_path"`
}

type IncomingLetter struct {
	ID               int       `json:"id"`
	IncomingNumber   string    `json:"incoming_number"`
	ExternalNumber   string    `json:"external_number"`
	RegistrationDate time.Time `json:"registration_date"`
	Sender           string    `json:"sender"`
	Addressee        string    `json:"addressee"`
	Subject          string    `json:"subject"`
	RegisteredBy     string    `json:"registered_by"`
	FilePath         string    `json:"file_path"`
}

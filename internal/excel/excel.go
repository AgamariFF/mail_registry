package excel

import (
	"mail_registry/internal/storage"
	"strconv"

	"github.com/xuri/excelize/v2"
)

func ToExcel(h *storage.Storage) (*excelize.File, error) {
	excelFile := excelize.NewFile()

	headerStyle, _ := excelFile.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{
			Horizontal:     "center",
			Indent:         1,
			ReadingOrder:   0,
			RelativeIndent: 1,
			ShrinkToFit:    true,
			TextRotation:   0,
			Vertical:       "",
			WrapText:       true,
		},
		Font: &excelize.Font{
			Bold:      true,
			Italic:    false,
			Underline: "",
			Family:    "",
			Size:      10,
			Strike:    false,
		},
	})

	excelFile.SetColWidth("Исходящие", "A", "A", 18)
	excelFile.SetColWidth("Исходящие", "B", "B", 17)
	excelFile.SetColWidth("Исходящие", "C", "C", 25)
	excelFile.SetColWidth("Исходящие", "D", "D", 87)
	excelFile.SetColWidth("Исходящие", "E", "E", 17)
	excelFile.SetCellStyle("Исходящие", "A1", "E1", headerStyle)
	excelFile.SetCellValue("Исходящие", "A1", "Исходящий номер")
	excelFile.SetCellValue("Исходящие", "B1", "Дата регистрации")
	excelFile.SetCellValue("Исходящие", "C1", "Адресат")
	excelFile.SetCellValue("Исходящие", "D1", "Краткое содержание")
	excelFile.SetCellValue("Исходящие", "E1", "Исполнитель")

	excelFile.SetColWidth("Входящие", "A", "A", 11)
	excelFile.SetColWidth("Входящие", "B", "B", 25)
	excelFile.SetColWidth("Входящие", "C", "C", 27)
	excelFile.SetColWidth("Входящие", "D", "D", 21)
	excelFile.SetColWidth("Входящие", "E", "E", 25)
	excelFile.SetColWidth("Входящие", "F", "F", 75)
	excelFile.SetColWidth("Входящие", "G", "G", 21)
	excelFile.SetCellStyle("Входящие", "A1", "G1", headerStyle)
	excelFile.SetCellValue("Входящие", "A1", "Входящий номер")
	excelFile.SetCellValue("Входящие", "B1", "Номер и дата письма")
	excelFile.SetCellValue("Входящие", "C1", "Дата регистрации")
	excelFile.SetCellValue("Входящие", "D1", "Отправитель")
	excelFile.SetCellValue("Входящие", "E1", "Адресат")
	excelFile.SetCellValue("Входящие", "F1", "Краткое содержание")
	excelFile.SetCellValue("Входящие", "G1", "Зарегистрировал")

	outgoingLetters, err := h.GetOutgoingLetters()
	if err != nil {
		return nil, err
	}

	for i, letter := range outgoingLetters {
		excelFile.SetCellValue("Исходящие", "A"+strconv.Itoa(i+2), letter.OutgoingNumber)
		excelFile.SetCellValue("Исходящие", "B"+strconv.Itoa(i+2), letter.RegistrationDate.Format("2006-01-02"))
		excelFile.SetCellValue("Исходящие", "C"+strconv.Itoa(i+2), letter.Recipient)
		excelFile.SetCellValue("Исходящие", "D"+strconv.Itoa(i+2), letter.Subject)
		excelFile.SetCellValue("Исходящие", "E"+strconv.Itoa(i+2), letter.Executor)
	}

	incomingLetters, err := h.GetIncomingLetters()
	if err != nil {
		return nil, err
	}

	for i, letter := range incomingLetters {
		excelFile.SetCellValue("Исходящие", "A"+strconv.Itoa(i+2), letter.InternalNumber)
		excelFile.SetCellValue("Исходящие", "B"+strconv.Itoa(i+2), letter.ExternalNumber)
		excelFile.SetCellValue("Исходящие", "C"+strconv.Itoa(i+2), letter.RegistrationDate.Format("2006-01-02"))
		excelFile.SetCellValue("Исходящие", "D"+strconv.Itoa(i+2), letter.Sender)
		excelFile.SetCellValue("Исходящие", "E"+strconv.Itoa(i+2), letter.Addressee)
		excelFile.SetCellValue("Исходящие", "F"+strconv.Itoa(i+2), letter.Subject)
		excelFile.SetCellValue("Исходящие", "G"+strconv.Itoa(i+2), letter.RegisteredBy)
	}

	return excelFile, nil
}

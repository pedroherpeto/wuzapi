package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
)

func Find(slice []string, val string) bool {
	for _, item := range slice {
		if item == val {
			return true
		}
	}
	return false
}

// Update entry in User map
func updateUserInfo(values interface{}, field string, value string) interface{} {
	log.Debug().Str("field", field).Str("value", value).Msg("User info updated")
	values.(Values).m[field] = value
	return values
}

// webhook for regular messages
func callHook(myurl string, payload map[string]string, id int) {
	log.Info().Str("url", myurl).Msg("Sending POST to client " + strconv.Itoa(id))

	// Log the payload map
	log.Debug().Msg("Payload:")
	for key, value := range payload {
		log.Debug().Str(key, value).Msg("")
	}

	_, err := clientHttp[id].R().SetFormData(payload).Post(myurl)
	if err != nil {
		log.Debug().Str("error", err.Error())
	}
}

func callHookFile(txtid string, data map[string]string, fileName, webhookURL string) error {
	// Build the user directory path
	userDirectory := filepath.Join("./", "files", "user_"+txtid)
	filePath := filepath.Join(userDirectory, fileName)

	// Check if the file exists before sending the URL
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return err // File does not exist, handle this error appropriately
	}

	// Generate the URL based on the user directory path
	baseURL := "http://localhost:5555/files/user_" + txtid + "/"
	fileURL := baseURL + fileName

	// Regular expression to detect Base64 strings (matches "data:<type>;base64,<data>")
	base64Pattern := `^data:[\w/\-]+;base64,`

	// Create a final payload that includes the file URL and filters out Base64 data
	finalPayload := make(map[string]string)
	for k, v := range data {
		// Exclude any value that matches the Base64 pattern
		matched, _ := regexp.MatchString(base64Pattern, v)
		if matched {
			continue
		}
		finalPayload[k] = v
	}

	// Add the file URL to the payload
	finalPayload["file_url"] = fileURL

	// Log the final payload
	log.Printf("Final payload to be sent: %v", finalPayload)

	// Convert final payload to JSON
	jsonPayload, err := json.Marshal(finalPayload)
	if err != nil {
		log.Println("Error marshaling JSON:", err)
		return err
	}

	// Send the webhook
	req, err := http.NewRequest("POST", webhookURL, bytes.NewBuffer(jsonPayload))
	if err != nil {
		log.Println("Error creating request:", err)
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Error sending webhook:", err)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Println("Webhook responded with non-200 status:", resp.Status)
		return fmt.Errorf("webhook failed with status %s", resp.Status)
	}

	// Log response
	log.Printf("POST request completed with status %d", resp.StatusCode)

	return nil
}

// webhook for messages with file attachments
// func callHookFile(myurl string, payload map[string]string, id int, file string) error {
//     log.Info().Str("file", file).Str("url", myurl).Msg("Sending POST")

//     // Criar um novo mapa para o payload final
//     finalPayload := make(map[string]string)
//     for k, v := range payload {
//         finalPayload[k] = v
//     }

//     // Adicionar o arquivo ao payload
//     finalPayload["file"] = file

//     log.Debug().Interface("finalPayload", finalPayload).Msg("Final payload to be sent")

//     resp, err := clientHttp[id].R().
//         SetFiles(map[string]string{
//             "file": file,
//         }).
//         SetFormData(finalPayload).
//         Post(myurl)

//     if err != nil {
//         log.Error().Err(err).Str("url", myurl).Msg("Failed to send POST request")
//         return fmt.Errorf("failed to send POST request: %w", err)
//     }

//     // Log do payload enviado
//     log.Debug().Interface("payload", finalPayload).Msg("Payload sent to webhook")

//     // Optionally, you can log the response status and body
//     log.Info().Int("status", resp.StatusCode()).Str("body", string(resp.Body())).Msg("POST request completed")

//     return nil
// }

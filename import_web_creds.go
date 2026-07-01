package main

// Import Web Session (Abordagem B).
//
// Recebe as credenciais de uma sessao WhatsApp Web JA existente (extraidas pela
// extensao "Passkey Linker" — formato Baileys, campos binarios em base64), monta
// um *store.Device no whatsmeow, persiste (device.Save) e conecta o canal SEM QR.
//
// NAO e pareamento nem logout: apenas ADOTA a sessao existente. O gatilho de
// "conectar sem QR" no whatsmeow e Store.ID != nil (ver wmiau.go:211); por isso
// gravamos o device + users.jid e delegamos ao startClient(), que faz
// container.GetDevice(jid) e cai no ramo de Connect() direto.
//
// Mapeamento de bytes espelha examples/whatsmeow-runner/main.go do projeto
// wa-store-migrate (github.com/vinikjkkj/wa-store-migrate).

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/patrickmn/go-cache"
	"github.com/rs/zerolog/log"
	waAdv "go.mau.fi/whatsmeow/proto/waAdv"
	"go.mau.fi/whatsmeow/util/keys"
)

// ── shape do payload (creds da extensao, formato Baileys/base64) ─────────────

type webKeyPair struct {
	Private string `json:"private"`
	Public  string `json:"public"`
}

type webSignedPreKey struct {
	KeyID     uint32     `json:"keyId"`
	KeyPair   webKeyPair `json:"keyPair"`
	Signature string     `json:"signature"`
}

type webAccount struct {
	Details             string `json:"details"`
	AccountSignatureKey string `json:"accountSignatureKey"`
	AccountSignature    string `json:"accountSignature"`
	DeviceSignature     string `json:"deviceSignature"`
}

type webMe struct {
	ID   string `json:"id"`
	LID  string `json:"lid"`
	Name string `json:"name"`
}

type webCreds struct {
	NoiseKey          webKeyPair      `json:"noiseKey"`
	SignedIdentityKey webKeyPair      `json:"signedIdentityKey"`
	SignedPreKey      webSignedPreKey `json:"signedPreKey"`
	RegistrationID    uint32          `json:"registrationId"`
	AdvSecretKey      string          `json:"advSecretKey"`
	Account           *webAccount     `json:"account"`
	Me                webMe           `json:"me"`
	Platform          string          `json:"platform"`
}

// ── helpers de decode ────────────────────────────────────────────────────────

// b64ToArr32 decodifica base64 -> [32]byte. Aceita 32 bytes crus OU 33 bytes com
// o prefixo 0x05 do libsignal (DjbECPublicKey), removendo-o — o whatsmeow guarda
// as chaves cruas (32B) no store.Device.
func b64ToArr32(s string) (*[32]byte, error) {
	b, err := base64.StdEncoding.DecodeString(s)
	if err != nil {
		return nil, err
	}
	var a [32]byte
	if len(b) == 32 {
		copy(a[:], b)
		return &a, nil
	}
	if len(b) == 33 && b[0] == 0x05 {
		copy(a[:], b[1:])
		return &a, nil
	}
	return nil, fmt.Errorf("expected 32 or 33-byte key, got %d", len(b))
}

func b64ToArr64(s string) (*[64]byte, error) {
	b, err := base64.StdEncoding.DecodeString(s)
	if err != nil {
		return nil, err
	}
	if len(b) != 64 {
		return nil, fmt.Errorf("expected 64-byte signature, got %d", len(b))
	}
	var a [64]byte
	copy(a[:], b)
	return &a, nil
}

func b64ToBytes(s string) []byte {
	if s == "" {
		return nil
	}
	b, _ := base64.StdEncoding.DecodeString(s)
	return b
}

// ── handler ──────────────────────────────────────────────────────────────────

// ImportWebCreds injeta uma sessao WhatsApp Web existente e conecta sem QR.
// POST /session/import-web-creds  (auth por header token). Body = objeto de creds.
func (s *server) ImportWebCreds() http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {

		txtid := r.Context().Value("userinfo").(Values).Get("Id")
		token := r.Context().Value("userinfo").(Values).Get("Token")
		events := r.Context().Value("userinfo").(Values).Get("Events")
		userid, _ := strconv.Atoi(txtid)

		if clientPointer[userid] != nil && clientPointer[userid].IsConnected() {
			s.Respond(w, r, http.StatusBadRequest, errors.New("Already connected"))
			return
		}

		var c webCreds
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			s.Respond(w, r, http.StatusBadRequest, errors.New("Could not decode Payload"))
			return
		}
		if c.NoiseKey.Private == "" || c.SignedIdentityKey.Private == "" || c.Me.ID == "" {
			s.Respond(w, r, http.StatusBadRequest, errors.New("Missing required creds (noiseKey/signedIdentityKey/me.id)"))
			return
		}

		jid, ok := parseJID(c.Me.ID)
		if !ok {
			s.Respond(w, r, http.StatusBadRequest, errors.New("Invalid me.id JID"))
			return
		}

		// ── monta o *store.Device ──
		dev := container.NewDevice()
		dev.RegistrationID = c.RegistrationID

		nkPub, err := b64ToArr32(c.NoiseKey.Public)
		if err != nil {
			s.Respond(w, r, http.StatusBadRequest, fmt.Errorf("noiseKey.public: %w", err))
			return
		}
		nkPriv, err := b64ToArr32(c.NoiseKey.Private)
		if err != nil {
			s.Respond(w, r, http.StatusBadRequest, fmt.Errorf("noiseKey.private: %w", err))
			return
		}
		dev.NoiseKey = &keys.KeyPair{Pub: nkPub, Priv: nkPriv}

		ikPub, err := b64ToArr32(c.SignedIdentityKey.Public)
		if err != nil {
			s.Respond(w, r, http.StatusBadRequest, fmt.Errorf("signedIdentityKey.public: %w", err))
			return
		}
		ikPriv, err := b64ToArr32(c.SignedIdentityKey.Private)
		if err != nil {
			s.Respond(w, r, http.StatusBadRequest, fmt.Errorf("signedIdentityKey.private: %w", err))
			return
		}
		dev.IdentityKey = &keys.KeyPair{Pub: ikPub, Priv: ikPriv}

		spkPub, err := b64ToArr32(c.SignedPreKey.KeyPair.Public)
		if err != nil {
			s.Respond(w, r, http.StatusBadRequest, fmt.Errorf("signedPreKey.keyPair.public: %w", err))
			return
		}
		spkPriv, err := b64ToArr32(c.SignedPreKey.KeyPair.Private)
		if err != nil {
			s.Respond(w, r, http.StatusBadRequest, fmt.Errorf("signedPreKey.keyPair.private: %w", err))
			return
		}
		spkSig, err := b64ToArr64(c.SignedPreKey.Signature)
		if err != nil {
			s.Respond(w, r, http.StatusBadRequest, fmt.Errorf("signedPreKey.signature: %w", err))
			return
		}
		dev.SignedPreKey = &keys.PreKey{
			KeyPair:   keys.KeyPair{Pub: spkPub, Priv: spkPriv},
			KeyID:     c.SignedPreKey.KeyID,
			Signature: spkSig,
		}

		// advSecretKey costuma vir vazio (o WhatsApp Web limpa pos-pareamento);
		// a coluna whatsmeow_device.adv_key e NOT NULL -> substitui por 32 zeros.
		// O segredo so serve p/ re-pareamento; conectar usa device.Account.
		dev.AdvSecretKey = b64ToBytes(c.AdvSecretKey)
		if len(dev.AdvSecretKey) == 0 {
			dev.AdvSecretKey = make([]byte, 32)
		}

		if c.Account != nil {
			dev.Account = &waAdv.ADVSignedDeviceIdentity{
				Details:             b64ToBytes(c.Account.Details),
				AccountSignatureKey: b64ToBytes(c.Account.AccountSignatureKey),
				AccountSignature:    b64ToBytes(c.Account.AccountSignature),
				DeviceSignature:     b64ToBytes(c.Account.DeviceSignature),
			}
		}

		dev.ID = &jid
		if c.Me.LID != "" {
			if lid, ok := parseJID(c.Me.LID); ok {
				dev.LID = lid
			}
		}
		dev.Platform = c.Platform
		dev.PushName = c.Me.Name
		dev.Initialized = true

		// persiste na tabela whatsmeow_device
		if err := dev.Save(r.Context()); err != nil {
			s.Respond(w, r, http.StatusInternalServerError, fmt.Errorf("save device: %w", err))
			return
		}

		// vincula usuario -> device (mesmo padrao do PairSuccess, wmiau.go:382)
		if _, err := s.db.Exec("UPDATE users SET jid=$1, connected=1 WHERE id=$2", dev.ID.String(), userid); err != nil {
			log.Error().Err(err).Msg("import-web-creds: failed to set users.jid")
		}
		if mu, found := userinfocache.Get(token); found {
			v := updateUserInfo(mu, "Jid", dev.ID.String())
			userinfocache.Set(token, v, cache.NoExpiration)
		}

		// conecta sem QR: startClient faz GetDevice(jid) e, como Store.ID != nil,
		// cai no ramo "Already logged in, just connect" (wmiau.go:264-271).
		subs := []string{"All"}
		if events != "" {
			subs = strings.Split(events, ",")
		}
		killchannel[userid] = make(chan bool)
		go s.startClient(userid, dev.ID.String(), token, subs)

		log.Info().Str("userid", txtid).Str("jid", dev.ID.String()).Msg("import-web-creds: session imported, connecting without QR")

		response := map[string]interface{}{"jid": dev.ID.String(), "details": "Imported"}
		responseJson, err := json.Marshal(response)
		if err != nil {
			s.Respond(w, r, http.StatusInternalServerError, err)
			return
		}
		s.Respond(w, r, http.StatusOK, string(responseJson))
	}
}

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce
};
use base64::{Engine as _, engine::general_purpose};
use rand::RngCore;
use std::env;

pub struct EncryptionService {
    key: [u8; 32],
}

impl EncryptionService {
    pub fn new() -> Self {
        let secret = env::var("AI_ENCRYPTION_SECRET").unwrap_or_else(|_| "binance-bot-secret-key-32-bytes!!".to_string());
        let mut key = [0u8; 32];
        let bytes = secret.as_bytes();
        let len = bytes.len().min(32);
        key[..len].copy_from_slice(&bytes[..len]);
        
        // Pad with zeros if shorter than 32
        if len < 32 {
            for i in len..32 {
                key[i] = b'0';
            }
        }

        Self { key }
    }

    pub fn encrypt(&self, data: &str) -> String {
        if data.is_empty() { return String::new(); }
        
        let cipher = Aes256Gcm::new_from_slice(&self.key).expect("Invalid key length");
        let mut nonce_bytes = [0u8; 12];
        rand::thread_rng().fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher
            .encrypt(nonce, data.as_bytes())
            .expect("Encryption failed");

        // Combine nonce + ciphertext
        let mut combined = Vec::with_capacity(nonce_bytes.len() + ciphertext.len());
        combined.extend_from_slice(&nonce_bytes);
        combined.extend_from_slice(&ciphertext);

        general_purpose::STANDARD.encode(combined)
    }

    pub fn decrypt(&self, encrypted_data: &str) -> Option<String> {
        if encrypted_data.is_empty() { return Some(String::new()); }
        
        let data = match general_purpose::STANDARD.decode(encrypted_data) {
            Ok(d) => d,
            Err(_) => return Some(encrypted_data.to_string()), // Might be plain text
        };

        if data.len() < 12 { return None; }

        let nonce = Nonce::from_slice(&data[..12]);
        let ciphertext = &data[12..];

        let cipher = Aes256Gcm::new_from_slice(&self.key).expect("Invalid key length");
        
        match cipher.decrypt(nonce, ciphertext) {
            Ok(decrypted) => String::from_utf8(decrypted).ok(),
            Err(_) => Some(encrypted_data.to_string()), // Treat as plain text fallback
        }
    }
}

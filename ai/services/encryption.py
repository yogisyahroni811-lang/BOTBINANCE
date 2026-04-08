import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# In production, this should be a secret environment variable
# MUST be 32 bytes for AES-256
MASTER_KEY_SECRET = os.getenv("AI_ENCRYPTION_SECRET", "binance-bot-secret-key-32-bytes!!")
if len(MASTER_KEY_SECRET) < 32:
    MASTER_KEY_SECRET = (MASTER_KEY_SECRET + "0" * 32)[:32]
elif len(MASTER_KEY_SECRET) > 32:
    MASTER_KEY_SECRET = MASTER_KEY_SECRET[:32]

class EncryptionService:
    def __init__(self):
        self.key = MASTER_KEY_SECRET.encode()
        self.aesgcm = AESGCM(self.key)

    def encrypt(self, data: str) -> str:
        if not data:
            return ""
        nonce = os.urandom(12)
        ciphertext = self.aesgcm.encrypt(nonce, data.encode(), None)
        # Combine nonce and ciphertext
        combined = nonce + ciphertext
        return base64.b64encode(combined).decode('utf-8')

    def decrypt(self, encrypted_data: str) -> str:
        if not encrypted_data:
            return ""
        try:
            data = base64.b64decode(encrypted_data)
            nonce = data[:12]
            ciphertext = data[12:]
            decrypted = self.aesgcm.decrypt(nonce, ciphertext, None)
            return decrypted.decode('utf-8')
        except Exception:
            # If decryption fails, it might be plain text (for existing/legacy keys)
            return encrypted_data

encryption_service = EncryptionService()

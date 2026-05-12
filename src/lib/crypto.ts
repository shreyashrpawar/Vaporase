/**
 * Utility functions for true End-to-End Encryption (E2EE) using WebCrypto API.
 */

// Convert ArrayBuffer to Base64 (Standard)
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a random AES-GCM key and export it as a base64url string for the URL hash
export async function generateKey(): Promise<string> {
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 128 },
    true,
    ['encrypt', 'decrypt']
  );
  const exported = await window.crypto.subtle.exportKey('raw', key);
  // Convert to base64 and make it URL safe (Base64URL)
  return bufferToBase64(exported).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Helper to restore base64url to standard base64 and import the key
async function importKey(keyStr: string): Promise<CryptoKey> {
  let base64 = keyStr.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const rawKey = base64ToBuffer(base64);
  return await window.crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using the provided key string.
 * Returns a JSON string containing the base64 IV and base64 Ciphertext.
 */
export async function encryptText(text: string, keyStr: string): Promise<string> {
  const key = await importKey(keyStr);
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // Generate a random initialization vector
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  return JSON.stringify({
    iv: bufferToBase64(iv.buffer),
    data: bufferToBase64(ciphertext)
  });
}

/**
 * Decrypts a JSON payload (containing IV and Ciphertext) using the provided key string.
 */
export async function decryptText(encryptedPayload: string, keyStr: string): Promise<string> {
  try {
    const { iv: ivB64, data: dataB64 } = JSON.parse(encryptedPayload);
    const key = await importKey(keyStr);
    const iv = base64ToBuffer(ivB64);
    const ciphertext = base64ToBuffer(dataB64);
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt. The key might be invalid or the data is corrupted.');
  }
}

/**
 * Hashes a password for sending to the server (so the server never sees the plaintext password).
 * Returns a hex string of the SHA-256 hash.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

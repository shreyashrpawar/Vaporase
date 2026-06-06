function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function generateKey() {
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 128 },
    true,
    ['encrypt', 'decrypt']
  );
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return bufferToBase64(exported).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importKey(keyStr) {
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

async function encryptText(text, keyStr) {
  const key = await importKey(keyStr);
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
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

async function decryptText(encryptedPayload, keyStr) {
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

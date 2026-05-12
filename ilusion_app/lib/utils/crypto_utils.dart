import 'dart:convert';
import 'dart:typed_data';
import 'package:webcrypto/webcrypto.dart';
import 'package:crypto/crypto.dart' as crypto;

/// Utility functions for true End-to-End Encryption (E2EE) using WebCrypto API.
/// Parity with Next.js crypto.ts implementation.

class CryptoUtils {
  
  /// Helper to convert base64url back to standard base64 for decoding
  static String _padBase64(String base64url) {
    String base64 = base64url.replaceAll('-', '+').replaceAll('_', '/');
    while (base64.length % 4 != 0) {
      base64 += '=';
    }
    return base64;
  }

  /// Generate a random AES-GCM 128-bit key and export it as a base64url string without padding
  static Future<String> generateKey() async {
    final key = await AesGcmSecretKey.generateKey(128);
    final exported = await key.exportRawKey();
    
    // Convert to base64 and make it URL safe (Base64URL without padding)
    String base64 = base64Encode(exported);
    return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  }

  /// Import a base64url string into an AesGcmSecretKey
  static Future<AesGcmSecretKey> _importKey(String keyStr) async {
    final base64 = _padBase64(keyStr);
    final rawKey = base64Decode(base64);
    return await AesGcmSecretKey.importRawKey(rawKey);
  }

  /// Encrypts a plaintext string using the provided key string.
  /// Returns a JSON string containing the base64 IV and base64 Ciphertext.
  static Future<String> encryptText(String text, String keyStr) async {
    final key = await _importKey(keyStr);
    final data = utf8.encode(text);
    
    // Generate a 12-byte random initialization vector
    final iv = Uint8List(12);
    fillRandomBytes(iv);
    
    final ciphertext = await key.encryptBytes(data, iv);
    
    // Format to match JS JSON.stringify({iv, data})
    final result = {
      'iv': base64Encode(iv),
      'data': base64Encode(ciphertext),
    };
    
    return jsonEncode(result);
  }

  /// Decrypts a JSON payload (containing IV and Ciphertext) using the provided key string.
  static Future<String> decryptText(String encryptedPayload, String keyStr) async {
    try {
      final Map<String, dynamic> payload = jsonDecode(encryptedPayload);
      final ivB64 = payload['iv'] as String;
      final dataB64 = payload['data'] as String;
      
      final key = await _importKey(keyStr);
      final iv = base64Decode(ivB64);
      final ciphertext = base64Decode(dataB64);
      
      final decryptedBuffer = await key.decryptBytes(ciphertext, iv);
      return utf8.decode(decryptedBuffer);
    } catch (e) {
      // print('Decryption failed: $e');
      throw Exception('Failed to decrypt. The key might be invalid or the data is corrupted.');
    }
  }

  /// Hashes a password using SHA-256 and returns a hex string.
  static String hashPassword(String password) {
    final bytes = utf8.encode(password);
    final digest = crypto.sha256.convert(bytes);
    return digest.toString();
  }
}

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'https://www.ilusion.io/api';

  static Map<String, String> _headers({String? token}) {
    final headers = {'Content-Type': 'application/json'};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  /// Create a new secret
  static Future<Map<String, dynamic>> createSecret({
    required String? encryptedContent,
    String? token,
    String? fileKey,
    String? fileName,
    int? fileSize,
    String? fileType,
    int expiresInHours = 24,
    String? passwordHash,
    bool isE2EE = false,
    String? recipientId,
    String? dropKey,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/secrets/create'),
      headers: _headers(token: token),
      body: jsonEncode({
        'encryptedContent': encryptedContent,
        'fileKey': fileKey,
        'fileName': fileName,
        'fileSize': fileSize,
        'fileType': fileType,
        'expiresInHours': expiresInHours,
        'passwordHash': passwordHash,
        'isE2EE': isE2EE,
        'recipientId': recipientId,
        'dropKey': dropKey,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create secret: ${response.body}');
    }
  }

  /// Retrieve a secret by ID
  static Future<Map<String, dynamic>> getSecret(String id, {String? passwordHash}) async {
    debugPrint('getSecret: calling /secrets/read with id=$id');
    final response = await http.post(
      Uri.parse('$baseUrl/secrets/read'),
      headers: _headers(),
      body: jsonEncode({'id': id, 'passwordHash': passwordHash}),
    );

    debugPrint('getSecret: status=${response.statusCode} body=${response.body}');

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else if (response.statusCode == 401) {
      final body = jsonDecode(response.body);
      if (body['requirePassword'] == true) {
        throw Exception('Password required');
      }
      throw Exception(body['error'] ?? 'Unauthorized');
    } else {
      final body = jsonDecode(response.body);
      final error = body['error'] ?? 'Failed to retrieve secret';
      throw Exception(error);
    }
  }

  /// Fetch dashboard secrets (requires authentication)
  static Future<List<dynamic>> getDashboardSecrets(String? token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/secrets/dashboard'),
      headers: _headers(token: token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to fetch dashboard: ${response.body}');
    }
  }

  /// Fetch inbox secrets (requires authentication)
  static Future<List<dynamic>> getInbox(String? token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/secrets/inbox'),
      headers: _headers(token: token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to fetch inbox: ${response.body}');
    }
  }

  /// Revoke a secret
  static Future<void> revokeSecret(String id, String? token) async {
    final response = await http.post(
      Uri.parse('$baseUrl/secrets/revoke'),
      headers: _headers(token: token),
      body: jsonEncode({'id': id}),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to revoke secret: ${response.body}');
    }
  }

  /// Search for a user profile by subdomain
  static Future<Map<String, dynamic>> searchProfile(String subdomain, String? token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/profile/search?subdomain=${Uri.encodeComponent(subdomain)}'),
      headers: _headers(token: token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final body = jsonDecode(response.body);
      throw Exception(body['error'] ?? 'User not found');
    }
  }

  /// Get current user's profile
  static Future<Map<String, dynamic>> getProfile(String? token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/profile'),
      headers: _headers(token: token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to fetch profile: ${response.body}');
    }
  }

  /// Save/update user profile
  static Future<Map<String, dynamic>> saveProfile({
    required String subdomain,
    required String displayName,
    required String? token,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/profile'),
      headers: _headers(token: token),
      body: jsonEncode({
        'subdomain': subdomain,
        'displayName': displayName,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final body = jsonDecode(response.body);
      throw Exception(body['error'] ?? 'Failed to save profile');
    }
  }

  /// Get presigned URL for file upload
  static Future<Map<String, dynamic>> getPresignedUrl({
    required String fileName,
    required int fileSize,
    required String fileType,
    String? token,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/secrets/presign'),
      headers: _headers(token: token),
      body: jsonEncode({
        'fileName': fileName,
        'fileSize': fileSize,
        'fileType': fileType,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to get presigned URL: ${response.body}');
    }
  }

  /// Upload file bytes to presigned URL
  static Future<void> uploadFile(String presignedUrl, List<int> bytes, String fileType) async {
    final response = await http.put(
      Uri.parse(presignedUrl),
      headers: {
        'Content-Type': fileType,
        'Content-Length': bytes.length.toString(),
      },
      body: bytes,
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to upload file to R2: ${response.statusCode}');
    }
  }
}

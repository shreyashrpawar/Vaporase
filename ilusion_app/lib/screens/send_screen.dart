import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import '../utils/crypto_utils.dart';
import '../services/api_service.dart';
import '../services/auth_provider.dart';
import '../theme/app_theme.dart';

class SendScreen extends StatefulWidget {
  const SendScreen({super.key});

  @override
  State<SendScreen> createState() => _SendScreenState();
}

class _SendScreenState extends State<SendScreen> {
  // Step 1: Search
  final _queryController = TextEditingController();
  Map<String, dynamic>? _profile;
  bool _isSearching = false;
  String? _searchError;

  // Step 2: Create secret
  final _secretController = TextEditingController();
  double _expiryValue = 24;
  bool _isCreating = false;
  String? _createError;
  String? _generatedLink;
  PlatformFile? _selectedFile;

  final Map<double, String> _expiryOptions = {
    0.0833: '5m',
    0.5: '30m',
    1.0: '1h',
    4.0: '4h',
    12.0: '12h',
    24.0: '1d',
    72.0: '3d',
    168.0: '7d',
  };

  Future<void> _searchUser() async {
    final query = _queryController.text.trim();
    if (query.isEmpty) return;
    setState(() { _isSearching = true; _searchError = null; _profile = null; });

    try {
      final auth = context.read<AuthProvider>();
      final token = await auth.getToken();
      final profile = await ApiService.searchProfile(query.toLowerCase(), token);
      setState(() => _profile = profile);
    } catch (e) {
      setState(() => _searchError = e.toString().replaceAll('Exception: ', ''));
    } finally {
      setState(() => _isSearching = false);
    }
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.pickFiles(type: FileType.any, withData: true);
      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (file.size > 100 * 1024 * 1024) {
          setState(() => _createError = 'File exceeds 100MB limit.');
          return;
        }
        setState(() { _selectedFile = file; _createError = null; });
      }
    } catch (e) {
      setState(() => _createError = 'Failed to pick file: $e');
    }
  }

  Future<void> _sendSecret() async {
    final text = _secretController.text.trim();
    if (text.isEmpty && _selectedFile == null) {
      setState(() => _createError = 'Please enter a secret or attach a file.');
      return;
    }

    setState(() { _isCreating = true; _createError = null; });

    try {
      final auth = context.read<AuthProvider>();
      final token = await auth.getToken();

      String? fileKey;
      String? fileName;
      int? fileSize;
      String? fileType;

      // Upload file if present
      if (_selectedFile != null) {
        fileName = _selectedFile!.name;
        fileSize = _selectedFile!.size;
        fileType = _selectedFile!.extension != null
            ? 'application/${_selectedFile!.extension}'
            : 'application/octet-stream';

        final presignRes = await ApiService.getPresignedUrl(
          fileName: fileName, fileSize: fileSize, fileType: fileType, token: token,
        );

        fileKey = presignRes['fileKey'];
        List<int> fileBytes;
        if (_selectedFile!.bytes != null) {
          fileBytes = _selectedFile!.bytes!;
        } else if (_selectedFile!.path != null) {
          fileBytes = await File(_selectedFile!.path!).readAsBytes();
        } else {
          throw Exception('Could not read file data.');
        }
        await ApiService.uploadFile(presignRes['url'], fileBytes, fileType);
      }

      // Always generate a key for drops
      final decryptionKey = await CryptoUtils.generateKey();
      String? encryptedContent;

      if (text.isNotEmpty) {
        encryptedContent = await CryptoUtils.encryptText(text, decryptionKey);
      }

      // Create secret with recipientId
      final response = await ApiService.createSecret(
        encryptedContent: encryptedContent,
        fileKey: fileKey,
        fileName: fileName,
        fileSize: fileSize,
        fileType: fileType,
        token: token,
        expiresInHours: _expiryValue.toInt() > 0 ? _expiryValue.toInt() : 1,
        isE2EE: true,
        recipientId: _profile!['userId'],
        dropKey: decryptionKey,
      );

      final id = response['id'];
      setState(() => _generatedLink = 'https://www.ilusion.io/secret/$id#key=$decryptionKey');
    } catch (e) {
      setState(() => _createError = e.toString());
    } finally {
      setState(() => _isCreating = false);
    }
  }

  void _reset() {
    setState(() {
      _profile = null;
      _queryController.clear();
      _secretController.clear();
      _selectedFile = null;
      _generatedLink = null;
      _createError = null;
      _searchError = null;
      _expiryValue = 24;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_generatedLink != null) return _buildSuccess();

    return Scaffold(
      appBar: AppBar(title: const Text('Send')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: _profile == null ? _buildSearch() : _buildCreateForm(),
      ),
    );
  }

  Widget _buildSearch() {
    return Column(
      children: [
        const SizedBox(height: 40),
        Container(
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: AppTheme.bgSecondary,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppTheme.borderDefault),
          ),
          child: Column(
            children: [
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  color: AppTheme.accentSubtle,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.accentPrimary.withValues(alpha: 0.2)),
                ),
                child: const Icon(LucideIcons.send, size: 28, color: AppTheme.accentPrimary),
              ),
              const SizedBox(height: 20),
              const Text('Who are you sending to?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              const Text('Enter their Ilusion username.', style: TextStyle(fontSize: 13, color: AppTheme.textTertiary)),
              const SizedBox(height: 24),
              TextField(
                controller: _queryController,
                decoration: InputDecoration(
                  hintText: 'username',
                  prefixIcon: const Icon(LucideIcons.search, size: 18),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onSubmitted: (_) => _searchUser(),
              ),
              if (_searchError != null) ...[
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(LucideIcons.alertCircle, size: 14, color: AppTheme.error),
                    const SizedBox(width: 6),
                    Flexible(child: Text(_searchError!, style: const TextStyle(fontSize: 12, color: AppTheme.error))),
                  ],
                ),
              ],
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSearching ? null : _searchUser,
                  child: _isSearching
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.search, size: 16),
                            SizedBox(width: 8),
                            Text('Find User'),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCreateForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Recipient card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: AppTheme.accentSubtle,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(LucideIcons.user, size: 20, color: AppTheme.accentPrimary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('RECIPIENT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.textTertiary, letterSpacing: 1)),
                      Text(_profile!['displayName'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => _profile = null),
                  child: const Text('Change', style: TextStyle(fontSize: 12, color: AppTheme.textTertiary)),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Secret input
        const Text('Secret Message', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        TextField(
          controller: _secretController,
          maxLines: 5,
          decoration: const InputDecoration(hintText: 'Enter your sensitive information...'),
        ),
        const SizedBox(height: 20),

        // File attachment
        if (_selectedFile == null)
          InkWell(
            onTap: _pickFile,
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                border: Border.all(color: AppTheme.borderDefault),
                borderRadius: BorderRadius.circular(16),
                color: AppTheme.bgSecondary,
              ),
              child: const Column(
                children: [
                  Icon(LucideIcons.uploadCloud, size: 28, color: AppTheme.accentPrimary),
                  SizedBox(height: 8),
                  Text('Tap to attach a file', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  SizedBox(height: 4),
                  Text('Images, videos, documents', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                ],
              ),
            ),
          )
        else
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppTheme.bgSecondary,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderDefault),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.fileText, color: AppTheme.accentPrimary),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_selectedFile!.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                      Text('${(_selectedFile!.size / 1024).toStringAsFixed(1)} KB', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                    ],
                  ),
                ),
                IconButton(icon: const Icon(LucideIcons.x, size: 18), onPressed: () => setState(() => _selectedFile = null)),
              ],
            ),
          ),

        const SizedBox(height: 20),

        // Expiry
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(children: [
                  Icon(LucideIcons.timer, size: 16, color: AppTheme.textSecondary),
                  SizedBox(width: 8),
                  Text('Expires in', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                ]),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _expiryOptions.entries.map((e) {
                    final isSelected = _expiryValue == e.key;
                    return GestureDetector(
                      onTap: () => setState(() => _expiryValue = e.key),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: isSelected ? AppTheme.accentPrimary : AppTheme.bgSecondary,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: isSelected ? AppTheme.accentPrimary : AppTheme.borderDefault),
                        ),
                        child: Text(e.value, style: TextStyle(
                          fontSize: 12, fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.white : AppTheme.textSecondary,
                        )),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 8),

        if (_createError != null) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.error.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.error.withValues(alpha: 0.2)),
            ),
            child: Row(children: [
              const Icon(LucideIcons.alertCircle, color: AppTheme.error, size: 18),
              const SizedBox(width: 10),
              Expanded(child: Text(_createError!, style: const TextStyle(color: AppTheme.error, fontSize: 13))),
            ]),
          ),
          const SizedBox(height: 8),
        ],

        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _isCreating ? null : _sendSecret,
          child: _isCreating
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.shield, size: 18),
                    SizedBox(width: 8),
                    Text('Encrypt & Send'),
                  ],
                ),
        ),
        const SizedBox(height: 12),
        Text(
          '🔒 Encrypted with AES-GCM. ${_profile?['displayName'] ?? 'Recipient'} will be the only one who can decrypt it.',
          style: const TextStyle(fontSize: 11, color: AppTheme.textTertiary),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildSuccess() {
    return Scaffold(
      appBar: AppBar(title: const Text('Sent!')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(LucideIcons.checkCircle2, size: 64, color: AppTheme.success),
            const SizedBox(height: 24),
            const Text('Secret Dropped!', textAlign: TextAlign.center, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(
              'Your message has been securely delivered to ${_profile?['displayName'] ?? 'the recipient'}\'s inbox.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.bgSecondary,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.borderDefault),
              ),
              child: SelectableText(
                _generatedLink!,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: AppTheme.accentPrimary),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: _generatedLink!));
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied!')));
              },
              icon: const Icon(LucideIcons.copy, size: 16),
              label: const Text('Copy Link'),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: _reset,
              child: const Text('Send Another →', style: TextStyle(color: AppTheme.textSecondary)),
            ),
          ],
        ),
      ),
    );
  }
}

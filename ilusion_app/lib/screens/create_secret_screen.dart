import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../utils/crypto_utils.dart';
import '../services/api_service.dart';
import '../services/auth_provider.dart';
import '../theme/app_theme.dart';

class CreateSecretScreen extends StatefulWidget {
  const CreateSecretScreen({super.key});

  @override
  State<CreateSecretScreen> createState() => _CreateSecretScreenState();
}

class _CreateSecretScreenState extends State<CreateSecretScreen> {
  final TextEditingController _secretController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _ipController = TextEditingController();
  final TextEditingController _aliasController = TextEditingController();
  double _expiryValue = 24; // Default 24 hours
  bool _isLoading = false;
  bool _showAdvanced = false;
  String? _generatedLink;
  String? _error;
  PlatformFile? _selectedFile;
  Map<String, dynamic>? _userProfile;
  double _uploadProgress = 0; // 0.0 to 1.0
  bool _useAlias = false;

  String? _lastAuthHash;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = context.watch<AuthProvider>();
    final authHash = '${auth.isSignedIn}_${auth.refreshCount}';

    if (_lastAuthHash != authHash) {
      _lastAuthHash = authHash;
      if (auth.isSignedIn) {
        _fetchProfile();
      } else {
        setState(() => _userProfile = null);
      }
    }
  }

  Future<void> _fetchProfile() async {
    try {
      final auth = context.read<AuthProvider>();
      final token = await auth.getToken();
      final profile = await ApiService.getProfile(token);
      if (mounted) setState(() => _userProfile = profile);
    } catch (e) {
      debugPrint('Error fetching profile: $e');
    }
  }

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

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.pickFiles(
        type: FileType.any,
        withData: true, // we need the bytes for upload
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (!mounted) return;
        final auth = context.read<AuthProvider>();
        final token = await auth.getToken();
        final limit = token != null ? 100 * 1024 * 1024 : 50 * 1024 * 1024;

        if (file.size > limit) {
          setState(() {
            _error = "File exceeds the ${limit / (1024 * 1024)}MB limit.";
          });
          return;
        }

        setState(() {
          _selectedFile = file;
          _error = null;
        });
      }
    } catch (e) {
      setState(() {
        _error = "Failed to pick file: $e";
      });
    }
  }

  void _createSecret() async {
    final text = _secretController.text.trim();
    if (text.isEmpty && _selectedFile == null) {
      setState(() => _error = "Please enter a secret or attach a file.");
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final auth = context.read<AuthProvider>();
      final token = await auth.getToken();

      String? fileKey;
      String? fileName;
      int? fileSize;
      String? fileType;

      // 1. Upload File if present
      if (_selectedFile != null) {
        fileName = _selectedFile!.name;
        fileSize = _selectedFile!.size;
        fileType = _selectedFile!.extension != null
            ? 'application/${_selectedFile!.extension}'
            : 'application/octet-stream';

        final presignRes = await ApiService.getPresignedUrl(
          fileName: fileName,
          fileSize: fileSize,
          fileType: fileType,
          token: token,
        );

        final String presignedUrl = presignRes['url'];
        fileKey = presignRes['fileKey'];

        // Get file bytes. On mobile, bytes might be null if file is large and path is used.
        List<int> fileBytes;
        if (_selectedFile!.bytes != null) {
          fileBytes = _selectedFile!.bytes!;
        } else if (_selectedFile!.path != null) {
          fileBytes = await File(_selectedFile!.path!).readAsBytes();
        } else {
          throw Exception("Could not read file data.");
        }

        if (!mounted) return;
        setState(() => _uploadProgress = 0.0);

        await ApiService.uploadFile(
          presignedUrl,
          fileBytes,
          fileType,
          onProgress: (p) {
            if (mounted) {
              setState(
                () => _uploadProgress = p * 0.9, // 0 to 90% is upload
              );
            }
          },
        );
        if (mounted) setState(() => _uploadProgress = 0.9);
      }

      String? encryptedContent;
      String? keyStr;

      // 2. Encrypt Text if present
      if (text.isNotEmpty && !_useAlias) {
        keyStr = await CryptoUtils.generateKey();
        encryptedContent = await CryptoUtils.encryptText(text, keyStr);
      } else {
        encryptedContent = text;
      }

      String? passwordHash;
      if (_passwordController.text.isNotEmpty) {
        passwordHash = CryptoUtils.hashPassword(_passwordController.text);
      }

      // 3. Send to API
      final response = await ApiService.createSecret(
        encryptedContent: encryptedContent,
        fileKey: fileKey,
        fileName: fileName,
        fileSize: fileSize,
        fileType: fileType,
        token: token,
        expiresInHours: _expiryValue.toInt() > 0 ? _expiryValue.toInt() : 1,
        passwordHash: passwordHash,
        allowedIp: _ipController.text.trim().isNotEmpty
            ? _ipController.text.trim()
            : null,
        isE2EE: text.isNotEmpty && !_useAlias,
        alias: _useAlias && _aliasController.text.trim().isNotEmpty
            ? _aliasController.text.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9-]'), '')
            : null,
      );

      final id = response['id'];
      final aliasUsed = _aliasController.text.trim().isNotEmpty
          ? _aliasController.text
              .trim()
              .toLowerCase()
              .replaceAll(RegExp(r'[^a-z0-9-]'), '')
          : null;

      // 4. Construct Link
      String link = aliasUsed != null
          ? 'https://www.ilusion.io/s/$aliasUsed'
          : 'https://www.ilusion.io/secret/$id';
      if (keyStr != null) {
        link += '#key=$keyStr';
      }

      setState(() {
        _generatedLink = link;
        _uploadProgress = 1.0;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_generatedLink != null) {
      return _buildSuccessView();
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Create Secret')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: AppTheme.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppTheme.error.withValues(alpha: 0.2),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.alertCircle, color: AppTheme.error),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(color: AppTheme.error),
                      ),
                    ),
                  ],
                ),
              ),

            if (_isLoading && _selectedFile != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _uploadProgress < 0.9
                              ? 'Uploading File...'
                              : 'Finalizing...',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        Text(
                          '${(_uploadProgress * 100).toInt()}%',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.accentPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: _uploadProgress,
                        backgroundColor: AppTheme.bgSecondary,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          AppTheme.accentPrimary,
                        ),
                        minHeight: 8,
                      ),
                    ),
                  ],
                ),
              ),

            TextField(
              controller: _secretController,
              maxLines: 6,
              style: const TextStyle(color: AppTheme.textPrimary),
              decoration: const InputDecoration(
                hintText: 'Enter your sensitive information here...',
              ),
            ),

            const SizedBox(height: 24),

            // File Attachment UI
            if (_selectedFile == null)
              InkWell(
                onTap: _pickFile,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: AppTheme.borderDefault,
                      style: BorderStyle.solid,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    color: AppTheme.bgSecondary,
                  ),
                  child: const Column(
                    children: [
                      Icon(
                        LucideIcons.uploadCloud,
                        size: 32,
                        color: AppTheme.accentPrimary,
                      ),
                      SizedBox(height: 12),
                      Text(
                        'Tap to attach a file',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Images, videos, documents',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.bgSecondary,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.borderDefault),
                ),
                child: Row(
                  children: [
                    const Icon(
                      LucideIcons.fileText,
                      color: AppTheme.accentPrimary,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _selectedFile!.name,
                            style: const TextStyle(fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            '${(_selectedFile!.size / 1024).toStringAsFixed(1)} KB',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.x, size: 20),
                      onPressed: () {
                        setState(() {
                          _selectedFile = null;
                        });
                      },
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 24),

            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(
                          LucideIcons.timer,
                          size: 18,
                          color: AppTheme.textSecondary,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Expires in',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Slider(
                      value:
                          _expiryOptions.keys
                                  .toList()
                                  .indexOf(_expiryValue)
                                  .toDouble() ==
                              -1
                          ? 5
                          : _expiryOptions.keys
                                .toList()
                                .indexOf(_expiryValue)
                                .toDouble(),
                      min: 0,
                      max: (_expiryOptions.length - 1).toDouble(),
                      divisions: _expiryOptions.length - 1,
                      activeColor: AppTheme.accentPrimary,
                      inactiveColor: AppTheme.borderDefault,
                      onChanged: (val) {
                        setState(() {
                          _expiryValue = _expiryOptions.keys
                              .toList()[val.toInt()];
                        });
                      },
                    ),
                    Center(
                      child: Text(
                        _expiryOptions[_expiryValue] ?? '24h',
                        style: const TextStyle(
                          color: AppTheme.accentPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Advanced Options Toggle
            InkWell(
              onTap: () => setState(() => _showAdvanced = !_showAdvanced),
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                child: Row(
                  children: [
                    Icon(
                      _showAdvanced
                          ? LucideIcons.chevronDown
                          : LucideIcons.chevronRight,
                      size: 18,
                      color: AppTheme.textTertiary,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Advanced Options',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textTertiary,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            if (_showAdvanced) ...[
              const SizedBox(height: 12),
              // Custom Alias Toggle
              SwitchListTile(
                title: const Text('Use Custom Alias', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                subtitle: const Text('Creates a clean, easy-to-type link', style: TextStyle(fontSize: 12)),
                value: _useAlias,
                activeColor: AppTheme.accentPrimary,
                onChanged: (val) => setState(() => _useAlias = val),
              ),
              if (_useAlias) ...[
                const SizedBox(height: 8),
                TextField(
                  controller: _aliasController,
                  decoration: const InputDecoration(
                    hintText: 'e.g. my-secret-link',
                    prefixIcon: Icon(LucideIcons.link, size: 18),
                  ),
                  onChanged: (val) {
                    final clean = val.toLowerCase().replaceAll(RegExp(r'[^a-z0-9-]'), '');
                    if (clean != val) {
                      _aliasController.value = TextEditingValue(
                        text: clean,
                        selection: TextSelection.collapsed(offset: clean.length),
                      );
                    }
                  },
                ),
              ],
              const SizedBox(height: 12),
              // Password (PRO/Login)
              TextField(
                controller: _passwordController,
                obscureText: true,
                enabled: _userProfile?['plan'] == 'pro',
                decoration: InputDecoration(
                  hintText: _userProfile?['plan'] == 'pro'
                      ? 'Password (Optional)'
                      : 'Password (PRO Only)',
                  prefixIcon: const Icon(LucideIcons.lock, size: 18),
                  suffixIcon: _userProfile?['plan'] != 'pro'
                      ? const Icon(LucideIcons.lock, color: AppTheme.textTertiary, size: 16)
                      : null,
                ),
              ),
              const SizedBox(height: 12),
              // IP Whitelist (PRO/Login)
              TextField(
                controller: _ipController,
                enabled: _userProfile?['plan'] == 'pro',
                decoration: InputDecoration(
                  hintText: _userProfile?['plan'] == 'pro'
                      ? 'Allowed IP (Optional)'
                      : 'Allowed IP (PRO Only)',
                  prefixIcon: const Icon(LucideIcons.mapPin, size: 18),
                  suffixIcon: _userProfile?['plan'] != 'pro'
                      ? const Icon(LucideIcons.lock, color: AppTheme.textTertiary, size: 16)
                      : null,
                ),
              ),
              const SizedBox(height: 12),
            ],

            const SizedBox(height: 32),

            ElevatedButton(
              onPressed: _isLoading ? null : _createSecret,
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(LucideIcons.lock, size: 18),
                        SizedBox(width: 8),
                        Text('Create Secure Link'),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessView() {
    return Scaffold(
      appBar: AppBar(title: const Text('Success')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(
              LucideIcons.checkCircle2,
              size: 64,
              color: AppTheme.success,
            ),
            const SizedBox(height: 24),
            const Text(
              'Your secret is ready.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Share this link. It will self-destruct after being viewed.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.bgSecondary,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.borderDefault),
              ),
              child: SelectableText(
                _generatedLink!,
                style: const TextStyle(
                  color: AppTheme.textPrimary,
                  fontFamily: 'monospace',
                  fontSize: 13,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 24),
            Center(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: QrImageView(
                  data: _generatedLink!,
                  version: QrVersions.auto,
                  size: 200.0,
                  gapless: false,
                  dataModuleStyle: const QrDataModuleStyle(
                    dataModuleShape: QrDataModuleShape.square,
                    color: Colors.black,
                  ),
                  eyeStyle: const QrEyeStyle(
                    eyeShape: QrEyeShape.square,
                    color: Colors.black,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: _generatedLink!));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Link copied to clipboard')),
                );
              },
              child: const Text('Copy Link'),
            ),
            TextButton(
              onPressed: () {
                setState(() {
                  _generatedLink = null;
                  _secretController.clear();
                  _selectedFile = null;
                });
              },
              child: const Text('Create Another',
                  style: TextStyle(color: AppTheme.textSecondary)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _secretController.dispose();
    _passwordController.dispose();
    _ipController.dispose();
    _aliasController.dispose();
    super.dispose();
  }
}

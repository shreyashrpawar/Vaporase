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

class CreateSecretScreen extends StatefulWidget {
  const CreateSecretScreen({super.key});

  @override
  State<CreateSecretScreen> createState() => _CreateSecretScreenState();
}

class _CreateSecretScreenState extends State<CreateSecretScreen> {
  final TextEditingController _secretController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _ipController = TextEditingController();
  double _expiryValue = 24; // Default 24 hours
  bool _isLoading = false;
  bool _showAdvanced = false;
  String? _generatedLink;
  String? _error;
  PlatformFile? _selectedFile;
  Map<String, dynamic>? _userProfile;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
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

        await ApiService.uploadFile(presignedUrl, fileBytes, fileType);
      }

      String? encryptedContent;
      String? keyStr;

      // 2. Encrypt Text if present
      if (text.isNotEmpty) {
        keyStr = await CryptoUtils.generateKey();
        encryptedContent = await CryptoUtils.encryptText(text, keyStr);
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
        allowedIp: _ipController.text.trim().isNotEmpty ? _ipController.text.trim() : null,
        isE2EE: text.isNotEmpty,
      );

      final id = response['id'];
      
      // 4. Construct Link
      String link = 'https://www.ilusion.io/secret/$id';
      if (keyStr != null) {
        link += '#key=$keyStr';
      }
      
      setState(() {
        _generatedLink = link;
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
      appBar: AppBar(
        title: const Text('Create Secret'),
      ),
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
                  border: Border.all(color: AppTheme.error.withValues(alpha: 0.2)),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.alertCircle, color: AppTheme.error),
                    const SizedBox(width: 12),
                    Expanded(child: Text(_error!, style: const TextStyle(color: AppTheme.error))),
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
                    border: Border.all(color: AppTheme.borderDefault, style: BorderStyle.solid),
                    borderRadius: BorderRadius.circular(16),
                    color: AppTheme.bgSecondary,
                  ),
                  child: const Column(
                    children: [
                      Icon(LucideIcons.uploadCloud, size: 32, color: AppTheme.accentPrimary),
                      SizedBox(height: 12),
                      Text('Tap to attach a file', style: TextStyle(fontWeight: FontWeight.bold)),
                      SizedBox(height: 4),
                      Text('Images, videos, documents', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                    ],
                  ),
                ),
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
                          Text(_selectedFile!.name, style: const TextStyle(fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                          Text('${(_selectedFile!.size / 1024).toStringAsFixed(1)} KB', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
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
                    )
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
                        Icon(LucideIcons.timer, size: 18, color: AppTheme.textSecondary),
                        SizedBox(width: 8),
                        Text('Expires in', style: TextStyle(fontWeight: FontWeight.w600)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Slider(
                      value: _expiryOptions.keys.toList().indexOf(_expiryValue).toDouble() == -1 ? 5 : _expiryOptions.keys.toList().indexOf(_expiryValue).toDouble(),
                      min: 0,
                      max: (_expiryOptions.length - 1).toDouble(),
                      divisions: _expiryOptions.length - 1,
                      activeColor: AppTheme.accentPrimary,
                      inactiveColor: AppTheme.borderDefault,
                      onChanged: (val) {
                        setState(() {
                          _expiryValue = _expiryOptions.keys.toList()[val.toInt()];
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
                    Icon(_showAdvanced ? LucideIcons.chevronDown : LucideIcons.chevronRight, size: 18, color: AppTheme.textTertiary),
                    const SizedBox(width: 8),
                    const Text('Advanced Options', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textTertiary)),
                  ],
                ),
              ),
            ),

            if (_showAdvanced) ...[
              const SizedBox(height: 12),
              // Password
              TextField(
                controller: _passwordController,
                obscureText: true,
                enabled: _userProfile?['plan'] == 'pro',
                decoration: InputDecoration(
                  hintText: _userProfile?['plan'] == 'pro' ? 'Password (Optional)' : 'Password (PRO Only)',
                  prefixIcon: const Icon(LucideIcons.lock, size: 18),
                  suffixIcon: _userProfile?['plan'] != 'pro' 
                    ? const Icon(LucideIcons.crown, color: AppTheme.accentPrimary, size: 16) 
                    : null,
                ),
              ),
              const SizedBox(height: 12),
              // IP Whitelist
              TextField(
                controller: _ipController,
                enabled: _userProfile?['plan'] == 'pro',
                decoration: InputDecoration(
                  hintText: _userProfile?['plan'] == 'pro' ? 'Allowed IP (Optional)' : 'Allowed IP (PRO Only)',
                  prefixIcon: const Icon(LucideIcons.mapPin, size: 18),
                  suffixIcon: _userProfile?['plan'] != 'pro' 
                    ? const Icon(LucideIcons.crown, color: AppTheme.accentPrimary, size: 16) 
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
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)
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
      appBar: AppBar(
        title: const Text('Success'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(LucideIcons.checkCircle2, size: 64, color: AppTheme.success),
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
                style: const TextStyle(color: AppTheme.textPrimary, fontFamily: 'monospace'),
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
              child: const Text('Create Another', style: TextStyle(color: AppTheme.textSecondary)),
            ),
          ],
        ),
      ),
    );
  }
}

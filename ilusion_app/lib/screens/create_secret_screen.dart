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
        await ApiService.uploadFile(
          presignedUrl,
          fileBytes,
          fileType,
          onProgress: (p) {
            // Progress tracking not visualized yet
          },
        );
      }

      String? encryptedContent;
      String? keyStr;

      final bool isUsingAlias = _aliasController.text.trim().isNotEmpty;

      // 2. Encrypt Text if present
      if (text.isNotEmpty && !isUsingAlias) {
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
        isE2EE: text.isNotEmpty && !isUsingAlias,
        alias: isUsingAlias ? _aliasController.text.trim().toLowerCase() : null,
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
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: const Text('NEW SECRET'),
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.only(right: 16.0),
              child: Center(
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Welcome / Instruction Header
            const Text(
              'Share sensitive data securely.',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.8,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Encrypted links automatically self-destruct after they are viewed.',
              style: TextStyle(
                fontSize: 13,
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 32),

            if (_error != null)
              Container(
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: AppTheme.error.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.error.withValues(alpha: 0.1)),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.alertCircle, color: AppTheme.error, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(color: AppTheme.error, fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),

            // Content Section
            const _SectionHeader(title: 'SECRET CONTENT', icon: LucideIcons.fileText),
            const SizedBox(height: 12),
            Container(
              decoration: AppTheme.cardDecoration,
              child: Column(
                children: [
                  TextField(
                    controller: _secretController,
                    maxLines: 5,
                    style: const TextStyle(fontSize: 15, height: 1.5),
                    decoration: InputDecoration(
                      hintText: 'Type or paste your secret message here...',
                      fillColor: Colors.transparent,
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: const EdgeInsets.all(20),
                    ),
                  ),
                  
                  // File Attachment Inline
                  if (_selectedFile != null)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.bgTertiary,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            const Icon(LucideIcons.file, size: 18, color: AppTheme.accentPrimary),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(_selectedFile!.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                                  Text('${(_selectedFile!.size / 1024).toStringAsFixed(1)} KB', style: const TextStyle(fontSize: 10, color: AppTheme.textTertiary)),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(LucideIcons.x, size: 16),
                              onPressed: () => setState(() => _selectedFile = null),
                              visualDensity: VisualDensity.compact,
                            ),
                          ],
                        ),
                      ),
                    ),
                  
                  if (_selectedFile == null)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      child: InkWell(
                        onTap: _pickFile,
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            border: Border.all(color: AppTheme.borderDefault, width: 1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.paperclip, size: 16, color: AppTheme.textSecondary),
                              SizedBox(width: 8),
                              Text('Attach a file', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Security Section
            const _SectionHeader(title: 'SECURITY SETTINGS', icon: LucideIcons.shieldCheck),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: AppTheme.cardDecoration,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(LucideIcons.clock, size: 16, color: AppTheme.textSecondary),
                      const SizedBox(width: 8),
                      const Text('Expiry Time', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const Spacer(),
                      Text(
                        _expiryOptions[_expiryValue] ?? '24h',
                        style: const TextStyle(color: AppTheme.accentPrimary, fontWeight: FontWeight.w900, fontSize: 13),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  SliderTheme(
                    data: SliderThemeData(
                      trackHeight: 4,
                      activeTrackColor: AppTheme.accentPrimary,
                      inactiveTrackColor: AppTheme.bgTertiary,
                      thumbColor: Colors.white,
                      overlayColor: AppTheme.accentPrimary.withValues(alpha: 0.1),
                    ),
                    child: Slider(
                      value: _expiryOptions.keys.toList().indexOf(_expiryValue).toDouble(),
                      min: 0,
                      max: (_expiryOptions.length - 1).toDouble(),
                      divisions: _expiryOptions.length - 1,
                      onChanged: (val) {
                        setState(() => _expiryValue = _expiryOptions.keys.toList()[val.toInt()]);
                      },
                    ),
                  ),
                  
                  const Divider(height: 32, color: AppTheme.borderSubtle),
                  
                  // Advanced Toggle Header
                  InkWell(
                    onTap: () => setState(() => _showAdvanced = !_showAdvanced),
                    child: Row(
                      children: [
                        const Text('Advanced Protection', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        const Spacer(),
                        Icon(
                          _showAdvanced ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                          size: 16,
                          color: AppTheme.textTertiary,
                        ),
                      ],
                    ),
                  ),
                  
                  if (_showAdvanced) ...[
                    const SizedBox(height: 20),
                    _CustomInputField(
                      controller: _aliasController,
                      label: 'CUSTOM ALIAS',
                      icon: LucideIcons.link,
                      hint: 'e.g. secret-message',
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
                    const SizedBox(height: 16),
                    _CustomInputField(
                      controller: _passwordController,
                      label: 'PASSWORD PROTECTION',
                      icon: LucideIcons.key,
                      hint: _userProfile?['plan'] == 'pro' ? 'Optional password' : 'PRO Feature Only',
                      obscureText: true,
                      enabled: _userProfile?['plan'] == 'pro',
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 40),

            // Submit Button
            ElevatedButton(
              onPressed: _isLoading ? null : _createSecret,
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                    )
                  : const Text('GENERATE SECURE LINK'),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessView() {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: const Text('SECRET READY'),
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft),
          onPressed: () => setState(() => _generatedLink = null),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 20),
            Center(
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.success.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  LucideIcons.checkCircle2,
                  size: 48,
                  color: AppTheme.success,
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Secure link generated.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.8),
            ),
            const SizedBox(height: 8),
            const Text(
              'Share this link with your recipient. It will be deleted permanently after the first view.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13, fontWeight: FontWeight.w500),
            ),
            
            const SizedBox(height: 40),
            
            const _SectionHeader(title: 'SHAREABLE LINK', icon: LucideIcons.link),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: AppTheme.cardDecoration,
              child: Column(
                children: [
                  SelectableText(
                    _generatedLink!,
                    style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontFamily: 'monospace',
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: _generatedLink!));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Link copied to clipboard')),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 50),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(LucideIcons.copy, size: 16),
                        SizedBox(width: 10),
                        Text('COPY LINK'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            const _SectionHeader(title: 'QR CODE', icon: LucideIcons.qrCode),
            const SizedBox(height: 12),
            Center(
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: AppTheme.cardDecoration,
                child: QrImageView(
                  data: _generatedLink!,
                  version: QrVersions.auto,
                  size: 180.0,
                  gapless: false,
                  dataModuleStyle: const QrDataModuleStyle(
                    dataModuleShape: QrDataModuleShape.square,
                    color: AppTheme.textPrimary,
                  ),
                  eyeStyle: const QrEyeStyle(
                    eyeShape: QrEyeShape.square,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 48),
            
            TextButton(
              onPressed: () {
                setState(() {
                  _generatedLink = null;
                  _secretController.clear();
                  _selectedFile = null;
                  _passwordController.clear();
                  _aliasController.clear();
                  _ipController.clear();
                });
              },
              child: const Text(
                'CREATE ANOTHER SECRET',
                style: TextStyle(
                  color: AppTheme.accentPrimary,
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                  letterSpacing: 1,
                ),
              ),
            ),
            const SizedBox(height: 24),
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

class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData icon;
  const _SectionHeader({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppTheme.textTertiary),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: AppTheme.textTertiary,
            letterSpacing: 1.2,
          ),
        ),
      ],
    );
  }
}

class _CustomInputField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final bool obscureText;
  final bool enabled;
  final Function(String)? onChanged;

  const _CustomInputField({
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    this.obscureText = false,
    this.enabled = true,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.textSecondary)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: obscureText,
          enabled: enabled,
          onChanged: onChanged,
          style: const TextStyle(fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, size: 16),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }
}


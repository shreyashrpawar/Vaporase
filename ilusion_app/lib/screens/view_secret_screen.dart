import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../utils/crypto_utils.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class ViewSecretScreen extends StatefulWidget {
  final String? initialUrl;
  const ViewSecretScreen({super.key, this.initialUrl});

  @override
  State<ViewSecretScreen> createState() => _ViewSecretScreenState();
}

class _ViewSecretScreenState extends State<ViewSecretScreen> {
  final TextEditingController _urlController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _requirePassword = false;
  bool _obscurePassword = true;
  String? _error;
  String? _decryptedSecret;
  
  String? _fileUrl;
  String? _fileName;
  int? _fileSize;

  @override
  void initState() {
    super.initState();
    if (widget.initialUrl != null) {
      _urlController.text = widget.initialUrl!;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _fetchAndDecrypt();
      });
    }
  }

  void _fetchAndDecrypt() async {
    final urlStr = _urlController.text.trim();
    if (urlStr.isEmpty) {
      setState(() => _error = "Please enter a valid Ilusion URL.");
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
      _decryptedSecret = null;
      _fileUrl = null;
      _fileName = null;
      _fileSize = null;
    });

    try {
      final uri = Uri.parse(urlStr);
      final segments = uri.pathSegments;
      
      if (segments.length < 2 || segments[0] != 'secret') {
        throw Exception('Invalid secret URL format.');
      }
      
      final id = segments[1];
      
      String? keyStr;
      if (uri.hasFragment && uri.fragment.startsWith('key=')) {
        keyStr = uri.fragment.substring(4);
      }

      String? passwordHash;
      if (_passwordController.text.isNotEmpty) {
        passwordHash = await CryptoUtils.hashPassword(_passwordController.text);
      }

      final response = await ApiService.getSecret(id, passwordHash: passwordHash);
      final encryptedContent = response['encryptedContent'];
      final serverDropKey = response['dropKey']; // Key for "Drop" secrets
      
      _fileUrl = response['fileUrl'];
      _fileName = response['fileName'];
      _fileSize = response['fileSize'];

      if (encryptedContent == null && _fileUrl == null) {
        throw Exception('No content found in this secret.');
      }

      if (encryptedContent != null) {
        // Priority: 1. URL Fragment (#key=), 2. Server stored key (dropKey)
        final effectiveKey = keyStr ?? serverDropKey;

        if (effectiveKey != null) {
          final decrypted = await CryptoUtils.decryptText(encryptedContent, effectiveKey);
          setState(() {
            _decryptedSecret = decrypted;
            _requirePassword = false;
          });
        } else {
          throw Exception('Decryption key missing. If this is a standard secret, ensure the URL contains the #key= fragment.');
        }
      } else {
        setState(() {
          _requirePassword = false;
        });
      }

    } catch (e) {
      final errorStr = e.toString().replaceAll('Exception: ', '');
      if (errorStr == 'Password required') {
        setState(() {
          _requirePassword = true;
          _error = 'This secret is password protected.';
        });
      } else {
        setState(() {
          _error = errorStr;
          _requirePassword = false;
        });
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  Future<void> _downloadFile() async {
    if (_fileUrl != null) {
      final uri = Uri.parse(_fileUrl!);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        setState(() {
          _error = "Could not launch download URL.";
        });
      }
    }
  }

  void _scanQR() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: const BoxDecoration(
            color: AppTheme.bgPrimary,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              const SizedBox(height: 16),
              Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.borderDefault, borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 16),
              const Text('Scan Secret QR Code', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: MobileScanner(
                    onDetect: (capture) {
                      final List<Barcode> barcodes = capture.barcodes;
                      if (barcodes.isNotEmpty && barcodes.first.rawValue != null) {
                        final String code = barcodes.first.rawValue!;
                        if (code.startsWith('https://www.ilusion.io/secret/') || code.startsWith('https://ilusion.io/secret/')) {
                          Navigator.pop(context);
                          setState(() {
                            _urlController.text = code;
                            _requirePassword = false;
                          });
                          _fetchAndDecrypt();
                        }
                      }
                    },
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_decryptedSecret != null || _fileUrl != null) {
      return _buildSecretView();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('View Secret'),
      ),
      body: Padding(
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

            const Text(
              'Paste Secure Link',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Once you view this secret, it will be permanently destroyed.',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
            ),
            const SizedBox(height: 24),

            TextField(
              controller: _urlController,
              style: const TextStyle(color: AppTheme.textPrimary),
              decoration: InputDecoration(
                hintText: 'https://www.ilusion.io/secret/...',
                prefixIcon: const Icon(LucideIcons.link, color: AppTheme.textTertiary),
                suffixIcon: IconButton(
                  icon: const Icon(LucideIcons.qrCode, color: AppTheme.accentPrimary),
                  onPressed: _scanQR,
                  tooltip: 'Scan QR Code',
                ),
              ),
              onChanged: (_) {
                if (_requirePassword) setState(() => _requirePassword = false);
              },
            ),
            
            if (_requirePassword) ...[
              const SizedBox(height: 20),
              const Text(
                'Password Required',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                style: const TextStyle(color: AppTheme.textPrimary),
                decoration: InputDecoration(
                  hintText: 'Enter secret password...',
                  prefixIcon: const Icon(LucideIcons.lock, color: AppTheme.textTertiary),
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye, color: AppTheme.textTertiary, size: 20),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 32),

            ElevatedButton(
              onPressed: _isLoading ? null : _fetchAndDecrypt,
              child: _isLoading 
                ? const SizedBox(
                    width: 20, 
                    height: 20, 
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(_requirePassword ? LucideIcons.unlock : LucideIcons.eye, size: 18),
                      const SizedBox(width: 8),
                      Text(_requirePassword ? 'Unlock Secret' : 'Reveal Secret'),
                    ],
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSecretView() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Secret Revealed'),
        leading: IconButton(
          icon: const Icon(LucideIcons.x),
          onPressed: () {
            setState(() {
              _decryptedSecret = null;
              _fileUrl = null;
              _urlController.clear();
            });
          },
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(100),
                border: Border.all(color: AppTheme.error.withValues(alpha: 0.2)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.flame, color: AppTheme.error, size: 16),
                  SizedBox(width: 8),
                  Text('Burned from database', style: TextStyle(color: AppTheme.error, fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            if (_decryptedSecret != null) ...[
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.bgSecondary,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderDefault),
                ),
                child: SelectableText(
                  _decryptedSecret!,
                  style: const TextStyle(color: AppTheme.textPrimary, fontSize: 16, height: 1.5),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: _decryptedSecret!));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Copied to clipboard')),
                  );
                },
                icon: const Icon(LucideIcons.copy, size: 18),
                label: const Text('Copy to Clipboard'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.bgTertiary,
                  foregroundColor: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 24),
            ],

            if (_fileUrl != null) ...[
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.bgSecondary,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderDefault),
                ),
                child: Column(
                  children: [
                    const Icon(LucideIcons.fileBox, size: 48, color: AppTheme.accentPrimary),
                    const SizedBox(height: 16),
                    Text(
                      _fileName ?? 'Attached File', 
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      textAlign: TextAlign.center,
                    ),
                    if (_fileSize != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        '${(_fileSize! / 1024 / 1024).toStringAsFixed(2)} MB',
                        style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14),
                      ),
                    ],
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: _downloadFile,
                      icon: const Icon(LucideIcons.download, size: 18),
                      label: const Text('Download File'),
                    ),
                  ],
                ),
              )
            ]
          ],
        ),
      ),
    );
  }
}

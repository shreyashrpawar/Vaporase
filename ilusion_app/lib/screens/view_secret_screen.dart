import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
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
  final TextEditingController _aliasController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _revealByAlias = false;
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
    String id;
    String? keyStr;
    
    if (_revealByAlias) {
      final aliasStr = _aliasController.text.trim();
      if (aliasStr.isEmpty) {
        setState(() => _error = "Please enter an alias.");
        return;
      }
      id = aliasStr;
    } else {
      final urlStr = _urlController.text.trim();
      if (urlStr.isEmpty) {
        setState(() => _error = "Please enter a valid Ilusion URL.");
        return;
      }

      try {
        final uri = Uri.parse(urlStr);
        final segments = uri.pathSegments;
        
        if (segments.length < 2 || (segments[0] != 'secret' && segments[0] != 's')) {
          throw Exception('Invalid secret URL format.');
        }
        
        id = segments[1];
        
        if (uri.hasFragment && uri.fragment.startsWith('key=')) {
          keyStr = uri.fragment.substring(4);
        }
      } catch (e) {
        setState(() => _error = "Invalid URL format.");
        return;
      }
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
      String? passwordHash;
      if (_passwordController.text.isNotEmpty) {
        passwordHash = CryptoUtils.hashPassword(_passwordController.text);
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

      final bool isE2EE = response['isE2EE'] ?? true;

      if (encryptedContent != null) {
        if (!isE2EE) {
          // If not E2EE, the content is plain text
          setState(() {
            _decryptedSecret = encryptedContent;
            _requirePassword = false;
          });
        } else {
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
    if (_fileUrl == null) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await http.get(Uri.parse(_fileUrl!));
      if (response.statusCode == 200) {
        final directory = await getApplicationDocumentsDirectory();
        final filePath = '${directory.path}/${_fileName ?? 'file'}';
        final file = File(filePath);
        await file.writeAsBytes(response.bodyBytes);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Downloaded: $_fileName')),
          );
        }

        // Open the file
        await OpenFilex.open(filePath);
      } else {
        throw Exception('Download failed with status: ${response.statusCode}');
      }
    } catch (e) {
      setState(() {
        _error = "Could not download file: $e";
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
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
                        if (code.startsWith('https://www.ilusion.io/secret/') || 
                            code.startsWith('https://ilusion.io/secret/') ||
                            code.startsWith('https://www.ilusion.io/s/') || 
                            code.startsWith('https://ilusion.io/s/')) {
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

            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _revealByAlias = false),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: !_revealByAlias ? AppTheme.accentPrimary : Colors.transparent,
                            width: 2,
                          ),
                        ),
                      ),
                      child: Text(
                        'Reveal by Link',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: !_revealByAlias ? AppTheme.textPrimary : AppTheme.textTertiary,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _revealByAlias = true),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: _revealByAlias ? AppTheme.accentPrimary : Colors.transparent,
                            width: 2,
                          ),
                        ),
                      ),
                      child: Text(
                        'Reveal by Alias',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: _revealByAlias ? AppTheme.textPrimary : AppTheme.textTertiary,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            if (!_revealByAlias) ...[
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
            ] else ...[
              const Text(
                'Enter Custom Alias',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Direct access via human-readable identifiers.',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
              ),
              const SizedBox(height: 24),

              TextField(
                controller: _aliasController,
                style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold),
                decoration: const InputDecoration(
                  prefixText: 'ilusion.io/s/',
                  prefixStyle: TextStyle(color: AppTheme.accentPrimary, fontWeight: FontWeight.bold),
                  hintText: 'alias-name',
                ),
                onChanged: (_) {
                  if (_requirePassword) setState(() => _requirePassword = false);
                },
              ),
            ],
            
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
  @override
  void dispose() {
    _urlController.dispose();
    _aliasController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}

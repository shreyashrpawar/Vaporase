import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_provider.dart';
import '../theme/app_theme.dart';

class SecretsScreen extends StatefulWidget {
  const SecretsScreen({super.key});

  @override
  State<SecretsScreen> createState() => _SecretsScreenState();
}

class _SecretsScreenState extends State<SecretsScreen> {
  List<dynamic> _secrets = [];
  bool _isLoading = true;
  String? _error;

  String? _lastAuthHash;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = context.watch<AuthProvider>();
    final authHash = '${auth.isSignedIn}_${auth.refreshCount}';

    if (_lastAuthHash != authHash) {
      final isRefresh = _lastAuthHash != null && _lastAuthHash!.split('_')[0] == 'true' && auth.isSignedIn;
      _lastAuthHash = authHash;

      if (auth.isSignedIn) {
        if (isRefresh) {
          Future.delayed(const Duration(seconds: 1), () => _fetchSecrets());
        } else {
          _fetchSecrets();
        }
      } else {
        setState(() => _secrets = []);
      }
    }
  }

  Future<void> _fetchSecrets() async {
    try {
      setState(() { _isLoading = true; _error = null; });
      final auth = context.read<AuthProvider>();
      final token = await auth.getToken();
      final secrets = await ApiService.getDashboardSecrets(token);
      setState(() => _secrets = secrets);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _revokeSecret(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgSecondary,
        title: const Text('Revoke Secret'),
        content: const Text('Revoke this secret? It will be permanently destroyed.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Revoke', style: TextStyle(color: AppTheme.error)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      if (!mounted) return;
      final auth = context.read<AuthProvider>();
      final token = await auth.getToken();
      await ApiService.revokeSecret(id, token);
      setState(() {
        final index = _secrets.indexWhere((s) => s['id'] == id);
        if (index != -1) _secrets[index]['status'] = 'revoked';
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final active = _secrets.where((s) => s['status'] == 'active').toList();
    final past = _secrets.where((s) => s['status'] != 'active').toList();

    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: const Text('VAULT'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw, size: 18),
            onPressed: _fetchSecrets,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
          : _error != null
              ? _buildError()
              : RefreshIndicator(
                  onRefresh: _fetchSecrets,
                  displacement: 20,
                  color: AppTheme.accentPrimary,
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                    children: [
                      _buildSectionHeader('ACTIVE SECRETS', active.length, LucideIcons.shield, AppTheme.accentPrimary),
                      const SizedBox(height: 16),
                      if (active.isEmpty)
                        _buildEmpty('You have no active secrets.', LucideIcons.shield)
                      else
                        ...active.map(_buildActiveSecret),

                      const SizedBox(height: 40),

                      _buildSectionHeader('AUDIT LOG', past.length, LucideIcons.history, AppTheme.textTertiary),
                      const SizedBox(height: 16),
                      if (past.isEmpty)
                        _buildEmpty('No historical activity found.', LucideIcons.history)
                      else
                        ...past.map(_buildPastSecret),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(LucideIcons.alertTriangle, size: 48, color: AppTheme.error),
            const SizedBox(height: 16),
            Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.error, fontWeight: FontWeight.w600)),
            const SizedBox(height: 24),
            ElevatedButton(onPressed: _fetchSecrets, child: const Text('RETRY')),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, int count, IconData icon, Color color) {
    return Row(
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w900,
            color: color == AppTheme.accentPrimary ? AppTheme.textPrimary : AppTheme.textTertiary,
            letterSpacing: 1.2,
          ),
        ),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
          child: Text('$count', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: color)),
        ),
      ],
    );
  }

  Widget _buildEmpty(String text, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48),
      decoration: AppTheme.cardDecoration,
      child: Center(
        child: Column(
          children: [
            Icon(icon, size: 32, color: AppTheme.bgTertiary),
            const SizedBox(height: 16),
            Text(
              text,
              style: const TextStyle(fontSize: 13, color: AppTheme.textTertiary, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveSecret(dynamic secret) {
    final id = secret['id'] ?? '';
    final isE2EE = secret['isE2EE'] == true;
    final hasPassword = secret['hasPassword'] == true;
    final hasIp = secret['hasIpWhitelist'] == true;
    final expiresAt = DateTime.tryParse(secret['expiresAt'] ?? '');
    final fileName = secret['fileName'];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: AppTheme.cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    id,
                    style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: -0.5),
                  ),
                ),
                IconButton(
                  icon: const Icon(LucideIcons.trash2, size: 16, color: AppTheme.error),
                  onPressed: () => _revokeSecret(id),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.borderSubtle),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (isE2EE) _badge('E2EE', AppTheme.accentPrimary),
                    if (hasPassword) _badge('PASSWORD', const Color(0xFFEAB308)),
                    if (hasIp) _badge('IP LOCK', const Color(0xFF60A5FA)),
                    if (!isE2EE && !hasPassword && !hasIp) 
                      Text('STANDARD SECURITY', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: AppTheme.textTertiary, letterSpacing: 0.5)),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    if (expiresAt != null) ...[
                      const Icon(LucideIcons.timer, size: 14, color: AppTheme.textTertiary),
                      const SizedBox(width: 6),
                      Text(
                        'Expires ${expiresAt.day}/${expiresAt.month} ${expiresAt.hour}:${expiresAt.minute.toString().padLeft(2, '0')}',
                        style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
                      ),
                    ],
                    if (fileName != null) ...[
                      const Spacer(),
                      const Icon(LucideIcons.paperclip, size: 14, color: AppTheme.textTertiary),
                      const SizedBox(width: 6),
                      Text('FILE ATTACHED', style: const TextStyle(fontSize: 11, color: AppTheme.accentPrimary, fontWeight: FontWeight.w900)),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      margin: const EdgeInsets.only(right: 6),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(text, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: color, letterSpacing: 0.5)),
    );
  }

  Widget _buildPastSecret(dynamic secret) {
    final isBurned = secret['status'] == 'burned';
    final createdAt = DateTime.tryParse(secret['createdAt'] ?? '');
    final id = secret['id'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: AppTheme.cardDecoration.copyWith(
        color: Colors.white.withValues(alpha: 0.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    id,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      decoration: TextDecoration.lineThrough,
                      color: AppTheme.textTertiary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (createdAt != null)
                    Text(
                      'Created ${createdAt.day}/${createdAt.month}/${createdAt.year}',
                      style: const TextStyle(fontSize: 10, color: AppTheme.textTertiary, fontWeight: FontWeight.w500),
                    ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isBurned ? AppTheme.success.withValues(alpha: 0.08) : AppTheme.error.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(isBurned ? LucideIcons.check : LucideIcons.x, size: 10, color: isBurned ? AppTheme.success : AppTheme.error),
                  const SizedBox(width: 4),
                  Text(
                    isBurned ? 'BURNED' : 'REVOKED',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: isBurned ? AppTheme.success : AppTheme.error),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

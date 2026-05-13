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
      appBar: AppBar(title: const Text('Secrets')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!, style: const TextStyle(color: AppTheme.error)),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _fetchSecrets, child: const Text('Retry')),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchSecrets,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Active section
                      _buildSectionHeader('Active', active.length, LucideIcons.shield, AppTheme.accentPrimary),
                      const SizedBox(height: 12),
                      if (active.isEmpty)
                        _buildEmpty('No active secrets', LucideIcons.shield)
                      else
                        ...active.map(_buildActiveSecret),

                      const SizedBox(height: 32),

                      // Audit log
                      _buildSectionHeader('Audit Log', past.length, LucideIcons.clock, AppTheme.textTertiary),
                      const SizedBox(height: 12),
                      if (past.isEmpty)
                        _buildEmpty('No history yet', LucideIcons.clock)
                      else
                        ...past.map(_buildPastSecret),
                    ],
                  ),
                ),
    );
  }

  Widget _buildSectionHeader(String title, int count, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.bgSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Text('$title ($count)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color == AppTheme.textTertiary ? AppTheme.textTertiary : AppTheme.textPrimary)),
        ],
      ),
    );
  }

  Widget _buildEmpty(String text, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(48),
      decoration: BoxDecoration(
        color: AppTheme.bgSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderDefault),
      ),
      child: Column(
        children: [
          Icon(icon, size: 32, color: AppTheme.textTertiary),
          const SizedBox(height: 12),
          Text(text, style: const TextStyle(fontSize: 13, color: AppTheme.textTertiary)),
        ],
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

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(id, style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 12)),
                      if (isE2EE) _badge('E2EE', AppTheme.accentPrimary),
                      if (hasPassword) _badge('Locked', const Color(0xFFEAB308)),
                      if (hasIp) _badge('IP', const Color(0xFF60A5FA)),
                    ],
                  ),
                ),
                TextButton.icon(
                  onPressed: () => _revokeSecret(id),
                  icon: const Icon(LucideIcons.trash2, size: 14, color: AppTheme.error),
                  label: const Text('Revoke', style: TextStyle(color: AppTheme.error, fontSize: 12)),
                  style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                if (expiresAt != null) ...[
                  const Icon(LucideIcons.clock, size: 12, color: AppTheme.textTertiary),
                  const SizedBox(width: 4),
                  Text(expiresAt.toLocal().toString().split('.')[0], style: const TextStyle(fontSize: 11, color: AppTheme.textTertiary)),
                ],
                if (fileName != null) ...[
                  const SizedBox(width: 12),
                  const Icon(LucideIcons.fileText, size: 12, color: AppTheme.textTertiary),
                  const SizedBox(width: 4),
                  Text(fileName, style: const TextStyle(fontSize: 11, color: AppTheme.textTertiary)),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(text, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color)),
    );
  }

  Widget _buildPastSecret(dynamic secret) {
    final isBurned = secret['status'] == 'burned';
    final createdAt = DateTime.tryParse(secret['createdAt'] ?? '');
    final readAt = secret['readAt'] != null ? DateTime.tryParse(secret['readAt']) : null;
    final readByIp = secret['readByIp'];

    return Opacity(
      opacity: 0.6,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.bgSecondary,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.borderSubtle),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      secret['id'] ?? '',
                      style: const TextStyle(fontFamily: 'monospace', fontSize: 12, decoration: TextDecoration.lineThrough, color: AppTheme.textTertiary),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: isBurned ? AppTheme.accentPrimary.withValues(alpha: 0.15) : AppTheme.error.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(isBurned ? LucideIcons.checkCircle2 : LucideIcons.xCircle, size: 12, color: isBurned ? AppTheme.accentPrimary : AppTheme.error),
                          const SizedBox(width: 4),
                          Text(isBurned ? 'Burned' : 'Revoked', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isBurned ? AppTheme.accentPrimary : AppTheme.error)),
                        ],
                      ),
                    ),
                  ],
                ),
                if (createdAt != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(createdAt.toLocal().toString().split('.')[0], style: const TextStyle(fontSize: 10, color: AppTheme.textTertiary)),
                  ),
              ],
            ),
            if (isBurned && readAt != null)
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('Read: ${readAt.toLocal().toString().split('.')[0]}', style: const TextStyle(fontSize: 10, color: AppTheme.textTertiary)),
                  if (readByIp != null)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.globe, size: 10, color: AppTheme.textTertiary),
                        const SizedBox(width: 3),
                        Text(readByIp, style: const TextStyle(fontSize: 10, color: AppTheme.textTertiary)),
                      ],
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

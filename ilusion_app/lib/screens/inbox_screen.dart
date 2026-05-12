import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'view_secret_screen.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_provider.dart';
import '../theme/app_theme.dart';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  List<dynamic> _secrets = [];
  bool _isLoading = true;
  String? _error;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchInbox();
  }

  Future<void> _fetchInbox() async {
    try {
      setState(() { _isLoading = true; _error = null; });
      final auth = context.read<AuthProvider>();
      final token = await auth.getToken();
      final secrets = await ApiService.getInbox(token);
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
        title: const Text('Delete Secret'),
        content: const Text('Delete this secret without reading it?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: AppTheme.error)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      final auth = context.read<AuthProvider>();
      final token = await auth.getToken();
      await ApiService.revokeSecret(id, token);
      setState(() {
        final index = _secrets.indexWhere((s) => s['id'] == id);
        if (index != -1) _secrets[index]['status'] = 'revoked';
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: $e')),
      );
    }
  }

  void _openSecret(String id) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ViewSecretScreen(initialUrl: 'https://www.ilusion.io/secret/$id'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _secrets.where((s) {
      final q = _searchQuery.toLowerCase();
      if (q.isEmpty) return true;
      final id = (s['id'] ?? '').toString().toLowerCase();
      final sender = (s['sender']?['displayName'] ?? '').toString().toLowerCase();
      return id.contains(q) || sender.contains(q);
    }).toList();

    final active = filtered.where((s) => s['status'] == 'active').toList();
    final past = filtered.where((s) => s['status'] != 'active').toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inbox'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw, size: 20),
            onPressed: _fetchInbox,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildError()
              : RefreshIndicator(
                  onRefresh: _fetchInbox,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Search
                      TextField(
                        onChanged: (v) => setState(() => _searchQuery = v),
                        decoration: InputDecoration(
                          hintText: 'Search inbox...',
                          prefixIcon: const Icon(LucideIcons.search, size: 18),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // New section
                      Row(
                        children: [
                          const Icon(LucideIcons.mailOpen, size: 18, color: AppTheme.accentPrimary),
                          const SizedBox(width: 8),
                          Text('New (${active.length})', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (active.isEmpty)
                        _buildEmptyState()
                      else
                        ...active.map(_buildActiveItem),

                      // History section
                      if (past.isNotEmpty) ...[
                        const SizedBox(height: 32),
                        Container(height: 1, color: AppTheme.borderSubtle),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            const Icon(LucideIcons.lock, size: 18, color: AppTheme.textTertiary),
                            const SizedBox(width: 8),
                            Text('History', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textTertiary)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ...past.map(_buildPastItem),
                      ],
                    ],
                  ),
                ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(LucideIcons.alertCircle, size: 48, color: AppTheme.error),
          const SizedBox(height: 16),
          Text(_error!, style: const TextStyle(color: AppTheme.error)),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: _fetchInbox, child: const Text('Retry')),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(48),
      decoration: BoxDecoration(
        color: AppTheme.bgSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderDefault),
      ),
      child: Column(
        children: [
          const Icon(LucideIcons.inbox, size: 40, color: AppTheme.textTertiary),
          const SizedBox(height: 12),
          const Text('Your inbox is empty', style: TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
          const SizedBox(height: 4),
          Text('Secrets dropped into your profile appear here.',
            style: TextStyle(fontSize: 12, color: AppTheme.textTertiary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildActiveItem(dynamic secret) {
    final sender = secret['sender'];
    final senderName = sender?['displayName'] ?? 'Unknown';
    final date = DateTime.tryParse(secret['createdAt'] ?? '');

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: AppTheme.accentSubtle,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(LucideIcons.mailOpen, size: 18, color: AppTheme.accentPrimary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        '${(secret['id'] ?? '').toString().substring(0, (secret['id'] ?? '').toString().length.clamp(0, 12))}...',
                        style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.accentSubtle,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text('Unread', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.accentPrimary)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(LucideIcons.user, size: 12, color: AppTheme.textTertiary),
                      const SizedBox(width: 4),
                      Text(senderName, style: const TextStyle(fontSize: 11, color: AppTheme.textTertiary)),
                      if (date != null) ...[
                        const SizedBox(width: 12),
                        Text(
                          '${date.day}/${date.month}/${date.year}',
                          style: const TextStyle(fontSize: 11, color: AppTheme.textTertiary),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: 32,
                  child: ElevatedButton.icon(
                    onPressed: () => _openSecret(secret['id']),
                    icon: const Icon(LucideIcons.eye, size: 14),
                    label: const Text('Open', style: TextStyle(fontSize: 12)),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                SizedBox(
                  height: 32, width: 32,
                  child: IconButton(
                    onPressed: () => _revokeSecret(secret['id']),
                    icon: const Icon(LucideIcons.trash2, size: 16, color: AppTheme.error),
                    padding: EdgeInsets.zero,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPastItem(dynamic secret) {
    final isBurned = secret['status'] == 'burned';
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
            Text(
              '${(secret['id'] ?? '').toString().substring(0, (secret['id'] ?? '').toString().length.clamp(0, 12))}...',
              style: const TextStyle(fontFamily: 'monospace', fontSize: 12, decoration: TextDecoration.lineThrough, color: AppTheme.textTertiary),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isBurned ? AppTheme.accentPrimary.withValues(alpha: 0.15) : AppTheme.error.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                secret['status'] ?? 'unknown',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isBurned ? AppTheme.accentPrimary : AppTheme.error),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

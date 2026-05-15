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
          Future.delayed(const Duration(seconds: 1), () => _fetchInbox());
        } else {
          _fetchInbox();
        }
      } else {
        setState(() => _secrets = []);
      }
    }
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
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: const Text('INBOX'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw, size: 18),
            onPressed: _fetchInbox,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
          : _error != null
              ? _buildError()
              : RefreshIndicator(
                  onRefresh: _fetchInbox,
                  displacement: 20,
                  color: AppTheme.accentPrimary,
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                    children: [
                      // Search
                      Container(
                        decoration: AppTheme.cardDecoration,
                        child: TextField(
                          onChanged: (v) => setState(() => _searchQuery = v),
                          style: const TextStyle(fontSize: 14),
                          decoration: const InputDecoration(
                            hintText: 'Search your inbox...',
                            prefixIcon: Icon(LucideIcons.search, size: 16),
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),

                      _buildSectionHeader('NEW SECRETS', active.length, LucideIcons.mail, AppTheme.accentPrimary),
                      const SizedBox(height: 16),
                      if (active.isEmpty)
                        _buildEmptyState()
                      else
                        ...active.map(_buildActiveItem),

                      if (past.isNotEmpty) ...[
                        const SizedBox(height: 40),
                        _buildSectionHeader('HISTORY', past.length, LucideIcons.archive, AppTheme.textTertiary),
                        const SizedBox(height: 16),
                        ...past.map(_buildPastItem),
                      ],
                      const SizedBox(height: 40),
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
            ElevatedButton(onPressed: _fetchInbox, child: const Text('RETRY')),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48),
      decoration: AppTheme.cardDecoration,
      child: Center(
        child: Column(
          children: [
            const Icon(LucideIcons.inbox, size: 32, color: AppTheme.bgTertiary),
            const SizedBox(height: 16),
            const Text('Your inbox is clear.', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
            const SizedBox(height: 4),
            const Text(
              'Secrets shared with you will appear here.',
              style: TextStyle(fontSize: 12, color: AppTheme.textTertiary, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveItem(dynamic secret) {
    final sender = secret['sender'];
    final senderName = sender?['displayName'] ?? 'External User';
    final date = DateTime.tryParse(secret['createdAt'] ?? '');
    final id = secret['id'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: AppTheme.cardDecoration,
      child: InkWell(
        onTap: () => _openSecret(id),
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(color: AppTheme.accentPrimary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(14)),
                child: const Icon(LucideIcons.mail, size: 20, color: AppTheme.accentPrimary),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Secret from $senderName',
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Ref: ${id.toString().substring(0, id.toString().length.clamp(0, 8))}...',
                      style: const TextStyle(fontFamily: 'monospace', fontSize: 11, color: AppTheme.textTertiary, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (date != null)
                    Text('${date.day}/${date.month}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.textTertiary)),
                  const SizedBox(height: 4),
                  const Icon(LucideIcons.chevronRight, size: 14, color: AppTheme.textTertiary),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPastItem(dynamic secret) {
    final isBurned = secret['status'] == 'burned';
    final id = secret['id'] ?? '';
    final sender = secret['sender']?['displayName'] ?? 'External User';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: AppTheme.cardDecoration.copyWith(color: Colors.white.withValues(alpha: 0.5)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'From $sender',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textSecondary),
                  ),
                  Text(
                    id,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 10,
                      decoration: TextDecoration.lineThrough,
                      color: AppTheme.textTertiary,
                    ),
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
              child: Text(
                isBurned ? 'READ' : 'DELETED',
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: isBurned ? AppTheme.success : AppTheme.error),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_provider.dart';
import '../theme/app_theme.dart';
import 'package:url_launcher/url_launcher.dart';
import 'settings_screen.dart';

class DashboardScreen extends StatefulWidget {
  /// Callback to switch to a specific tab in the bottom nav
  final void Function(int index)? onNavigate;

  const DashboardScreen({super.key, this.onNavigate});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<dynamic> _secrets = [];
  Map<String, dynamic>? _profile;
  bool _isLoading = true;
  String? _error;
  String? _lastAuthHash;

  int _activeCount = 0;
  int get _burnedCount => _secrets.where((s) => s['status'] == 'burned').length;

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
          // Small delay to allow webhook to process on backend
          Future.delayed(const Duration(seconds: 1), () => _fetchSecrets());
        } else {
          _fetchSecrets();
        }
      } else {
        setState(() {
          _secrets = [];
          _profile = null;
        });
      }
    }
  }

  Future<void> _fetchSecrets() async {
    try {
      setState(() { _isLoading = true; _error = null; });
      final auth = context.read<AuthProvider>();
      final token = await auth.getToken();
      final secrets = await ApiService.getDashboardSecrets(token);
      final profile = await ApiService.getProfile(token);
      if (mounted) {
        setState(() {
          _activeCount = secrets.where((s) => s['status'] == 'active').length;
          _secrets = secrets;
          _profile = profile;
        });
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: const Text('DASHBOARD'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw, size: 18),
            onPressed: _fetchSecrets,
          ),
          IconButton(
            icon: const Icon(LucideIcons.settings, size: 18),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()));
            },
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
                      _buildWelcome(),
                      const SizedBox(height: 32),

                      _buildStatsRow(),
                      const SizedBox(height: 32),

                      if (_profile?['plan'] != 'pro') ...[
                        _buildUpgradeBanner(),
                        const SizedBox(height: 32),
                      ],

                      const _SectionHeader(title: 'QUICK ACTIONS', icon: LucideIcons.zap),
                      const SizedBox(height: 12),
                      _buildQuickActions(),
                      
                      const SizedBox(height: 32),

                      const _SectionHeader(title: 'RECENT ACTIVITY', icon: LucideIcons.history),
                      const SizedBox(height: 12),
                      _buildRecentActivity(),
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

  Widget _buildWelcome() {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final name = user?.firstName ?? 'there';
    final isPro = _profile?['plan'] == 'pro';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Hi, $name!', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: -1)),
            if (isPro) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.accentPrimary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('PRO', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white)),
              ),
            ],
          ],
        ),
        const SizedBox(height: 4),
        const Text("Here's what's happening with your secrets.", style: TextStyle(fontSize: 14, color: AppTheme.textSecondary, fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _buildUpgradeBanner() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.accentPrimary,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.accentPrimary.withValues(alpha: 0.2),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => launchUrl(Uri.parse('https://www.ilusion.io/pricing?source=app')),
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Upgrade to Pro', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white, letterSpacing: -0.5)),
                    const SizedBox(height: 4),
                    Text('Unlock unlimited file sizes, custom aliases, and advanced security.', 
                      style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.8), fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(16)),
                child: const Icon(LucideIcons.arrowRight, color: Colors.white, size: 20),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsRow() {
    return IntrinsicHeight(
      child: Row(
        children: [
          Expanded(
            child: _statCard(
              label: 'ACTIVE',
              value: '$_activeCount',
              icon: LucideIcons.shield,
              color: AppTheme.accentPrimary,
              subtitle: 'Secured',
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _statCard(
              label: 'BURNED',
              value: '$_burnedCount',
              icon: LucideIcons.flame,
              color: AppTheme.success,
              subtitle: 'Destroyed',
            ),
          ),
        ],
      ),
    );
  }

  Widget _statCard({required String label, required String value, required IconData icon, required Color color, required String subtitle}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AppTheme.cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.textTertiary, letterSpacing: 1)),
              Icon(icon, size: 14, color: color),
            ],
          ),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: -1)),
          Text(subtitle, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Column(
      children: [
        _quickAction(
          icon: LucideIcons.plus,
          color: AppTheme.accentPrimary,
          title: 'Create Secure Secret',
          subtitle: 'Generate a one-time encrypted link',
          onTap: () => widget.onNavigate?.call(0),
        ),
        const SizedBox(height: 12),
        _quickAction(
          icon: LucideIcons.send,
          color: AppTheme.success,
          title: 'Direct Inbox Drop',
          subtitle: 'Send safely to another user inbox',
          onTap: () => widget.onNavigate?.call(2),
        ),
      ],
    );
  }

  Widget _quickAction({required IconData icon, required Color color, required String title, required String subtitle, required VoidCallback onTap}) {
    return Container(
      decoration: AppTheme.cardDecoration,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(14)),
                child: Icon(icon, size: 20, color: color),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                    Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textTertiary, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              const Icon(LucideIcons.chevronRight, size: 16, color: AppTheme.textTertiary),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecentActivity() {
    final recent = _secrets.take(5).toList();

    return Container(
      decoration: AppTheme.cardDecoration,
      child: Column(
        children: [
          if (recent.isEmpty)
            const Padding(
              padding: EdgeInsets.all(40),
              child: Column(children: [
                Icon(LucideIcons.ghost, size: 32, color: AppTheme.textTertiary),
                SizedBox(height: 12),
                Text('No recent activity', style: TextStyle(fontSize: 13, color: AppTheme.textTertiary, fontWeight: FontWeight.w600)),
              ]),
            )
          else
            ...recent.asMap().entries.map((entry) {
              final i = entry.key;
              final secret = entry.value;
              final isActive = secret['status'] == 'active';
              final date = DateTime.tryParse(secret['createdAt'] ?? '');

              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          width: 36, height: 36,
                          decoration: BoxDecoration(
                            color: isActive ? AppTheme.accentPrimary.withValues(alpha: 0.08) : AppTheme.bgTertiary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            isActive ? LucideIcons.lock : LucideIcons.eyeOff,
                            size: 16,
                            color: isActive ? AppTheme.accentPrimary : AppTheme.textTertiary,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${(secret['id'] ?? '').toString().substring(0, (secret['id'] ?? '').toString().length.clamp(0, 10))}...',
                                style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w700, fontSize: 13),
                              ),
                              if (date != null)
                                Text('${date.day}/${date.month}/${date.year}', style: const TextStyle(fontSize: 11, color: AppTheme.textTertiary, fontWeight: FontWeight.w500)),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isActive ? AppTheme.success.withValues(alpha: 0.1) : AppTheme.textTertiary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            isActive ? 'ACTIVE' : 'BURNED',
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: isActive ? AppTheme.success : AppTheme.textTertiary),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (i < recent.length - 1)
                    const Divider(height: 1, color: AppTheme.borderSubtle, indent: 64),
                ],
              );
            }),
        ],
      ),
    );
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

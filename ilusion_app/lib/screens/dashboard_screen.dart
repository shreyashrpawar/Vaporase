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

  int get _activeCount => _secrets.where((s) => s['status'] == 'active').length;
  int get _burnedCount => _secrets.where((s) => s['status'] == 'burned').length;
  int get _totalCount => _secrets.length;

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
      appBar: AppBar(
        title: const Text('Overview'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw, size: 20),
            onPressed: _fetchSecrets,
          ),
          IconButton(
            icon: const Icon(LucideIcons.settings, size: 20),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()));
            },
            tooltip: 'Settings',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildError()
              : RefreshIndicator(
                  onRefresh: _fetchSecrets,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Welcome
                      _buildWelcome(),
                      const SizedBox(height: 20),

                      // Stats row
                      _buildStatsRow(),
                      const SizedBox(height: 20),

                      // Quick actions
                      if (_profile?['plan'] != 'pro') ...[
                        _buildUpgradeBanner(),
                        const SizedBox(height: 20),
                      ],
                      _buildQuickActions(),
                      const SizedBox(height: 20),

                      // Recent Activity
                      _buildRecentActivity(),
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
          Text(_error!, style: const TextStyle(color: AppTheme.error)),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: _fetchSecrets, child: const Text('Retry')),
        ],
      ),
    );
  }

  Widget _buildWelcome() {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final name = user?.firstName ?? 'there';
    final isPro = _profile?['plan'] == 'pro';
    final expiresAtStr = _profile?['planExpiresAt'];
    DateTime? expiresAt;
    if (expiresAtStr != null) {
      expiresAt = DateTime.tryParse(expiresAtStr);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Welcome back, $name', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            if (isPro) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.accentPrimary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: AppTheme.accentPrimary.withValues(alpha: 0.3)),
                ),
                child: const Text('PRO', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.accentPrimary)),
              ),
            ],
          ],
        ),
        const SizedBox(height: 4),
        if (isPro && expiresAt != null)
          Text(
            "Your Pro plan expires on ${expiresAt.day}/${expiresAt.month}/${expiresAt.year}",
            style: const TextStyle(fontSize: 12, color: AppTheme.accentPrimary, fontWeight: FontWeight.w500),
          )
        else
          const Text("Here's your security dashboard.", style: TextStyle(fontSize: 13, color: AppTheme.textTertiary)),
      ],
    );
  }

  Widget _buildUpgradeBanner() {
    return GestureDetector(
      onTap: () => launchUrl(Uri.parse('https://www.ilusion.io/pricing?source=app')),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppTheme.accentPrimary.withValues(alpha: 0.15),
              AppTheme.accentPrimary.withValues(alpha: 0.05),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.accentPrimary.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.accentPrimary.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(LucideIcons.zap, color: AppTheme.accentPrimary, size: 20),
            ),
            const SizedBox(width: 16),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Upgrade to Pro', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textPrimary)),
                  SizedBox(height: 2),
                  Text('Unlock API keys and unlimited secrets', style: TextStyle(fontSize: 12, color: AppTheme.textTertiary)),
                ],
              ),
            ),
            const Icon(LucideIcons.arrowRight, size: 16, color: AppTheme.accentPrimary),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsRow() {
    return Row(
      children: [
        // Active Secrets - takes 2/3
        Expanded(
          flex: 2,
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppTheme.bgSecondary,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderDefault),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 32, height: 32,
                          decoration: BoxDecoration(color: AppTheme.accentSubtle, borderRadius: BorderRadius.circular(8)),
                          child: const Icon(LucideIcons.shield, size: 16, color: AppTheme.accentPrimary),
                        ),
                        const SizedBox(width: 8),
                        const Text('ACTIVE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.textTertiary, letterSpacing: 1)),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: AppTheme.success.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20)),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.circle, size: 6, color: AppTheme.success),
                          SizedBox(width: 4),
                          Text('Live', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.success)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('$_activeCount', style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w800, height: 1)),
                    const SizedBox(width: 8),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Text('of $_totalCount total', style: const TextStyle(fontSize: 12, color: AppTheme.textTertiary)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Activity bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: Row(
                    children: List.generate(
                      _totalCount.clamp(1, 20),
                      (i) => Expanded(
                        child: Container(
                          height: 4,
                          margin: EdgeInsets.only(right: i < (_totalCount.clamp(1, 20) - 1) ? 2 : 0),
                          color: i < _activeCount ? AppTheme.accentPrimary : AppTheme.borderDefault.withValues(alpha: 0.5),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Burned + API Status - stacked
        Expanded(
          child: Column(
            children: [
              // Burned
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.bgSecondary,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderDefault),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 28, height: 28,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEAB308).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(LucideIcons.eye, size: 14, color: Color(0xFFEAB308)),
                    ),
                    const SizedBox(height: 8),
                    const Text('BURNED', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.textTertiary, letterSpacing: 1)),
                    Text('$_burnedCount', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              // API Status
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.bgSecondary,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderDefault),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          width: 28, height: 28,
                          decoration: BoxDecoration(
                            color: AppTheme.success.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(LucideIcons.key, size: 14, color: AppTheme.success),
                        ),
                        Container(width: 6, height: 6, decoration: BoxDecoration(color: AppTheme.success, shape: BoxShape.circle)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text('API', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.textTertiary, letterSpacing: 1)),
                    const Text('Connected', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Column(
      children: [
        // Create Secret
        _quickAction(
          icon: LucideIcons.plus,
          iconColor: AppTheme.accentPrimary,
          bgColor: AppTheme.accentSubtle,
          borderColor: AppTheme.accentPrimary.withValues(alpha: 0.2),
          title: 'Create New Secret',
          subtitle: 'Encrypt & share a one-time link',
          onTap: () => widget.onNavigate?.call(0), // Navigate to Create tab
        ),
        const SizedBox(height: 10),
        // Send to Inbox
        _quickAction(
          icon: LucideIcons.send,
          iconColor: AppTheme.success,
          bgColor: AppTheme.success.withValues(alpha: 0.1),
          borderColor: AppTheme.success.withValues(alpha: 0.2),
          title: 'Send to Inbox',
          subtitle: 'Drop a secret to another user',
          onTap: () => widget.onNavigate?.call(2), // Navigate to Send tab
        ),
      ],
    );
  }

  Widget _quickAction({
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required Color borderColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.bgSecondary,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.borderDefault),
        ),
        child: Row(
          children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(12), border: Border.all(color: borderColor)),
              child: Icon(icon, size: 20, color: iconColor),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textTertiary)),
                ],
              ),
            ),
            const Icon(LucideIcons.arrowRight, size: 16, color: AppTheme.textTertiary),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentActivity() {
    final recent = _secrets.take(6).toList();

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.bgSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderDefault),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(children: [
                  const Icon(LucideIcons.clock, size: 16, color: AppTheme.accentPrimary),
                  const SizedBox(width: 8),
                  const Text('Recent Activity', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ]),
                GestureDetector(
                  onTap: () => widget.onNavigate?.call(3), // Navigate to Secrets tab
                  child: const Text('View All', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.accentPrimary)),
                ),
              ],
            ),
          ),
          Container(height: 1, color: AppTheme.borderSubtle),

          if (recent.isEmpty)
            Padding(
              padding: const EdgeInsets.all(48),
              child: Column(children: [
                const Icon(LucideIcons.shield, size: 32, color: AppTheme.textTertiary),
                const SizedBox(height: 12),
                const Text('No activity yet', style: TextStyle(fontSize: 13, color: AppTheme.textTertiary)),
              ]),
            )
          else
            ...recent.asMap().entries.map((entry) {
              final i = entry.key;
              final secret = entry.value;
              final isActive = secret['status'] == 'active';
              final date = DateTime.tryParse(secret['createdAt'] ?? '');

              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  border: i < recent.length - 1
                      ? Border(bottom: BorderSide(color: AppTheme.borderSubtle))
                      : null,
                ),
                child: Row(
                  children: [
                    Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        color: isActive ? AppTheme.accentSubtle : AppTheme.bgTertiary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        isActive ? LucideIcons.zap : LucideIcons.eye,
                        size: 14,
                        color: isActive ? AppTheme.accentPrimary : AppTheme.textTertiary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            Text(
                              '${(secret['id'] ?? '').toString().substring(0, (secret['id'] ?? '').toString().length.clamp(0, 12))}...',
                              style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                            if (isActive) ...[
                              const SizedBox(width: 6),
                              Container(width: 6, height: 6, decoration: BoxDecoration(color: AppTheme.success, shape: BoxShape.circle)),
                            ],
                          ]),
                          if (date != null)
                            Text('${date.day}/${date.month}/${date.year}', style: const TextStyle(fontSize: 10, color: AppTheme.textTertiary)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isActive ? AppTheme.accentSubtle : const Color(0xFFEAB308).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        isActive ? 'Active' : 'Burned',
                        style: TextStyle(
                          fontSize: 10, fontWeight: FontWeight.bold,
                          color: isActive ? AppTheme.accentPrimary : const Color(0xFFEAB308),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}

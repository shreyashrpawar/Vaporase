import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_provider.dart';
import '../theme/app_theme.dart';
import 'package:url_launcher/url_launcher.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _displayNameController = TextEditingController();
  final _subdomainController = TextEditingController();
  Map<String, dynamic>? _profile;
  bool _isLoading = true;
  bool _isSaving = false;
  String? _error;
  String? _success;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    try {
      setState(() { _isLoading = true; _error = null; });
      final auth = context.read<AuthProvider>();
      final token = await auth.getToken();
      final profile = await ApiService.getProfile(token);
      setState(() {
        _profile = profile;
        _displayNameController.text = profile['displayName'] ?? '';
        _subdomainController.text = profile['subdomain'] ?? '';
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveProfile() async {
    final subdomain = _subdomainController.text.trim();
    final displayName = _displayNameController.text.trim();
    if (subdomain.isEmpty || displayName.isEmpty) return;

    setState(() { _isSaving = true; _error = null; _success = null; });

    try {
      final auth = context.read<AuthProvider>();
      final token = await auth.getToken();
      final profile = await ApiService.saveProfile(
        subdomain: subdomain,
        displayName: displayName,
        token: token,
      );
      setState(() {
        _profile = profile;
        _success = 'Profile updated!';
      });
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _success = null);
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.logOut, size: 20),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              final navigator = Navigator.of(context);
              
              await context.read<AuthProvider>().signOut();
              
              messenger.showSnackBar(
                const SnackBar(
                  content: Text('Logged out successfully'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
              // Return to dashboard/home
              navigator.pop();
            },
            tooltip: 'Sign Out',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  const Text('Configure your Secure Drop identity.', style: TextStyle(fontSize: 13, color: AppTheme.textTertiary)),
                  const SizedBox(height: 24),

                  // Error/Success banners
                  if (_error != null)
                    _buildBanner(_error!, AppTheme.error, LucideIcons.alertCircle),
                  if (_success != null)
                    _buildBanner(_success!, AppTheme.success, LucideIcons.check),
                  if (_error != null || _success != null) const SizedBox(height: 16),

                  // Subscription Plan Card
                  if (_profile != null) _buildSubscriptionCard(),
                  if (_profile != null) const SizedBox(height: 20),

                  // Form card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.bgSecondary,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.borderDefault),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Display Name', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        const SizedBox(height: 4),
                        const Text('Visible on your drop page.', style: TextStyle(fontSize: 12, color: AppTheme.textTertiary)),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _displayNameController,
                          decoration: const InputDecoration(hintText: 'e.g., John Doe'),
                          maxLength: 50,
                        ),
                        const SizedBox(height: 20),

                        const Text('Subdomain', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        const SizedBox(height: 4),
                        const Text('Your unique URL for receiving secrets.', style: TextStyle(fontSize: 12, color: AppTheme.textTertiary)),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _subdomainController,
                                decoration: InputDecoration(
                                  hintText: 'username',
                                  border: OutlineInputBorder(
                                    borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(12),
                                      bottomLeft: Radius.circular(12),
                                    ),
                                    borderSide: const BorderSide(color: AppTheme.borderDefault),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(12),
                                      bottomLeft: Radius.circular(12),
                                    ),
                                    borderSide: const BorderSide(color: AppTheme.borderDefault),
                                  ),
                                ),
                                maxLength: 30,
                                inputFormatters: [
                                  FilteringTextInputFormatter.allow(RegExp(r'[a-z0-9\-]')),
                                ],
                                onChanged: (v) => _subdomainController.value = _subdomainController.value.copyWith(
                                  text: v.toLowerCase(),
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
                              decoration: BoxDecoration(
                                color: AppTheme.bgTertiary,
                                border: Border.all(color: AppTheme.borderDefault),
                                borderRadius: const BorderRadius.only(
                                  topRight: Radius.circular(12),
                                  bottomRight: Radius.circular(12),
                                ),
                              ),
                              child: const Text('.ilusion.io', style: TextStyle(fontFamily: 'monospace', fontSize: 13, color: AppTheme.textTertiary)),
                            ),
                          ],
                        ),

                        const SizedBox(height: 24),
                        Container(height: 1, color: AppTheme.borderSubtle),
                        const SizedBox(height: 16),

                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _isSaving ? null : _saveProfile,
                            child: _isSaving
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(LucideIcons.save, size: 16),
                                      SizedBox(width: 8),
                                      Text('Save Profile'),
                                    ],
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Drop Link card
                  if (_profile != null && _profile!['subdomain'] != null) ...[
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.accentPrimary.withValues(alpha: 0.3)),
                        gradient: LinearGradient(
                          colors: [AppTheme.accentSubtle, AppTheme.bgSecondary],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 40, height: 40,
                            decoration: BoxDecoration(
                              color: AppTheme.accentSubtle,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(LucideIcons.globe, size: 20, color: AppTheme.accentPrimary),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Your Drop Link', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                const SizedBox(height: 4),
                                const Text('Share this to receive encrypted messages.', style: TextStyle(fontSize: 11, color: AppTheme.textTertiary)),
                                const SizedBox(height: 6),
                                GestureDetector(
                                  onTap: () {
                                    Clipboard.setData(ClipboardData(text: 'https://${_profile!['subdomain']}.ilusion.io'));
                                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied!')));
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: AppTheme.accentSubtle,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      'https://${_profile!['subdomain']}.ilusion.io',
                                      style: const TextStyle(fontFamily: 'monospace', fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.accentPrimary),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildSubscriptionCard() {
    final isPro = _profile?['plan'] == 'pro';

    return Container(
      padding: const EdgeInsets.all(20),
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
              const Text('Subscription', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isPro ? AppTheme.accentPrimary.withValues(alpha: 0.1) : AppTheme.bgTertiary,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isPro ? AppTheme.accentPrimary.withValues(alpha: 0.3) : AppTheme.borderDefault,
                  ),
                ),
                child: Text(
                  isPro ? 'PRO PLAN' : 'FREE PLAN',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isPro ? AppTheme.accentPrimary : AppTheme.textTertiary,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          if (!isPro) ...[
            const SizedBox(height: 16),
            const Text('Upgrade to Pro to unlock API keys and unlimited secrets.', style: TextStyle(fontSize: 12, color: AppTheme.textTertiary)),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.accentPrimary,
                  foregroundColor: Colors.white,
                ),
                onPressed: () => launchUrl(Uri.parse('https://www.ilusion.io/pricing?source=app')),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.zap, size: 16),
                    SizedBox(width: 8),
                    Text('Upgrade to Pro'),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildBanner(String text, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: TextStyle(fontSize: 13, color: color))),
      ]),
    );
  }
}

import 'package:flutter/material.dart';
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
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: const Text('SETTINGS'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.logOut, size: 18, color: AppTheme.error),
            onPressed: () async {
              final auth = context.read<AuthProvider>();
              final navigator = Navigator.of(context);
              await auth.signOut();
              if (mounted) navigator.pop();
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('PROFILE & IDENTITY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppTheme.textTertiary, letterSpacing: 1.2)),
                  const SizedBox(height: 16),

                  if (_error != null) ...[_buildBanner(_error!, AppTheme.error, LucideIcons.alertTriangle), const SizedBox(height: 16)],
                  if (_success != null) ...[_buildBanner(_success!, AppTheme.success, LucideIcons.checkCircle), const SizedBox(height: 16)],

                  _buildFormCard(),
                  const SizedBox(height: 32),

                  const Text('SUBSCRIPTION', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppTheme.textTertiary, letterSpacing: 1.2)),
                  const SizedBox(height: 16),
                  if (_profile != null) _buildSubscriptionCard(),
                  
                  const SizedBox(height: 32),
                  const Text('DANGER ZONE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppTheme.error, letterSpacing: 1.2)),
                  const SizedBox(height: 16),
                  _buildDangerCard(),
                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }

  Widget _buildFormCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: AppTheme.cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('DISPLAY NAME', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.textTertiary)),
          const SizedBox(height: 8),
          TextField(
            controller: _displayNameController,
            style: const TextStyle(fontWeight: FontWeight.w600),
            decoration: const InputDecoration(
              hintText: 'Your name',
              hintStyle: TextStyle(fontWeight: FontWeight.normal),
            ),
          ),
          const SizedBox(height: 24),

          const Text('PERSONAL SUBDOMAIN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.textTertiary)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _subdomainController,
                  style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w700),
                  decoration: const InputDecoration(
                    hintText: 'username',
                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              const Text('.ilusion.io', style: TextStyle(color: AppTheme.textTertiary, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSaving ? null : _saveProfile,
              child: _isSaving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('UPDATE IDENTITY'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubscriptionCard() {
    final isPro = _profile?['plan'] == 'pro';
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: AppTheme.cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: isPro ? AppTheme.accentPrimary.withValues(alpha: 0.1) : AppTheme.bgTertiary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(LucideIcons.zap, size: 20, color: isPro ? AppTheme.accentPrimary : AppTheme.textTertiary),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(isPro ? 'Ilusion Pro' : 'Free Tier', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                    Text(isPro ? 'Premium security active' : 'Basic protection enabled', 
                      style: const TextStyle(fontSize: 12, color: AppTheme.textTertiary, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
            ],
          ),
          if (!isPro) ...[
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => launchUrl(Uri.parse('https://www.ilusion.io/pricing')),
                child: const Text('UPGRADE TO PRO'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDangerCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AppTheme.cardDecoration.copyWith(
        border: Border.all(color: AppTheme.error.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('ACCOUNT LOGOUT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.textTertiary)),
          const SizedBox(height: 4),
          const Text('Terminate your current session securely.', style: TextStyle(fontSize: 12, color: AppTheme.textTertiary, fontWeight: FontWeight.w500)),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () async {
                await context.read<AuthProvider>().signOut();
                if (mounted) Navigator.pop(context);
              },
              style: TextButton.styleFrom(foregroundColor: AppTheme.error),
              child: const Text('SIGN OUT OF ACCOUNT', style: TextStyle(fontWeight: FontWeight.w900)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBanner(String text, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: TextStyle(fontSize: 13, color: color, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';

import 'package:clerk_auth/clerk_auth.dart' as clerk;
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';
import '../theme/app_theme.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _codeController = TextEditingController();
  bool _isLoading = false;
  bool _isVerifying = false;
  String? _error;

  Future<void> _handleSignUp() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      setState(() => _error = 'Please enter both email and password');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final auth = context.read<AuthProvider>();
      await auth.signUp(
        _emailController.text.trim(),
        _passwordController.text,
      );
      
      if (auth.auth.isSigningUp && auth.auth.signUp?.status != clerk.Status.complete) {
        setState(() {
          _isVerifying = true;
        });
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('ClerkError: ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleVerify() async {
    if (_codeController.text.isEmpty) {
      setState(() => _error = 'Please enter the verification code');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await context.read<AuthProvider>().verifySignUp(_codeController.text.trim());
      if (mounted) Navigator.of(context).pop(); // Go back to sign in or it will auto-route to home
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('ClerkError: ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isVerifying ? 'Verify Email' : 'Create Account'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _isVerifying ? 'Enter Code' : 'Join Ilusion',
                style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 8),
              Text(
                _isVerifying 
                  ? 'We sent a verification code to ${_emailController.text}'
                  : 'Start securing your secrets today.',
                style: const TextStyle(fontSize: 16, color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 40),
              
              if (_error != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: AppTheme.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.error.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.alertCircle, color: AppTheme.error, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(_error!, style: const TextStyle(color: AppTheme.error, fontSize: 14)),
                      ),
                    ],
                  ),
                ),

              if (!_isVerifying) ...[
                TextField(
                  controller: _emailController,
                  style: const TextStyle(color: AppTheme.textPrimary),
                  decoration: AppTheme.inputDecoration(
                    'Email Address',
                    prefixIcon: LucideIcons.mail,
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: _passwordController,
                  style: const TextStyle(color: AppTheme.textPrimary),
                  obscureText: true,
                  decoration: AppTheme.inputDecoration(
                    'Password',
                    prefixIcon: LucideIcons.lock,
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleSignUp,
                    child: _isLoading
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                        : const Text('Sign Up', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
              ] else ...[
                TextField(
                  controller: _codeController,
                  style: const TextStyle(color: AppTheme.textPrimary, fontSize: 24, letterSpacing: 8),
                  textAlign: TextAlign.center,
                  decoration: AppTheme.inputDecoration(
                    'Verification Code',
                    prefixIcon: LucideIcons.shieldCheck,
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleVerify,
                    child: _isLoading
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                        : const Text('Verify Account', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: () => setState(() => _isVerifying = false),
                    child: const Text('Back to Sign Up', style: TextStyle(color: AppTheme.textSecondary)),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:clerk_auth/clerk_auth.dart' as clerk;

class AuthProvider extends ChangeNotifier {
  final ClerkAuthState _auth;

  AuthProvider({required ClerkAuthState auth}) : _auth = auth {
    _auth.addListener(notifyListeners);
  }

  ClerkAuthState get auth => _auth;
  bool get isInitialized => true; // Managed by ClerkAuth widget
  
  bool get isSignedIn => _auth.isSignedIn;
  clerk.User? get user => _auth.user;
  clerk.Session? get session => _auth.session;

  int _refreshCount = 0;
  int get refreshCount => _refreshCount;

  void triggerRefresh() {
    _refreshCount++;
    notifyListeners();
  }

  // Helper to refresh state when Auth notifies us
  void updateState() {
    notifyListeners();
  }

  Future<void> signIn(String identifier, String password) async {
    await _auth.attemptSignIn(
      strategy: clerk.Strategy.password,
      identifier: identifier,
      password: password,
    );
    notifyListeners();
  }

  Future<void> signUp(String email, String password) async {
    await _auth.attemptSignUp(
      strategy: clerk.Strategy.emailCode, // Default to email code verification
      emailAddress: email,
      password: password,
    );
    notifyListeners();
  }

  Future<void> verifySignUp(String code) async {
    await _auth.attemptSignUp(
      strategy: clerk.Strategy.emailCode,
      code: code,
    );
    notifyListeners();
  }

  Future<void> signInWithGoogle(BuildContext context) async {
    // Use the official ssoSignIn method which handles everything
    await _auth.ssoSignIn(context, clerk.Strategy.oauthGoogle);
    notifyListeners();
  }

  Future<void> signOut() async {
    await _auth.signOut();
    notifyListeners();
  }

  Future<String?> getToken() async {
    if (!isSignedIn) return null;
    try {
      final sessionToken = await _auth.sessionToken();
      return sessionToken.jwt;
    } catch (e) {
      return null;
    }
  }
}

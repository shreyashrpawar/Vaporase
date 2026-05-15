import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../services/auth_provider.dart';
import 'create_secret_screen.dart';
import 'dashboard_screen.dart';
import 'inbox_screen.dart';
import 'secrets_screen.dart';
import 'sign_in_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  void _navigateTo(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    // Screens that require auth show SignInScreen when not signed in
    Widget authGate(Widget screen) {
      return auth.isSignedIn ? screen : const SignInScreen();
    }

    final List<Widget> screens = [
      const CreateSecretScreen(),                          // 0: Create
      authGate(const SecretsScreen()),                     // 1: Vault
      authGate(const InboxScreen()),                       // 2: Inbox
      authGate(DashboardScreen(onNavigate: _navigateTo)),  // 3: More (Overview/Settings)
    ];

    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppTheme.bgSecondary,
          border: const Border(
            top: BorderSide(color: AppTheme.borderDefault, width: 1),
          ),
          boxShadow: [
            BoxShadow(
              color: AppTheme.textPrimary.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: _navigateTo,
              backgroundColor: Colors.transparent,
              elevation: 0,
              selectedItemColor: AppTheme.accentPrimary,
              unselectedItemColor: AppTheme.textTertiary,
              showSelectedLabels: true,
              showUnselectedLabels: true,
              type: BottomNavigationBarType.fixed,
              selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(LucideIcons.plusCircle, size: 22),
                  activeIcon: Icon(LucideIcons.plusCircle, size: 22),
                  label: 'Create',
                ),
                BottomNavigationBarItem(
                  icon: Icon(LucideIcons.shield, size: 22),
                  activeIcon: Icon(LucideIcons.shield, size: 22),
                  label: 'Vault',
                ),
                BottomNavigationBarItem(
                  icon: Icon(LucideIcons.inbox, size: 22),
                  activeIcon: Icon(LucideIcons.inbox, size: 22),
                  label: 'Inbox',
                ),
                BottomNavigationBarItem(
                  icon: Icon(LucideIcons.user, size: 22),
                  activeIcon: Icon(LucideIcons.user, size: 22),
                  label: 'Profile',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

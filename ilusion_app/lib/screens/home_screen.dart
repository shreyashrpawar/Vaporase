import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../services/auth_provider.dart';
import 'create_secret_screen.dart';
import 'view_secret_screen.dart';
import 'dashboard_screen.dart';
import 'inbox_screen.dart';
import 'send_screen.dart';
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
      authGate(const InboxScreen()),                       // 1: Inbox
      authGate(const SendScreen()),                        // 2: Send
      authGate(const SecretsScreen()),                     // 3: Secrets
      const ViewSecretScreen(),                            // 4: View
      authGate(DashboardScreen(onNavigate: _navigateTo)),  // 5: Overview/Settings
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: AppTheme.borderDefault, width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: _navigateTo,
          backgroundColor: AppTheme.bgPrimary,
          selectedItemColor: AppTheme.accentPrimary,
          unselectedItemColor: AppTheme.textTertiary,
          showSelectedLabels: true,
          showUnselectedLabels: true,
          type: BottomNavigationBarType.fixed,
          selectedFontSize: 11,
          unselectedFontSize: 10,
          items: const [
            BottomNavigationBarItem(
              icon: Padding(padding: EdgeInsets.only(bottom: 3), child: Icon(LucideIcons.lock, size: 20)),
              label: 'Create',
            ),
            BottomNavigationBarItem(
              icon: Padding(padding: EdgeInsets.only(bottom: 3), child: Icon(LucideIcons.inbox, size: 20)),
              label: 'Inbox',
            ),
            BottomNavigationBarItem(
              icon: Padding(padding: EdgeInsets.only(bottom: 3), child: Icon(LucideIcons.send, size: 20)),
              label: 'Send',
            ),
            BottomNavigationBarItem(
              icon: Padding(padding: EdgeInsets.only(bottom: 3), child: Icon(LucideIcons.shield, size: 20)),
              label: 'Secrets',
            ),
            BottomNavigationBarItem(
              icon: Padding(padding: EdgeInsets.only(bottom: 3), child: Icon(LucideIcons.eye, size: 20)),
              label: 'View',
            ),
            BottomNavigationBarItem(
              icon: Padding(padding: EdgeInsets.only(bottom: 3), child: Icon(LucideIcons.layoutDashboard, size: 20)),
              label: 'More',
            ),
          ],
        ),
      ),
    );
  }
}

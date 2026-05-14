import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:app_links/app_links.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:clerk_auth/clerk_auth.dart' as clerk;
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';
import 'screens/view_secret_screen.dart';
import 'screens/splash_screen.dart';
import 'services/auth_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: AppTheme.bgPrimary,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  runApp(const IlusionApp());
}

class IlusionApp extends StatefulWidget {
  const IlusionApp({super.key});

  @override
  State<IlusionApp> createState() => _IlusionAppState();
}

class _IlusionAppState extends State<IlusionApp> {
  final _navigatorKey = GlobalKey<NavigatorState>();
  final _appLinks = AppLinks();
  static const _publishableKey = 'pk_live_Y2xlcmsuaWx1c2lvbi5pbyQ';

  @override
  void initState() {
    super.initState();
    debugPrint('IlusionApp: Initializing...');
  }

  /// This function checks a [Uri] to see if it's a deep link that the
  /// Clerk SDK should handle.
  Future<Uri?> _handleDeepLink(Uri uri) async {
    // 1. Handle our custom secret links
    if (uri.path.startsWith('/secret/') || uri.path.startsWith('/s/')) {
      _navigatorKey.currentState?.push(
        MaterialPageRoute(
          builder: (context) => ViewSecretScreen(initialUrl: uri.toString()),
        ),
      );
      return null; // Clerk doesn't need to handle this
    }

    // 2. Handle Clerk OAuth callbacks
    if (uri.path == '/oauth_callback' || uri.host == 'oauth_callback') {
      return uri; // Tell Clerk to handle this
    }

    // 3. Handle payment success
    if (uri.host == 'payment-success') {
      // Trigger a refresh of the app data
      _navigatorKey.currentContext?.read<AuthProvider>().triggerRefresh();
      // Optionally pop back to the home screen if we are deep in settings
      _navigatorKey.currentState?.popUntil((route) => route.isFirst);
      return null;
    }

    return null;
  }

  /// Generate deep link for Clerk
  Uri? _generateDeepLink(BuildContext context, clerk.Strategy strategy) {
    if (strategy.isOauth || strategy.isEmailLink) {
      return Uri(
        scheme: 'ilusion',
        host: 'oauth_callback',
      );
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return ClerkAuth(
      config: ClerkAuthConfig(
        publishableKey: _publishableKey,
        redirectionGenerator: _generateDeepLink,
        deepLinkStream: _appLinks.uriLinkStream.asyncMap(_handleDeepLink),
        loading: const MaterialApp(
          debugShowCheckedModeBanner: false,
          home: SplashScreen(),
        ),
      ),
      child: Builder(
        builder: (context) {
          return ChangeNotifierProvider(
            create: (_) => AuthProvider(auth: ClerkAuth.of(context)),
            child: MaterialApp(
              title: 'Ilusion',
              debugShowCheckedModeBanner: false,
              theme: AppTheme.darkTheme,
              navigatorKey: _navigatorKey,
              home: const HomeScreen(),
            ),
          );
        },
      ),
    );
  }
}

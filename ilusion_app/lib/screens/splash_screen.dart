import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      body: Stack(
        children: [
          // Background subtle gradients
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.accentPrimary.withOpacity(0.05),
              ),
            ),
          ),
          Positioned(
            bottom: -50,
            left: -50,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.accentPrimary.withOpacity(0.03),
              ),
            ),
          ),
          
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Animated Logo
                TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0.8, end: 1.0),
                  duration: const Duration(milliseconds: 800),
                  curve: Curves.easeOutBack,
                  builder: (context, value, child) {
                    return Transform.scale(
                      scale: value,
                      child: Opacity(
                        opacity: (value - 0.8) / 0.2,
                        child: child,
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.bgSecondary,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: AppTheme.borderDefault,
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.accentPrimary.withOpacity(0.1),
                          blurRadius: 40,
                          spreadRadius: 5,
                        ),
                      ],
                    ),
                    child: Image.asset(
                      'assets/app_icon.png',
                      width: 80,
                      height: 80,
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                
                // Branding text
                const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'ilusion',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      '.io',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.accentPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 48),
                
                // Sleek loading indicator
                SizedBox(
                  width: 120,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: const LinearProgressIndicator(
                      backgroundColor: AppTheme.bgTertiary,
                      color: AppTheme.accentPrimary,
                      minHeight: 2,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Bottom tagline
          const Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: Text(
                'Secure & Ephemeral',
                style: TextStyle(
                  color: AppTheme.textTertiary,
                  fontSize: 12,
                  letterSpacing: 1.2,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Light Mode Palette
  static const Color bgPrimary = Color(0xFFF8FAFC);   // Slate 50
  static const Color bgSecondary = Color(0xFFFFFFFF); // White
  static const Color bgTertiary = Color(0xFFF1F5F9);  // Slate 100
  
  static const Color textPrimary = Color(0xFF0F172A);   // Slate 900
  static const Color textSecondary = Color(0xFF475569); // Slate 600
  static const Color textTertiary = Color(0xFF94A3B8);  // Slate 400
  
  static const Color accentPrimary = Color(0xFF6366F1); // Indigo 500
  static const Color accentHover = Color(0xFF4F46E5);   // Indigo 600
  static const Color accentSubtle = Color(0x1A6366F1);  // 10% Indigo
  static const Color accentMuted = Color(0x0D6366F1);   // 5% Indigo

  static const Color borderDefault = Color(0xFFE2E8F0); // Slate 200
  static const Color borderSubtle = Color(0xFFF1F5F9);  // Slate 100
  static const Color borderGlow = Color(0x1A6366F1);    // 10% Indigo glow

  static const Color success = Color(0xFF10B981); // Emerald 500
  static const Color error = Color(0xFFEF4444);   // Red 500
  static const Color warning = Color(0xFFF59E0B); // Amber 500

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: bgPrimary,
      primaryColor: accentPrimary,
      
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.light().textTheme,
      ).apply(
        bodyColor: textPrimary,
        displayColor: textPrimary,
      ),

      colorScheme: const ColorScheme.light(
        primary: accentPrimary,
        secondary: accentPrimary,
        surface: bgSecondary,
        surfaceContainerLowest: bgSecondary,
        error: error,
      ),

      appBarTheme: const AppBarTheme(
        backgroundColor: bgPrimary,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 0,
        iconTheme: IconThemeData(color: textPrimary, size: 20),
        titleTextStyle: TextStyle(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bgSecondary,
        hintStyle: const TextStyle(color: textTertiary, fontSize: 14),
        labelStyle: const TextStyle(color: textSecondary, fontSize: 14, fontWeight: FontWeight.w500),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: borderDefault),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: borderDefault),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: accentPrimary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: error),
        ),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accentPrimary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.2,
          ),
        ),
      ),
      
      cardTheme: CardThemeData(
        color: bgSecondary,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: borderDefault),
        ),
      ),
    );
  }

  static const BoxDecoration cardDecoration = BoxDecoration(
    color: bgSecondary,
    borderRadius: BorderRadius.all(Radius.circular(24)),
    border: Border.fromBorderSide(BorderSide(color: borderDefault)),
    boxShadow: [
      BoxShadow(
        color: Color(0x050F172A),
        blurRadius: 20,
        offset: Offset(0, 8),
      ),
    ],
  );

  static InputDecoration inputDecoration(String label, {IconData? prefixIcon, String? hintText}) {
    return InputDecoration(
      labelText: label,
      hintText: hintText,
      prefixIcon: prefixIcon != null ? Icon(prefixIcon, size: 20, color: textSecondary) : null,
      floatingLabelBehavior: FloatingLabelBehavior.always,
    );
  }
}

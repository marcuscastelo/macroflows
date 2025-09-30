# Macroflows Android App

This directory contains the Android native project for Macroflows, built with Capacitor.

## Quick Start

### Prerequisites

- Android Studio (latest version recommended)
- Java Development Kit (JDK) 17 or higher
- Android SDK with API level 33+ (configured in Android Studio)

### Setup

1. Generate a release keystore (first time only):

```bash
./scripts/generate-keystore.sh
```

2. Configure signing credentials by creating `keystore.properties`:

```bash
cp keystore.properties.example keystore.properties
# Edit keystore.properties with your credentials
```

3. Sync web assets:

```bash
cd ..
pnpm run build
npx cap sync android
```

4. Open in Android Studio:

```bash
npx cap open android
```

## Building

### Debug Build

```bash
./gradlew assembleDebug
```

### Release Build

```bash
./gradlew assembleRelease
```

Output: `app/build/outputs/apk/release/app-release.apk`

### Android App Bundle (for Play Store)

```bash
./gradlew bundleRelease
```

Output: `app/build/outputs/bundle/release/app-release.aab`

## Documentation

For detailed information about release signing configuration, see:
- [Android Release Signing Documentation](../docs/android-release-signing.md)

## Project Structure

```
android/
├── app/                    # Main application module
│   ├── src/               # Java/Kotlin source files
│   ├── build.gradle       # App-level Gradle configuration (includes signing config)
│   └── release.keystore   # Release signing keystore (gitignored)
├── scripts/               # Utility scripts
│   └── generate-keystore.sh  # Keystore generation script
├── gradle/                # Gradle wrapper files
├── build.gradle           # Project-level Gradle configuration
├── settings.gradle        # Gradle settings
├── variables.gradle       # Shared Gradle variables
├── keystore.properties    # Signing credentials (gitignored)
└── keystore.properties.example  # Example credentials file
```

## Useful Commands

```bash
# List available Gradle tasks
./gradlew tasks

# Clean build artifacts
./gradlew clean

# Run unit tests
./gradlew test

# Install debug build on connected device
./gradlew installDebug

# Generate release APK with signing
./gradlew assembleRelease
```

## Notes

- The keystore file and `keystore.properties` are excluded from git for security
- For CI/CD builds, use environment variables instead of `keystore.properties`
- Always keep a backup of your release keystore in a secure location

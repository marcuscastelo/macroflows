# Android Release Build Signing Configuration

This document describes the Android app signing configuration for production release builds of Macroflows.

## Overview

Android requires all APKs and AABs to be digitally signed before they can be installed on a device or published to the Google Play Store. This setup provides:

- Keystore generation script for creating signing keys
- Gradle configuration for automated release signing
- Support for both local development and CI/CD environments
- Secure handling of signing credentials via environment variables or properties files

## Keystore Generation

### Using the Generation Script

A script is provided to simplify keystore creation:

```bash
cd android
./scripts/generate-keystore.sh
```

The script will:
1. Check if a keystore already exists and prompt for overwrite confirmation
2. Prompt for keystore password (entered twice for confirmation)
3. Ask for a key alias (default: `macroflows-release`)
4. Collect certificate information (CN, OU, O, L, ST, C)
5. Generate a keystore file at `android/app/release.keystore`
6. Display next steps and important security information

### Manual Keystore Generation

If you prefer to generate the keystore manually:

```bash
cd android/app
keytool -genkeypair \
  -v \
  -keystore release.keystore \
  -alias macroflows-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Your Name, OU=Your Org Unit, O=Your Organization, L=City, ST=State, C=Country"
```

## Configuration Methods

The build system supports two methods for providing signing credentials:

### Method 1: keystore.properties File (Recommended for Local Development)

1. Create a `keystore.properties` file in the `android/` directory:

```properties
storeFile=app/release.keystore
storePassword=your-keystore-password
keyAlias=macroflows-release
keyPassword=your-key-password
```

2. The file is automatically excluded from git via `.gitignore`

### Method 2: Environment Variables (Recommended for CI/CD)

Set the following environment variables:

```bash
export MACROFLOWS_RELEASE_STORE_FILE=release.keystore
export MACROFLOWS_RELEASE_STORE_PASSWORD=your-store-password
export MACROFLOWS_RELEASE_KEY_ALIAS=macroflows-release
export MACROFLOWS_RELEASE_KEY_PASSWORD=your-key-password
```

For CI/CD systems (GitHub Actions, GitLab CI, etc.), store these as encrypted secrets.

## Building a Signed Release

### Using Gradle

```bash
cd android
./gradlew assembleRelease
```

The signed APK will be generated at:
`android/app/build/outputs/apk/release/app-release.apk`

For Android App Bundle (AAB) format (required for Play Store):

```bash
cd android
./gradlew bundleRelease
```

The signed AAB will be generated at:
`android/app/build/outputs/bundle/release/app-release.aab`

### Using Capacitor

Ensure your web assets are built first:

```bash
pnpm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

## CI/CD Setup

### GitHub Actions Example

1. Encode your keystore as base64:

```bash
base64 android/app/release.keystore | tr -d '\n' > keystore.base64
```

2. Add the following secrets to your GitHub repository:
   - `ANDROID_KEYSTORE_BASE64`: The base64-encoded keystore
   - `ANDROID_KEYSTORE_PASSWORD`: Your keystore password
   - `ANDROID_KEY_ALIAS`: Your key alias (e.g., `macroflows-release`)
   - `ANDROID_KEY_PASSWORD`: Your key password

3. Use in workflow:

```yaml
- name: Decode keystore
  run: |
    echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > android/app/release.keystore

- name: Build signed APK
  env:
    MACROFLOWS_RELEASE_STORE_FILE: release.keystore
    MACROFLOWS_RELEASE_STORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
    MACROFLOWS_RELEASE_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
    MACROFLOWS_RELEASE_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
  run: |
    cd android
    ./gradlew assembleRelease
```

## Security Best Practices

1. **Never commit keystore files or passwords to version control**
   - The `.gitignore` is configured to exclude keystore files
   - Always use `keystore.properties` or environment variables

2. **Keep keystore backups secure**
   - Store keystore files in a secure location (password manager, encrypted storage)
   - If you lose the keystore, you cannot update the app on the Play Store

3. **Use strong passwords**
   - Use different, complex passwords for keystore and key
   - Store passwords in a password manager

4. **Restrict access**
   - Only authorized team members should have access to signing credentials
   - Use CI/CD secrets management for automated builds

5. **Rotate keys periodically**
   - Consider using Google Play App Signing for automatic key rotation
   - Keep the upload key secure but use Play App Signing for distribution

## Troubleshooting

### "Keystore was tampered with, or password was incorrect"

Verify that:
- The keystore file path is correct
- The store password matches the one used during generation
- The keystore file hasn't been corrupted

### Build fails with signing errors in CI/CD

Check that:
- Environment variables are properly set in CI/CD
- Base64 encoding/decoding of keystore is correct
- File paths are relative to the android directory

### Cannot find keystore file

Ensure:
- The keystore file is in the correct location (`android/app/release.keystore`)
- If using `keystore.properties`, the `storeFile` path is correct
- If using environment variables, the path in `MACROFLOWS_RELEASE_STORE_FILE` is correct

## References

- [Android Developer: Sign your app](https://developer.android.com/studio/publish/app-signing)
- [Capacitor: Building for Android](https://capacitorjs.com/docs/android)
- [Gradle: Signing Android applications](https://developer.android.com/studio/build/building-cmdline#sign_cmdline)

# Android Build - Quick Start Guide

## First Time Setup (5 minutes)

### 1. Generate Release Keystore
```bash
cd android
./scripts/generate-keystore.sh
```

Follow the prompts to create your signing key. **Keep the password safe!**

### 2. Configure Signing Credentials

Create `android/keystore.properties`:
```properties
storeFile=app/release.keystore
storePassword=YOUR_PASSWORD_HERE
keyAlias=macroflows-release
keyPassword=YOUR_PASSWORD_HERE
```

### 3. Build the App
```bash
cd ..
pnpm run android:sync
pnpm run android:build
```

**Your signed APK will be at:** `android/app/build/outputs/apk/release/app-release.apk`

---

## Daily Development

### Sync Web Changes to Android
```bash
pnpm run android:sync
```

### Open in Android Studio
```bash
pnpm run android:open
```

### Build Release APK
```bash
pnpm run android:build
```

### Build Release AAB (for Play Store)
```bash
pnpm run android:bundle
```

---

## CI/CD Setup

### 1. Encode Your Keystore
```bash
base64 android/app/release.keystore | tr -d '\n'
```

### 2. Add GitHub Secrets
- `ANDROID_KEYSTORE_BASE64`: (output from step 1)
- `ANDROID_KEYSTORE_PASSWORD`: your keystore password
- `ANDROID_KEY_ALIAS`: `macroflows-release`
- `ANDROID_KEY_PASSWORD`: your key password

### 3. Use in Workflow
```yaml
- name: Build Signed Release
  env:
    MACROFLOWS_RELEASE_STORE_FILE: release.keystore
    MACROFLOWS_RELEASE_STORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
    MACROFLOWS_RELEASE_KEY_ALIAS: macroflows-release
    MACROFLOWS_RELEASE_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
  run: |
    echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > android/app/release.keystore
    cd android
    ./gradlew assembleRelease
```

---

## Troubleshooting

### "Keystore not found"
✅ Make sure `keystore.properties` exists in `android/` directory
✅ Check that `storeFile` path is correct

### "Password incorrect"
✅ Verify passwords in `keystore.properties` match the ones you entered during generation
✅ Try regenerating the keystore if needed

### Build fails
✅ Run `pnpm run android:clean` first
✅ Make sure you ran `pnpm run android:sync` after web changes

---

## Need More Help?

📖 Full documentation: `docs/android-release-signing.md`
📱 Android-specific guide: `android/README.md`

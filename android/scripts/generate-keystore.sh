#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEYSTORE_DIR="$SCRIPT_DIR/../app"
KEYSTORE_FILE="$KEYSTORE_DIR/release.keystore"

echo "========================================"
echo "Macroflows - Android Release Keystore Generator"
echo "========================================"
echo ""

if [ -f "$KEYSTORE_FILE" ]; then
    echo "⚠️  WARNING: Keystore already exists at $KEYSTORE_FILE"
    read -p "Do you want to overwrite it? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "❌ Aborted. Keystore was not overwritten."
        exit 0
    fi
    echo "🗑️  Removing existing keystore..."
    rm "$KEYSTORE_FILE"
fi

read -p "Enter keystore password: " -s KEYSTORE_PASSWORD
echo ""
read -p "Confirm keystore password: " -s KEYSTORE_PASSWORD_CONFIRM
echo ""

if [ "$KEYSTORE_PASSWORD" != "$KEYSTORE_PASSWORD_CONFIRM" ]; then
    echo "❌ Passwords do not match. Aborting."
    exit 1
fi

read -p "Enter key alias [default: macroflows-release]: " KEY_ALIAS
KEY_ALIAS=${KEY_ALIAS:-macroflows-release}

read -p "Enter your name (CN): " -r CN
read -p "Enter your organizational unit (OU) [optional]: " -r OU
read -p "Enter your organization (O) [optional]: " -r O
read -p "Enter your city/locality (L) [optional]: " -r L
read -p "Enter your state/province (ST) [optional]: " -r ST
read -p "Enter your country code (C) [e.g., US, BR]: " -r C

DNAME="CN=$CN"
[ -n "$OU" ] && DNAME="$DNAME, OU=$OU"
[ -n "$O" ] && DNAME="$DNAME, O=$O"
[ -n "$L" ] && DNAME="$DNAME, L=$L"
[ -n "$ST" ] && DNAME="$DNAME, ST=$ST"
[ -n "$C" ] && DNAME="$DNAME, C=$C"

echo ""
echo "📝 Generating keystore with:"
echo "   File: $KEYSTORE_FILE"
echo "   Alias: $KEY_ALIAS"
echo "   Distinguished Name: $DNAME"
echo ""

keytool -genkeypair \
    -v \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEYSTORE_PASSWORD" \
    -dname "$DNAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Keystore generated successfully!"
    echo ""
    echo "⚠️  IMPORTANT: Keep these values safe and secure!"
    echo "   Keystore file: $KEYSTORE_FILE"
    echo "   Key alias: $KEY_ALIAS"
    echo "   Password: (the one you entered)"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Add the keystore to .gitignore (already done in android/app/.gitignore)"
    echo "   2. Set environment variables or create keystore.properties:"
    echo "      MACROFLOWS_RELEASE_STORE_FILE=release.keystore"
    echo "      MACROFLOWS_RELEASE_STORE_PASSWORD=<your-password>"
    echo "      MACROFLOWS_RELEASE_KEY_ALIAS=$KEY_ALIAS"
    echo "      MACROFLOWS_RELEASE_KEY_PASSWORD=<your-password>"
    echo ""
    echo "   For CI/CD, encode the keystore as base64:"
    echo "   base64 $KEYSTORE_FILE | tr -d '\n'"
    echo ""
else
    echo "❌ Failed to generate keystore."
    exit 1
fi

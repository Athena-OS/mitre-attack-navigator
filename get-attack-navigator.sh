#!/bin/bash

set -e

# === CONFIGURATION ===
REPO="Athena-OS/mitre-attack-navigator"              # Replace with your GitHub repo, e.g., "example/myapp"
PATTERN="*.rpm"       # Replace with actual pattern of RPM file
BINARY_NAME="attack-navigator"         # Replace with command to run the app
TMP_DIR="/tmp/${BINARY_NAME}_download"

# === FUNCTIONS ===

install_gh_cli() {
    if command -v gh >/dev/null 2>&1; then
        echo "✅ GitHub CLI is already installed."
        return
    fi

    echo "📦 Installing GitHub CLI..."

    # For Fedora/RHEL-based systems
    sudo dnf install -y dnf-plugins-core
    sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
    sudo dnf install -y gh

    if ! command -v gh >/dev/null 2>&1; then
        echo "❌ Failed to install GitHub CLI."
        exit 1
    fi
}

download_rpm() {
    mkdir -p "$TMP_DIR"
    cd "$TMP_DIR"

    echo "⬇️  Downloading RPM using GitHub CLI..."
    gh release download --repo "$REPO" --pattern "$PATTERN"

    RPM_FILE=$(ls *.rpm | head -n 1)
    if [ -z "$RPM_FILE" ]; then
        echo "❌ No RPM file found with pattern '$PATTERN'."
        exit 1
    fi
}

install_rpm() {
    echo "📦 Installing $RPM_FILE..."
    sudo dnf install -y "$RPM_FILE" || sudo rpm -i "$RPM_FILE"
}

run_binary() {
    echo "🚀 Running $BINARY_NAME..."
    if command -v "$BINARY_NAME" >/dev/null 2>&1; then
        exec "$BINARY_NAME"
    else
        echo "❌ Failed to run $BINARY_NAME (not found in PATH)."
        exit 1
    fi
}

# === MAIN ===

install_gh_cli
download_rpm
install_rpm
run_binary



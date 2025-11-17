#!/usr/bin/env bash

ME=$0
ROOT_DIR=$PWD
BUILD_DIR="$ROOT_DIR/.build"
MANIFEST="$ROOT_DIR/manifest.json"
VERSION=

# Display Usage
function help() {
        cat <<EOS
usage: ${ME} [options]
Build and package the Copy All URLs Chrome extension.

example:
    ${ME} -v 3.1.0

options:
    -m, --manifest  Alternate path of the manifest file 'manifest.json'.
    -v, --version   New extension version number
    -o, --output    Alternate build directory. Default '.build' in the current working directory
    -h, --help      Show help and exit
EOS
    exit 2
}

function parseargs() {
    while [[ $# -gt 0 ]]; do
        key="$1"

        case $key in
            -m|--manifest)
                case $2 in
                    /*) MANIFEST="$2" ;;
                    *) MANIFEST="$ROOT_DIR/$2" ;;
                esac
                shift
                shift
                ;;
            -v|--version)
                VERSION=$2
                shift
                shift
                ;;
            -o|--output)
                case $2 in
                    /*) BUILD_DIR="$2" ;;
                    *) BUILD_DIR="$ROOT_DIR/$2" ;;
                esac
                shift
                shift
                ;;
            -h|--help)
                help
                ;;
            *)
                echo "Error: Unknown option $key"
                help
                ;;
        esac
    done
}

parseargs "$@"

# Check if manifest filename matches expected filename
if [[ ! ${MANIFEST} =~ manifest\.json$ ]]; then
    echo "Error: file '$MANIFEST' must have the filename 'manifest.json'"
    exit 2
fi

# Check if manifest file exists
if [ ! -f ${MANIFEST} ]; then
    echo "Error: manifest file '$MANIFEST' not found."
    exit 2
fi

# Check if version number is set
if [ -z "$VERSION" ]; then
    echo "Error: missing version number."
    help
fi

# Check if zip is installed
if ! command -v zip >/dev/null; then
    echo "Error: missing 'zip' utility."
    exit 2
fi

# Create build directory structure
echo "$ME: Creating the build directory structure under $BUILD_DIR..."
rm -rf "$BUILD_DIR"
mkdir --parents --verbose "$BUILD_DIR"

# Copy project src to build directory
echo "$ME: Copying project source files to build directory..."
PROJECT_SRC_DIR=$(dirname "${MANIFEST}")

# Files to include in the extension package
INCLUDE_FILES=(
    "manifest.json"
    "background.js"
    "popup.html"
    "popup.js"
    "popup.css"
    "options.html"
    "options.js"
    "img/"
    "vendor/"
)

# Copy only necessary files
for file in "${INCLUDE_FILES[@]}"; do
    if [ -e "$PROJECT_SRC_DIR/$file" ]; then
        cp -r "$PROJECT_SRC_DIR/$file" "$BUILD_DIR/"
        echo "Copied: $file"
    else
        echo "Warning: $file not found, skipping..."
    fi
done

# Update manifest version number
echo "$ME: Updating version number in manifest to $VERSION..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$BUILD_DIR/manifest.json"

# Verify version update
NEW_VERSION=$(grep '"version"' "$BUILD_DIR/manifest.json" | sed 's/.*"version": "\([^"]*\)".*/\1/')
echo "Updated manifest version to: $NEW_VERSION"

# Package extension for Chrome
echo "$ME: Packaging extension for Chrome..."
cd "$BUILD_DIR"
zip -r "../CopyAllUrls-chrome-v${VERSION}.zip" .
cd "$ROOT_DIR"

echo "$ME: Build complete!"
echo "Package created: $ROOT_DIR/CopyAllUrls-chrome-v${VERSION}.zip"

# Clean up build directory
echo "$ME: Cleaning up build directory..."
rm -rf "$BUILD_DIR"
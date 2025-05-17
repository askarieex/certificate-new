#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Excel Directory Permission Fix Script${NC}"
echo "----------------------------------------"

# Define paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
EXCEL_DIR="$SCRIPT_DIR/excel"
LOG_DIR="$SCRIPT_DIR/api/logs"

# Create Excel directory if it doesn't exist
if [ ! -d "$EXCEL_DIR" ]; then
    echo -e "${YELLOW}Creating Excel directory...${NC}"
    mkdir -p "$EXCEL_DIR"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Excel directory created successfully.${NC}"
    else
        echo -e "${RED}✗ Failed to create Excel directory.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Excel directory already exists.${NC}"
fi

# Create logs directory if it doesn't exist
if [ ! -d "$LOG_DIR" ]; then
    echo -e "${YELLOW}Creating logs directory...${NC}"
    mkdir -p "$LOG_DIR"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Logs directory created successfully.${NC}"
    else
        echo -e "${RED}✗ Failed to create logs directory.${NC}"
    fi
else
    echo -e "${GREEN}✓ Logs directory already exists.${NC}"
fi

# Fix permissions for Excel directory
echo -e "${YELLOW}Setting permissions for Excel directory...${NC}"
chmod -R 777 "$EXCEL_DIR"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Excel directory permissions set to 777.${NC}"
else
    echo -e "${RED}✗ Failed to set Excel directory permissions.${NC}"
    exit 1
fi

# Fix permissions for logs directory
echo -e "${YELLOW}Setting permissions for logs directory...${NC}"
chmod -R 777 "$LOG_DIR"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Logs directory permissions set to 777.${NC}"
else
    echo -e "${RED}✗ Failed to set logs directory permissions.${NC}"
fi

# Set user/group ownership if running as root
if [ $(id -u) -eq 0 ]; then
    # Try to detect web server user
    WEB_USER=""
    if getent passwd www-data >/dev/null; then
        WEB_USER="www-data"
    elif getent passwd apache >/dev/null; then
        WEB_USER="apache"
    elif getent passwd nginx >/dev/null; then
        WEB_USER="nginx"
    fi

    if [ -n "$WEB_USER" ]; then
        echo -e "${YELLOW}Setting ownership to $WEB_USER...${NC}"
        chown -R "$WEB_USER:$WEB_USER" "$EXCEL_DIR"
        chown -R "$WEB_USER:$WEB_USER" "$LOG_DIR"
        echo -e "${GREEN}✓ Ownership set successfully.${NC}"
    else
        echo -e "${YELLOW}⚠ Could not detect web server user. Skipping ownership change.${NC}"
    fi
fi

# Create a test file
TEST_FILE="$EXCEL_DIR/permission-test.txt"
echo "Permission test file - $(date)" > "$TEST_FILE"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test file created successfully. Directory is writable.${NC}"
    # Clean up
    rm "$TEST_FILE"
else
    echo -e "${RED}✗ Failed to create test file. Directory is not writable.${NC}"
    exit 1
fi

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}Excel directory permissions fixed successfully!${NC}"
echo -e "${YELLOW}Path: $EXCEL_DIR${NC}"
echo -e "${GREEN}=======================================${NC}"

exit 0 
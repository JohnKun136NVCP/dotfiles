#!/bin/bash
# Install Steam on Ubuntu
# This script installs Steam on Ubuntu by adding the multiverse repository and installing the steam package.
# by source
bySource(){
    wget -O ~/steam.deb https://cdn.fastly.steamstatic.com/client/installer/steam.deb > /dev/null 2>&1
    sudo dpkg --install steam.deb > /dev/null 2>&1
    rm ~/steam.deb > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "Error installing Steam. Please check the output above for details."
        exit 1
    fi
    echo "Steam installed successfully."
    echo "You can launch Steam from the application menu or by running 'steam' in the terminal."
    echo "If you encounter any issues, please check the Steam support page for troubleshooting steps."
}
byRepository(){
    sudo add-apt-repository multiverse > /dev/null 2>&1
    sudo apt update > /dev/null 2>&1
    sudo apt install steam > /dev/null 2>&1
    echo "Steam installed successfully."
    echo "You can launch Steam from the application menu or by running 'steam' in the terminal."
    echo "If you encounter any issues, please check the Steam support page for troubleshooting steps."
}


if [ "$EUID" -ne 0 ]; then
    echo "This script must be run as root. Please use sudo."
    exit 1
else
    if [ "$1" == "-S" ]; then
        bySource
    elif [ "$1" == "-R" ]; then
        byRepository
    else
        echo "Run this script with -s to install Steam from source or -r to install from the repository."
        exit 1
    fi
fi

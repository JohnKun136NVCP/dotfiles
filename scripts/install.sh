#!/bin/bash

# This script installs programs.

#Brave installation
braveInstall(){
    sudo apt install curl
    sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg] https://brave-browser-apt-release.s3.brave.com/ stable main"|sudo tee /etc/apt/sources.list.d/brave-browser-release.list
    sudo apt update
    sudo apt install brave-browser

}
# mpv installation
mpvInstall(){
    sudo apt install mpv
}
# Spotify installation
spotifyInstall(){
    curl -sS https://download.spotify.com/debian/pubkey_C85668DF69375001.gpg | sudo gpg --dearmor --yes -o /etc/apt/trusted.gpg.d/spotify.gpg
    echo "deb https://repository.spotify.com stable non-free" | sudo tee /etc/apt/sources.list.d/spotify.list
    sudo apt-get update && sudo apt-get install spotify-client
}
# Steam installation
# This function installs Steam on Ubuntu by adding the multiverse repository and installing the steam package.
steamInstall(){
    read -p "Do you want to install using Repository or Source (r/s): " answer
    if [ "$answer" == "r" ]; then
        sudo add-apt-repository multiverse
        sudo apt update 
        sudo apt install steam > /dev/null 2>&1
    elif [ "$answer" == "s" ]; then
        wget -O ~/steam.deb https://cdn.fastly.steamstatic.com/client/installer/steam.deb
        sudo dpkg --install steam.deb 
        rm ~/steam.deb 
    if [ $? -ne 0 ]; then
        echo "Error installing Steam. Please check the output above for details."
        exit 1
    fi
    else
        echo "Invalid option. Please choose 'r' or 's'."
        exit 1
    fi
}
# Wallch installation
wallchInstall(){
    sudo apt update && sudo apt install wallch
}
# Help function
# This function displays the help message for the script.
help(){
    echo "Usage: sudo $0 [--one] [--all] [--help]"
    echo "--one: Install a single application."
    echo "--all: Install all applications."
    echo "--help: Show this help message."
    echo "Available applications: brave, mpv, spotify, steam, wallch"
    echo "Example: sudo $0 --one brave"
    echo "Example: sudo $0 --all"
    echo "Example: $0 --help"
}
# Check if the script is run as root
if [ "$EUID" -ne 0 ]; then
    echo "This script must be run as root. Please use sudo."
    help
    exit 1
else
    # Check if the user has provided an argument
    if [ $# -eq 0 ]; then
        echo "No arguments provided. Please provide an argument."
        exit 1
    elif [ "$1" == "--one" ];then
        if ["$2" == "brave" ];then
            braveInstall > /dev/null 2>&1
        elif ["$2" == "mpv" ];then
            mpvInstall > /dev/null 2>&1
        elif ["$2" == "spotify" ];then
            spotifyInstall > /dev/null 2>&1
        elif ["$2" == "steam" ];then
            steamInstall >  /dev/null 2>&1
        elif ["$2" == "wallch" ];then
            wallchInstall > /dev/null 2>&1
        else
            echo "Invalid argument. Please provide a valid argument."
            exit 1
        fi
    elif [ "$1" == "--all" ];then
        braveInstall > /dev/null 2>&1
        mpvInstall > /dev/null 2>&1
        spotifyInstall > /dev/null 2>&1
        steamInstall > /dev/null 2>&1
        wallchInstall > /dev/null 2>&1
    elif [ "$1" == "--help" ];then
        help
        exit 0
    elif [ "$1" == "--one" ];then
        if ["$2" == "brave" ];then
            braveInstall > /dev/null 2>&1
        elif ["$2" == "mpv" ];then
            mpvInstall > /dev/null 2>&1
        elif ["$2" == "spotify" ];then
            spotifyInstall > /dev/null 2>&1
        elif ["$2" == "steam" ];then
            steamInstall >  /dev/null 2>&1
        elif ["$2" == "wallch" ];then
            wallchInstall > /dev/null 2>&1
        else
            echo "Invalid argument. Please provide a valid argument."
            exit 1
        fi
    elif [ "$1" == "--all" ];then
        braveInstall > /dev/null 2>&1
        mpvInstall > /dev/null 2>&1
        spotifyInstall > /dev/null 2>&1
        steamInstall > /dev/null 2>&1
        wallchInstall > /dev/null 2>&1
    else
        echo "Invalid argument. Please provide a valid argument."
        exit 1
    fi
    echo "Installation completed successfully."
    echo "You can launch the installed applications from the application menu or by running their respective commands in the terminal."
    echo "If you encounter any issues, please check the respective support pages for troubleshooting steps."
    echo "Thank you for using this script!"
fi
#!/bin/bash
# This script is used to launch the Kitty terminal emulator with specific configurations.
sudo apt install kitty -y
# Check if the Kitty terminal is installed
if ! command -v kitty &> /dev/null
then
    echo "Kitty terminal could not be found. Please install it first."
    exit 1
fi
# Create symbolic links to add kitty and kitten to PATH (assuming ~/.local/bin is in
# your system-wide PATH)
ln -sf ~/.local/kitty.app/bin/kitty ~/.local/kitty.app/bin/kitten ~/.local/bin/
# Place the kitty.desktop file somewhere it can be found by the OS
cp ~/.local/kitty.app/share/applications/kitty.desktop ~/.local/share/applications/
# If you want to open text files and images in kitty via your file manager also add the kitty-open.desktop file
cp ~/.local/kitty.app/share/applications/kitty-open.desktop ~/.local/share/applications/
# Update the paths to the kitty and its icon in the kitty desktop file(s)
sed -i "s|Icon=kitty|Icon=$(readlink -f ~)/.local/kitty.app/share/icons/hicolor/256x256/apps/kitty.png|g" ~/.local/share/applications/kitty*.desktop
sed -i "s|Exec=kitty|Exec=$(readlink -f ~)/.local/kitty.app/bin/kitty|g" ~/.local/share/applications/kitty*.desktop
# Make xdg-terminal-exec (and hence desktop environments that support it use kitty)
echo 'kitty.desktop' > ~/.config/xdg-terminals.list

cp ~/.config/kitty/kitty.conf ~/.config/kitty/kitty.conf.bak
# Create the kitty configuration directory if it doesn't exist
mkdir -p ~/.config/kitty
# Create the kitty configuration file if it doesn't exist
if [ ! -f ~/.config/kitty/kitty.conf ]; then
    touch ~/.config/kitty/kitty.conf
fi
# Add the configuration to the kitty.conf file
cat kitty.conf >> ~/.config/kitty/kitty.conf
touch ~/.config/kitty/current-theme.conf
cat current-theme.conf >> ~/.config/kitty/current-theme.conf
# Add the configuration to the kitty.conf file
touch ~/.config/kitty/Catppuccin-Macchiato.conf
cat Catppuccin-Macchiato.conf >> ~/.config/kitty/Catppuccin-Macchiato.conf
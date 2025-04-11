#!/bin/bash
# Set environment variables
# This script sets up the environment variables required for running GUI applications
# in a KDE Plasma desktop environment. It includes:
# 
# 1. PATH: Ensures the script has access to standard system binaries.
# 2. DISPLAY: Specifies the X server display to use (default is :0).
# 3. XDG_RUNTIME_DIR: Sets the runtime directory for the current user, 
#    dynamically determined based on the user's ID.
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export DISPLAY=:0
export XDG_RUNTIME_DIR=/run/user/$(id -u)

# Get the number of connected monitors
MONITOR_COUNT=$(xrandr --query | grep " connected" | wc -l)
# This script sets the wallpaper for KDE Plasma desktop environment.
# It uses the `qdbus` command to interact with the Plasma desktop and set the wallpaper.
# directory where the wallpapers are stored is specified in the variable `wallpaperDir`.
wallpaperDir="$1"
# The script randomly selects a wallpaper from the specified directory and sets it as the current wallpaper.
wallpaperRandomFile1="$wallpaperDir$(ls "$wallpaperDir" | shuf -n 1)"
wallpaperRandomFile2="$wallpaperDir$(ls "$wallpaperDir" | shuf -n 1)"
#echo "Number of monitors: $MONITOR_COUNT"
echo "Random wallpaper 1: $wallpaperRandomFile1"
echo "Random wallpaper 2: $wallpaperRandomFile2"

# The script uses the `plasmashell` command to set the wallpaper for each monitor.
if [ "$MONITOR_COUNT" -eq 1 ]; then
    # Apply wallpaper for a single monitor
    plasma-apply-wallpaperimage "$wallpaperRandomFile1"
elif [ "$MONITOR_COUNT" -eq 2 ]; then
    wallpaperRandomFile2="$wallpaperDir$(ls "$wallpaperDir" | shuf -n 1)"
    dbus-send --session --dest=org.kde.plasmashell --type=method_call /PlasmaShell org.kde.PlasmaShell.evaluateScript string:"
    var Desktops = desktops();
    Desktops[0].wallpaperPlugin = 'org.kde.image';
    Desktops[0].currentConfigGroup = ['Wallpaper', 'org.kde.image', 'General'];
    Desktops[0].writeConfig('Image', 'file://${wallpaperRandomFile1}');
    Desktops[1].wallpaperPlugin = 'org.kde.image';
    Desktops[1].currentConfigGroup = ['Wallpaper', 'org.kde.image', 'General'];
    Desktops[1].writeConfig('Image', 'file:///${wallpaperRandomFile2}');
    "
else
   echo "Something is wrong"
fi

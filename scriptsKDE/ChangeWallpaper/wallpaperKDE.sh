#!/bin/bash

export DISPLAY=:0
export XDG_RUNTIME_DIR=/run/user/$(id -u)

wallpaperDir="$1"
wallpaperRandomFile1="$wallpaperDir/$(ls "$wallpaperDir" | shuf -n 1)"
wallpaperRandomFile2="$wallpaperDir/$(ls "$wallpaperDir" | shuf -n 1)"

qdbus org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript "
var Desktops = desktops();
Desktops[0].wallpaperPlugin = 'org.kde.image';
Desktops[0].currentConfigGroup = ['Wallpaper', 'org.kde.image', 'General'];
Desktops[0].writeConfig('Image', 'file://${wallpaperRandomFile1}');
Desktops[0].reloadConfig();
Desktops[1].wallpaperPlugin = 'org.kde.image';
Desktops[1].currentConfigGroup = ['Wallpaper', 'org.kde.image', 'General'];
Desktops[1].writeConfig('Image', 'file://${wallpaperRandomFile2}');
Desktops[1].reloadConfig();
"

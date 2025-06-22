#!/bin/bash

export DISPLAY=:0
export XDG_RUNTIME_DIR=/run/user/$(id -u)

wallpaperDir="$1"

if [ ! -d "$wallpaperDir" ]; then
    echo "Error: Wallpaper directory not found!"
    exit 1
fi

wallpaper1="file://$wallpaperDir/$(ls "$wallpaperDir" | shuf -n 1)"
wallpaper2="file://$wallpaperDir/$(ls "$wallpaperDir" | shuf -n 1)"

dbus-send --session --dest=org.kde.plasmashell \
--type=method_call /PlasmaShell org.kde.PlasmaShell.evaluateScript string:"
var allDesktops = desktops();
for (var i = 0; i < allDesktops.length; i++) {
    d = allDesktops[i];
    if (d.screen === 0) {
        d.wallpaperPlugin = 'org.kde.image';
        d.currentConfigGroup = ['Wallpaper', 'org.kde.image', 'General'];
        d.writeConfig('Image', '$wallpaper1');
    } else if (d.screen === 1) {
        d.wallpaperPlugin = 'org.kde.image';
        d.currentConfigGroup = ['Wallpaper', 'org.kde.image', 'General'];
        d.writeConfig('Image', '$wallpaper2');
    }
}
"

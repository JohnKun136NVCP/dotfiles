import os
import random
import subprocess

# Set environment variables
os.environ["PATH"] = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
os.environ["DISPLAY"] = ":0"
os.environ["XDG_RUNTIME_DIR"] = f"/run/user/{os.getuid()}"

# Function to get the number of connected monitors
def get_monitor_count():
    result = subprocess.run(
        ["xrandr", "--query"], capture_output=True, text=True
    )
    connected_monitors = [
        line for line in result.stdout.split("\n") if " connected" in line
    ]
    return len(connected_monitors)

# Function to select a random wallpaper from the given directory
def select_random_wallpaper(wallpaper_dir):
    wallpapers = os.listdir(wallpaper_dir)
    return os.path.join(wallpaper_dir, random.choice(wallpapers))

# Main function to set wallpapers
def set_wallpapers(wallpaper_dir):
    monitor_count = get_monitor_count()
    wallpaper_1 = select_random_wallpaper(wallpaper_dir)
    wallpaper_2 = select_random_wallpaper(wallpaper_dir)

    if monitor_count == 1:
        # Apply wallpaper for a single monitor
        subprocess.run(["plasma-apply-wallpaperimage", wallpaper_1])
    elif monitor_count == 2:
        script = f"""
        var Desktops = desktops();
        Desktops[0].wallpaperPlugin = 'org.kde.image';
        Desktops[0].currentConfigGroup = ['Wallpaper', 'org.kde.image', 'General'];
        Desktops[0].writeConfig('Image', 'file://{wallpaper_1}');
        Desktops[1].wallpaperPlugin = 'org.kde.image';
        Desktops[1].currentConfigGroup = ['Wallpaper', 'org.kde.image', 'General'];
        Desktops[1].writeConfig('Image', 'file://{wallpaper_2}');
        """
        subprocess.run([
            "dbus-send", "--session", "--dest=org.kde.plasmashell", 
            "--type=method_call", "/PlasmaShell", 
            "org.kde.PlasmaShell.evaluateScript", f"string:{script}"
        ])
    else:
        print("Something is wrong")

# Directory containing wallpapers
wallpaper_dir = os.path.join(os.environ["HOME"], "YOUR_WALLPAPER_PATH")
set_wallpapers(wallpaper_dir)
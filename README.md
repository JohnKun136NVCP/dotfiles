# My-dotfiles Version The quintessential quintuplets (Itsuki)
My GNOME theme based on Ubuntu Linux. Main theme is The Quintessential Quintuplets - Itsuki on main branche there are some scritps extra that I use on this distro.

<p align="center">
	<img src="img/itsuki-promt.png">
</p>

<h1 align="center"> Main Packets on this distro.</h1>

1. MPV
2. Script startup good morning to night with a anime voice.

<h1 align="center"> Wallpapers.</h1>

<p align="center">
	<img src="wallpaper/itsuki_Terminal.jpg">
</p>


>Itsuki terminal wallpaper.

<p align="center">
	<img src="wallpaper/itsuki_wallpaper.png">
</p>

>Itsuki wallpaper.

<h1 align="center"> Neofetch.</h1>

Based on Nakano Itsuki. This is original picture, but *braille ascii* on directory neofetch.

<p align="center">
	<img src="img/itsukichan.jpg">
</p>

<h1 align="center"> Install packets </h1>

**NOTE**: This script is important if you want to install sounds to startup own operating system.


	cd scripts/mpv-install.sh

Then give perssions:

	chmod +x  mpv-install.sh

And Run it:

	./mpv-install.sh

**Warning**: You will need to modificate .time_so.sh because this on my path, you will need to do your path. For example:

   mpv --no-video ~/your/path/.oha.mp3

Finally,to install startup service, you will need put .time_so.sh as startup services.
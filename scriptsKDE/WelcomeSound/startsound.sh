#!/bin/bash
hour=$(date +%H)
dir="$HOME/Documentos/startedSound/"
dir_en="$HOME/Documents/startedSound/"
if [ -d "$dir" ] || [ -d "$dir_en" ];then
	if [ "$hour" -lt 12 -a "$hour" -ge 0 ]; then
		mpv --no-video ~/Documentos/startedSound/ohayou.mp3 > /dev/null 2>&1
	elif [ "$hour" -lt 19 -a "$hour" -ge 12 ]; then
		mpv --no-video ~/Documentos/startedSound/konnichiwa.mp3 > /dev/null/ 2>&1
	else
		mpv --no-video ~/Documentos/startedSound/yahoo.mp3 > /dev/null/ 2>&1
	fi

else
	echo "Directories not found, please check if they exist or the file exist"
fi

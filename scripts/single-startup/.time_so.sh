#!/bin/bash
hour=$(date +%H)
echo "Empieza"
if [ "$hour" -lt 12 -a "$hour" -ge 0 ]; then
	mpv --no-video ~/Música/.startupMusic/.oha.mp3
elif [ "$hour" -lt 19 -a "$hour" -ge 12 ]; then
	mpv --no-video ~/Música/.startupMusic/.konichiwa.mp3
else
	mpv --no-video ~/Música/.startupMusic/.yahoo.mp3
fi

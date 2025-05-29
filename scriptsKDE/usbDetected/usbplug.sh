#!/bin/bash
USB_PLUG_SOUND="Ara-Ara-sound-effect.m4a"
USB_UNPLUG_SOUND="Anime-bye-bye.m4a"
# Monitor udev for USB connection events
EVENT_LOG="/tmp/usb_event.log"
touch "$EVENT_LOG"

udevadm monitor --subsystem-match=usb | while read -r line; do
    if echo "$line" | grep -q "add"; then
        last_event=$(tail -n 1 "$EVENT_LOG")
        if [[ "$last_event" != "add" ]]; then
            echo "add" > "$EVENT_LOG"
            mpv --no-video "$USB_PLUG_SOUND" > /dev/null 2>&1
        fi
    elif echo "$line" | grep -q "remove"; then
        last_event=$(tail -n 1 "$EVENT_LOG")
        if [[ "$last_event" != "remove" ]]; then
            echo "remove" > "$EVENT_LOG"
            mpv --no-video "$USB_UNPLUG_SOUND" > /dev/null 2>&1
        fi
    fi
done

#!/bin/bash
vscode(){
	redirectUrl="$(curl --silent 'https://code.visualstudio.com/sha/download?build=stable&os=linux-deb-x64' | grep -oP '(?<=Found\. Redirecting to )\S+')"
	getSha="$( echo "$redirectUrl" | grep -oP '[a-f0-9]{40}')"
	if [ ! -f shaupdates.txt ]; then
		touch "shaupdates.txt"
	else
		if grep -q "$getSha" "shaupdates.txt"; then
			echo "Already exist version..."
			sleep 1
		else
			echo "$getSha" >> "shaupdates.txt"
			echo "Dowloading actual version of VS"
			curl -O "$redirectUrl"
			echo "Installing VS updated. Please write your SUDO password"
			sudo dpkg -i *.deb
		fi
	fi
}
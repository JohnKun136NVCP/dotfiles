#To fix errors before apply doki-doki themes
code --install-extension -lehni.vscode-fix-checksums
#Permissions to extension
sudo chown -R $(whoami) /usr/share/code/
#if you've installed doki-doki themes before
sudo chown -R $(whoami) /usr/share/code/resources/app/out/vs/workbench


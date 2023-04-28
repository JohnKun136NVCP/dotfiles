# My dotfiles

Welcome to my dotfiles configuration (Linux based on Ubuntu). Here will fine my main configuations in every distro as Grub configurations, coulor icons, some scripts, Grub theme and some colours terminal.

![](https://media.tenor.com/o-0LaJK3qWcAAAAC/yamada-ryou-yamada-ryo.gif)



# Terminal emulator (Tilix)

Tilix is userful if you want to use many terminals at same time. However, for a neofetch picture appear on this terminal, will not do it. I recommend use *Kitty terminal*. Tilix is terminal I use.

    sudo apt install tilix

There is an issue that Tilix redirects to its official website to configure your *.bashrc* or *.zshrc*, but check the file on this path since it's changed.

![](https://i.pinimg.com/originals/c1/16/12/c11612b4a8bc754d82e4025aab7dc11d.gif)


# Themes on terminal emulator (Gogh)
Clone the repository

    git clone https://github.com/Gogh-Co/Gogh.git

Give permissions:

    chmod +x *.sh

**Warning**: Sometimes there is a bug on some distros with gogh. Close terminal and open a new terminal and go to path you saved the repository. Finally, execute this command:
    
    ./gogh.sh

And follow the instructions on the repository.


![](https://media.tenor.com/2c7diqh1oVIAAAAC/anime-computer.gif)

# Grub theme.
Touhou grub theme and more. Get it [here](https://github.com/JohnKun136NVCP/GRUB-Theme).

![](/img/grubtheme.png)

All instructions on the repository, but they are here.

    git clone https://github.com/JohnKun136NVCP/GRUB-Theme.git

    cd GRUB-Theme 
Choose your theme (in my case is Touhou Project)

    cd Touhou\ Project/ 

Give the permissions

    chmod +x *.sh

Install it.

    sudo ./install.sh

or

    sudo sh install.sh

Finally:

    sudo update-grub

# Scripts.

There are some scripts that it will useful.

Brave (Browser)

    chmod +x brave.sh

And run it.

    ./brave.sh


# Themes icons, windows and cursors.
GNOME needs an extra tool, for KDE plasma is not necessary.

    sudo apt-get install gnome-tweak-tool

For icons and cursos create a directory hidden with name *.icons*. Also, make it with name *.themes*. I use *candy icons*, *Sweet-cursos* and *Sweet-Dark*. However, you can find more [here](https://www.gnome-look.org/find?search=sweet).

![](/img/themes-sweet.png)

# Thank you

![](https://pa1.narvii.com/5803/e23c08fdf2a1cd31913a7f650889a11de34f8c89_hq.gif)
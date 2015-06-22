# Live Version
This project has a post-push-hook to:
http://acjim.pwn.it/


# Deprecated?

## Requirements
- [VirtualBox](https://www.virtualbox.org/)
- [Vagrant](https://www.vagrantup.com/)
- Recommended IDE [PhpStorm](https://www.jetbrains.com/phpstorm/) ([support for Vagrant](http://blog.jetbrains.com/phpstorm/files/2013/08/vagrantup.png)), maybe [WebStorm](https://www.jetbrains.com/webstorm/)

## Setup
1. Open the file [puphpet/config.yaml](/puphpet/config.yaml) and change the line `source: 'C:\\Users\\Felix\\Dropbox\\www\\acjim\\frontend'` to your local checkout (leave *\frontend*, \\\\ is Windows style).
2. cd into your local acjim directory and run `vagrant up`
3. grab a cup of coffee!
4. add www.acjim.dev to your hosts file and point it to 192.168.56.101
5. browse to http://www.acjim.dev

## Logins
- [RabbitMQ Managment Console](http://www.acjim.dev:15672/) login guest/guest
- SSH to your Virtual Machine: Use Port 2223 and the Keyfile under puphpet\files\dot\ssh\id_rsa.ppk
#!/bin/sh
cp /vagrant/puphpet/files/exec-once/rabbitmq.config /etc/rabbitmq/rabbitmq.config
sudo /usr/sbin/rabbitmq-plugins enable rabbitmq_web_stomp
rabbitmqctl add_user guest guest
rabbitmqctl set_user_tags guest administrator
rabbitmqctl set_permissions -p / guest ".*" ".*" ".*"
/etc/init.d/rabbitmq-server restart
#!/usr/bin/env bash

ansible-playbook -vvv -e @.config.yml plays/load-ip2location-data.yml
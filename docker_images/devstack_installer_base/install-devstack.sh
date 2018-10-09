#!/usr/bin/env bash

ansible-playbook -vvv -e @.config.yml plays/base-install.yml

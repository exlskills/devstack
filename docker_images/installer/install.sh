#!/usr/bin/env bash

ansible-playbook -vvv --extra-vars="@plays/data/common.yml" plays/base-install.yml

# tail -f /dev/null
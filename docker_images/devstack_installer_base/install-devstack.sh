#!/usr/bin/env bash

ansible-playbook -vvv \
        --extra-vars="@plays/config/control.yml" \
        --extra-vars="@plays/config/network_footprint.yml" \
        --extra-vars="@plays/config/common.yml" \
        --extra-vars="@plays/config/stack_scope.yml" \
   plays/base-install.yml

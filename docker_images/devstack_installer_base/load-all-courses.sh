#!/usr/bin/env bash

# Create or update all-courses.yml
npx babel-node src/get-list-of-course-repos

# Load each course from all-courses.yml
ansible-playbook -vvv -e @.config.yml -e @all-courses.yml -e install_eocsutil=$1 plays/load-all-courses.yml
#!/usr/bin/env bash

# Create or update all-courses.yml
npx babel-node src/get-list-of-course-repos

# Load each course from all-courses.yml
ansible-playbook -vvv -e @.config.yml -e @all-courses.yml plays/load-all-courses.yml
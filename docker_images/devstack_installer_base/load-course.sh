#!/usr/bin/env bash

ansible-playbook -vvv -e @.config.yml -e course_repo_url=$1 -e clone_course_repo=$2 plays/load-course.yml
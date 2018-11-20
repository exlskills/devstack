# EXLskills Devstack
  This repo contains docker-compose.yml file used to to start up the backend for front-end work

## Requirements

You may be able to get away with more/less than what's described below, but we can't recommend anything outside of these options:

Operating Systems:

- Ubuntu 16.04
- OS X 10.13+
- Windows has not been addressed yet, although it should work, conceptually. Windows-related contributions are welcome

Other Dependencies:

- Docker
- Docker compose (https://docs.docker.com/compose/install)

### Disk Space

- allow 5Gb for Docker Image storage 
- 2Gb+ for Development code with `node_modules` and builds
- <1Gb for Data

### Memory
Please allow enough memory for the Browser client and IDE.  
The recommendations below are approximate. Use `docker stats` to view the actual usage by service  

- Devstack installer container's Ansible process during the installation - <1Gb

- Devstack components total at runtime: ~3.5Gb 
  * Keycloak container - 512Mb
  * Elasticsearch container - <1.5Gb
  * MongoDB and MySQL containers - 512Mb combined
  * 3 generic NodeJS server containers - 600Mb combined
  * Other - insignificant
     

## Overview

As EXLskills stack is comprised of multiple independently running components, development and testing of an individual component requires a proper orchestrating of the entire dev runtime environment. The philosophy behind the EXLskills devstack is as follows: 
- "(next to) zero" local software requirements - just a common dev box OS and Docker with Docker compose. No complex prerequisites to install, maintain and upgrade locally, no versioning or port conflicts with other projects
- direct access to the code from the local machine's console and IDE of choice
- easy switch between the Development (the code is being worked on) vs. Auxiliary (supporting the stack runtime) mode for each given component - one install can be used for Front End and/or Back End components' development, seamlessly
- full clarity of what, where and how is installed - traceable via discrete configuration files and easily understood, human-readable code snippets. Here comes the use of simplified Ansible playbooks over convoluted shell scripting run via a Makefile    

NOTE: knowledge of Ansible is not required to configure, use and maintain this project. See "Ansible Playbook Structure Overview" below for a simple explanation of the installer code structure. The approach taken is to keep the Ansible code simple, straight-forward and as free of tricks and obscure operations as possible 

The entire installation process is carried out by a designated `installer` container, which is a part of the "initialization" block of the stack's Docker compose services (`devstack/docker-compose-ini.yml`). The container is built from `exlskills/devstack-installer-base` Ubuntu 16.04 image, which comes with all the standard software required for the stack's components installation. Note, that the image is loaded with specific versions of the software and should be re-built as requirements change. The size of the image is just under 2Gb.  
Within the running stack, the base image is further updated (see `devstack/docker_images/devstack_installer_user/Dockerfile`) to match its User with the local machine's User, so that the latter gets the ownership of the installed stack's components.   
The `installer` container has a volume share mapped to the designated local folder, where this repository is initially cloned into as a subdirectory, so that the installer has access to the Ansible code. All repositories in scope then subsequently are cloned into the same designated local wrapper folder by the `installer` process.          

## Passwords 

Note, that all services are exposed on the corresponding host's ports but generally are not accessible from external points that don't have access to those ports on the host 

### MongoDB and Elasticsearch
Open access 
### MySQL 
Root password and initial user's ceredentials (used by Keycloak) are hardcoded in `docker-compose-ini.yml` 
### Keycloak 
Admin password and MySQL connection credentials are hardcoded in `docker-compose-ini.yml`. Test users' credentials are in `STACK SCOPE` section of `.config.yml`. Note, that the test users are configured in Keycloak to require a password change on first login - once changed, Keycloak-stored passwords are encoded and can only be reset via the Admin Console (`http://localhost:<KEYCLOAK_HOST_PORT>/auth`).    
### Other 
`.config.yml` contains credentials and tokens that are either dummy or can only be used for anonymous / public testing 

## Installation

NOTE: for the Minimal Configuration installation, see [docs/minimal-configuration-install.md](https://github.com/exlskills/devstack/blob/master/docs/minimal-configuration-install.md) 

- Chose an existing user id on the local machine to perform the devstack work under, e.g., `ubuntu`. All folders and components will be set up with the ownership of this user 
- Login with or switch to the user id 
- Create a "base" directory for EXLskills Devstack projects; enter the directory, e.g.
```
mkdir ~/exlskills-dev
cd ~/exlskills-dev
```
- Clone this repository into the `devstack` folder under the "base" directory and enter the folder:
```
git clone https://github.com/exlskills/devstack -b master devstack  
cd devstack
```
- Copy the following cloned files so that the local configuration is preserved during future updates: 
```
cp .default.env .env
cp .default.config.yml .config.yml 
cp default.docker-compose-ini.yml docker-compose-ini.yml
```
- Review and update `.env` file which is used by `docker-compose` to map configuration and environment data during the installation. Per `docker-compose` standard, the content should be in the form of `KEY=VALUE` lines.   
```
vm .env
```
The content of `.env` file should be as follows:

| Variable Name | Sample Value | Description |
|----------|----------|----------|
|EXL_DEVSTACK_WORKSPACE|/home/ubuntu/exlskills-dev|full path of the devstack base installation directory|
|EXL_DEVSTACK_USER|ubuntu|local user to work with the devstack|
|EXL_DEVSTACK_UID|1000|"uid" of the user - find using `id` command, e.g., `id ubuntu`|
|EXL_DEVSTACK_GID|1000|"gid" of the user's group - as returned by the `id` command|
|KEYCLOAK_HOST_PORT|8082|an available local machine port to expose devstack Keycloak service on| 
|MONGO_HOST_PORT|27017|an available local machine port to expose devstack MongoDB service on|
|MEMCACHED_HOST_PORT|11211|an available local machine port to expose devstack Memcached service on|
|MYSQL_HOST_PORT|3306|an available local machine port to expose devstack MySQL service on|
|ELASTICSEARCH_HOST_PORT|9200|an available local machine port to expose devstack Elasticsearch service on|
|MONGO_DB_NAME|exldev|the name of the exlskills database to be created in the MongoDB service|

Note, in the current design, some of the above information is duplicated in the `.config.yml` file (described below) and if changed - should be updated in both places  

- Set `docker-compose` environment flag to suppress warnings when using `up` command in stages:
```
export COMPOSE_IGNORE_ORPHANS=1
```
- Create directory for data volumes used by the containers (optional, to assign the ownership to the host's user; subdirectories will have ownership per docker-compose and containers' users) 
```
mkdir ../data
```

Note, when updating the stack, changes to MySQL service may not take effect unless `../data/var-lib-mysql` folder is removed (`sudo rm -rf ...`) and re-created 


- Review and update `.config.yml` file which contains parameters used by the installation process executed by the installer container 
```
vi .config.yml
```

`NETWORK FOOTPRINT` section defines the following parameters: 

`host_dockernetwork_ip` - in standard docker networking, the value is `172.17.0.1`. See `docker_compose` below for additional considerations  
`ports_on_host` - the list of local machine ports to assign to EXLdevstack individual services. Ensure those are available or change as needed   
`docker_compose` values for `network_name` and `domain_suffix` - as there may be other `docker-compose` projects running on the local machine, the network naming and configuraton may need to be adjusted to avoid any potential overlaps   

(NOTE: in the current design, some of this information is duplicated in `docker-compose-ini.yml` and has to be updated in both places:  
`docker-compose` network name and domain suffix)  

`STACK SCOPE` section contains setup information for the individual services and project in the devstack's scope. See "Devstack Scope Configuration" below for detailed information. Note, that this configuration can be changed and reapplied anytime after the installation, so the suggested default can be sufficient for the initial setup  

(NOTE: in the current design, some of this information is duplicated in `.env` and has to be updated in both places:  
Keycloak, mongo, mysql and memcached ports on the local machine)   

- On Unix only, if you'd like the installer's container system clock to be coordinated with the host, uncomment this line in `docker-compose-ini.yml`: 
```
- /etc/localtime:/etc/localtime:ro
```

TODO: review if similar mapping is available on Mac/iOS 


- From the `devstack` cloned project directory, run `docker-compose` `build` using the `docker-compose-ini.yml` file to build the container for the `installer` service. The process will pull `exlskills/devstack-installer-base` image and configure it with the selected local user information 
```
docker-compose -f docker-compose-ini.yml build --pull
```

(`--pull` indicates that the process will always check the Docker Repository for the most current version of the references image(s) and pull if the local image is older)   

- Create and start `mysql`. Wait till the log indicates that the server is up: `mysqld: ready for connections` (should be just a few seconds)    
```
docker-compose -f docker-compose-ini.yml up -d mysql
docker logs mysql.exlskills
```
- Create and start the `installer`, `keycloak`, and devstack data support services. Note, this will not kick off the actual stack installation process just yet: 
```
docker-compose -f docker-compose-ini.yml up -d
```
- Ensure that Keycloak has started by going to `http://localhost:<KEYCLOAK_HOST_PORT from .env>` - "Welcome to Keycloak" page should come up.  

- Log in to the `bash shell` of the installer container and run the installation  
```
docker-compose -f docker-compose-ini.yml exec installer bash
```
or 
```
docker exec -it installer.exlskills bash
``` 
The `bash` starts in `/hostlink` directory on the container, which is mapped to the `devstack` folder on the host  
Run the installation (this will execute the Ansible process and output detailed information to the console):
```
. /install-devstack.sh
```
The process takes about 15 minutes.  
As the Ansible steps successfully complete (zero `failed` count in the `PLAY RECAP`), `docker-compose.yml` file will be created in the `devstack` folder on the host. Exit the installer's `bash` and review the file
```
exit
vi docker-compose.yml
```
- If the generated `docker-compose.yml` file contains `build` directives (it will, in the default configuration), run the `docker-compose` `build` process. Note, the `-f` parameter used in the earlier steps is not needed anymore when working with services described in the default `docker-compose.yml` file: 
```
docker-compose build --pull
```
- Create and start the core devstack services: 
```
docker-compose up -d
```
This completes the installation. Devstack state after the installation:  
- all repositories in scope have been cloned into corresponding folders under the base devstack local machine directory
- npm packages have been loaded, applicable builds executed
- keycloak client has been configured and test users created as per `.config.yml` ` STACK SCOPE test_users` section
- mongo db has been initiated and loaded with the required (minimal) configuration data
- courses listed in as per `.config.yml` `STACK SCOPE courses_to_load` section have been cloned into `<EXL_DEVSTACK_WORKSPACE>/courses/` directory on the host and loaded into the database 
- other test data load is TBD-WIP
- EXLskills services have been running and accessible on the `localhost` at ports per `.config.yml` `NETWORK FOOTPRINT ports_on_host` section

### Running
(use the port specified in `.config.yml` `NETWORK FOOTPRINT ports_on_host` `spf_server`)
```
http://localhost:3000/learn
```

### Installer Service

After the installation completion, the `installer` service can be left running or stopped. In the idle state, it does not take up any resources (not counting the size of its relatively large image as mentioned above, which cannot be purged till the container is destroyed). However, the memory acquired during the installation is not released till the `installer` is restarted.     
The `installer` service can be utilized to run refreshes, rebuilds, reloads, additional courses conversion, etc., vs. executing those on the local machine.   
To stop the service, run form the local machine's `devstack/` folder: 
```
docker-compose -f docker-compose-ini.yml stop installer
``` 

To release the memory and keep the service available, run form the local machine's `devstack/` folder: 
```
docker-compose -f docker-compose-ini.yml restart installer
``` 

### Stopping (Restarting) Individual Services
Services may need to be stopped, e.g., when the corresponding server is under developed and being run from the local IDE. To stop a service, run form the local machine's `devstack/` folder:  
```
docker-compose stop <service name as in docker-compose.yml>
``` 
This doesn't remove the container, just releases the host's port the service was operating on. The container can be started back by using the `start` keyword. Depending on how the container's service is set up, the restart may or may not cause the code reload - this should be reviewed individually for each container  

### Refreshing Services
After the underlying code and/or configuration update, a service can be "refreshed" by simply restarting it, if it is configured to read code/configuration at startup, or by recreating the container. Run form the local machine's `devstack/` folder:  
```
docker-compose up -d --force-recreate --no-deps <service name as in docker-compose.yml>
```
To recreate all services:
```
docker-compose up -d --force-recreate 
```

Notes:
- Nginx-based services configured with `service_setup_method` set to `run-image-prod` should be restarted after code base rebuild to pick up the changed chunk IDs   
- as Keycloak is configured with a MySQL database backend persisting data on the host's drive, test user/passwords should remain intact after the stack is recreated  

### Auto-restart on Host or Docker Reboot 
Per `restart: unless-stopped` specification in the docker-compose YAML files for each service, the stack should automatically start up if it was running before the host's OS or Docker daemon reboot     

## Additional Courses Conversion and Load

- Start the installer container if not running 
- Log in to the `bash shell` of the installer container and run the installation  
```
docker-compose -f docker-compose-ini.yml exec installer bash
```
or 
```
docker exec -it installer.exlskills bash
``` 
- Run `/load-course.sh` script passing the Course repository clone URL and a flag `true` to clone the repository's content, e.g.  
```
cd /hostlink
. /load-course.sh https://github.com/exlskills/micro-course-java-arrays.git true

``` 

The course will be cloned into `<EXL_DEVSTACK_WORKSPACE>/courses/` directory on the host and loaded into the database  

### Running Conversion of Local Courses 

To bypass the git clone step in the process, pass `false` as the flag's value, e.g.,  
```
. /load-course.sh https://github.com/exlskills/micro-course-java-arrays.git false

``` 

The load will be performed from the host's `<EXL_DEVSTACK_WORKSPACE>/courses/` folder with the same name as the name of the repository, e.g., `micro-course-java-arrays`    

### Updating EOCSUTIL

```
cd /hostlink
. /update-eocsutil.sh
```

## Bulk Reload and Re-conversion of all Courses 

In the `installer`, run 
```
cd /hostlink
. /load-all-courses.sh
```

`load-all-courses.sh` gets the list of all repositories in the github `exlskills` organization and selects those that start with `course-` or `micro-course-`, the list is placed into `all-courses.yml` file. Then the process updates the `eocsutil` program and runs the repository pull and course load for each repository on the list. 
The branch of `eocsutil` used can be set in the `.config.yml` file's `eocsutil_branch` variable, as well as MongoDB `mongo_uri` and `mongo_db`. The Elasticsearch URL can be updated directly in `plays/roles/load_courses/defaults/main.yml` 
  

## Exporting and importing MongoDB Data 
- Create a folder on the host under `exlskills-dev`, e.g., `mkdir ../datadump` 
- On the installer container, run `mongodump` command:
```
cd /hostlink
mongodump --host 172.17.0.1 --out /exlskills/datadump/data01
```
This will create a copy of all MongoDB data in the `datadump/data01` directory on the host 

To bring this data back into MongoDB:
```
mongorestore --host 172.17.0.1 --drop /exlskills/datadump/data01
```
The `--drop` option is used to remove existing data before importing 

## Rebuilding Keycloak 
If the keycloak configuration has been lost - in the `installer`, run
```
cd /hostlink
ansible-playbook -vvv -e @.config.yml plays/recreate-keycloak.yml
```
This will recreate the keycloak configuration and print the Client Secret's value at the end of the process. The value should be placed into the .env file of the `auth-server` and the `auth-server` restarted  

## Building or Rebuilding Elasticsearch Index 
In the `installer`, run
```
cd /hostlink
ansible-playbook -vvv -e elasticsearch_url=https://abc.es.domain.com -e recreate_index=true plays/elasticsearch-init.yml
```
This can be used to configure Elasticsearch at a remote target location   


## Exlcode IDE and REPL services

Per current design, `exlcode.com` is the default and only IDE hosting environment for the courses. The link to it is embedded into the course's pages at the conversion and load time. The purpose of `exlcode-ide` and `exlcode-repl` services within the stack is to work with them directly vs. from the client. If not needed, those services can be turned off or removed from the `.config.yml` `STACK SCOPE`  

## Devstack Scope Configuration
See `.config.yml` `STACK SCOPE` section  

Most of the parameters and values in this YAML file are "hardcoded" in the sense that they are used to drive the preset installation logic vs. configure it. If an entire component is removed (or commented out with `#` in each line) - it will not be installed.  
The following parameters can be used to configure component's installation: 
   
### service_setup_method

| Value | Service Setup Logic |
|----------|----------|
| void | Service is not created. Use, e.g., when running manually via IDE or terminal       |
| run-image-dev | A base image is started to serve code in dev mode, e.g., Node image running `npm run start` |
| run-image-prod | Similar to `run-image-dev`, but serve objects built for production use |
| build-image | Build image in `docker-compose` process using the Dockerfile provided and run it |
| pull-image | Pull a specific image and start, e.g., a prebuilt image from docker hub |  

### clone_repo 
If set to `no`, `git clone` of the component's repository will be bypassed. Otherwise, the latest origin is always pulled. 
 
### prebuilt_image   
Used in combination with `service_setup_method` set to `pull-image` 

## Ansible Playbook Structure Overview
Ansible code is located in the `plays/` folder.  
- `base-install.yml` - the "playbook" that executes a number of "tasks" in "roles" on the `installer` container (see `hosts: 127.0.0.1` and `connection: local` at the top)
- each role's code is located in a separate folder with the role's name under `plays/roles/` directory
- the configuration for review and update is in `.config.yml` file. The keys listed in there are referred to in the other parts of code usually inside of `"{{ }}"`  
- each role's folder has a `tasks/` directory with `main.yaml` file that is run when the role is "included" from `base-install.yml` playbook. Optionally, other YAML files can be present in the folder - those are called from the `main.yaml`, e.g., inside loops or conditional flows  
- roles' `defaults/` folders contain additional variables used in the role's logic. `templates/` contain Jinja templates used to generate text files, e.g., `.env` files for the stack's services, using variables and runtime values (`facts`) 
- `files/` folders contain objects copied as-is into the destination by the process logic 
- The process is executed by calling `ansible-playbook` from the `installer` shell (see `devstack/docker_images/devstack_installer_base/install-devstack.sh`). The names of each of the `config/` YAML files are passed as the sequential arguments, in the order of the variables assignment, followed by the name of the playbook. The `-vvv` is used to enable detailed console output for review and troubleshooting if needed        

## Removing Devstack
```
docker-compose -f docker-compose-ini.yml down
docker-compose down

```
Then delete the directories and remove the images  

### Removing a Service 

Stop the service via `docker-compose stop <service name>`, then remove the stopped container via `docker rm <container name>` 

## Building Devops Setup and Maintenance Tools Image 

To utilize tools available in this repository for general Devops operations, an image similar to the devstack `installer` can be built using `docker_images/devops_setup_maint_tools/Dockerfile` and deployed on a host with required access to the stack being managed 
The content of `docker_images/devops_setup_maint_tools/load-image-content.yml` can be adjusted to the specific needs 


## License

This software is offered under the terms outlined in the [LICENSE.md](LICENSE.md) file provided with this notice. If you have any questions regarding the license, please contact [licensing@exlinc.com](mailto:licensing@exlinc.com)

## Enterprise / Commercial Licensing & Support

For enterprise licenses and/or support, please send an email enquiry to [enterprise@exlinc.com](mailto:enterprise@exlinc.com)


## Contributing

### How to contribute to this project

#### Development Environment

All development is assumed to be done on a Mac running a modern version of OS X but ought to be pretty much the same no matter what unixy environment you use.

#### Development Process

All development is to follow the [standard git-flow](http://nvie.com/posts/a-successful-git-branching-model/) process, modified to allow for code-reviews.

See this handy, if ugly, [cheat sheet](http://danielkummer.github.io/git-flow-cheatsheet/).

##### Setup

1. Fork this repo into your personal GitHub account
2. clone your fork to your local development machine
3. Set this repo as the `upstream` repo `git remote add upstream <insert the upstream url>`
4. Disallow direct pushing to upstream `git remote set-url --push upstream no_push`
5. create a local `master` branch `git checkout -b master` and test it via `git pull upstream master`
6. ensure you have installed the [`git-flow` command line helpers](https://github.com/nvie/gitflow) and [`git-flow-completion` utils](https://github.com/bobthecow/git-flow-completion) then run `git flow init -d`.

###### Optional Git Setup

Set up `git` to always `rebase` rather than merge.

```sh
git config --global branch.autosetuprebase always
```

Make sure `git` knows you are using your correct email.

```sh
git config user.email "username@domain.suffix"
```

##### Working on new features

1. Create a "feature branch" for the change you wish to make via `git flow feature start {feature_name}`. See below for how to name features.
2. Now work on your changes locally until you are happy the issue is resolved. See below for how to name commit messages.
3. `git flow feature publish {feature_name}` will push it back up to your fork on GitHub.
4. Use `git flow feature pull {remote_name} {feature_name}` to bring in any other changes, If other people have also merged changes in, and you can't merge your PR automatically you'll need to `rebase` their changes into your changes and then `--force` push the resulting changes using standard `git` commands.
5. Use GitHub to raise a Pull Request. Add labels as appropriate, and set one or more reviewers. Then paste the url of the PR into the `#development` Slack channel with a request for someone to please review the changes. See below for how to name pull requests.
6. Respond to any comments as appropriate, making changes and `git push` ing further changes as appropriate.
7. When all comments are dealt and the PR finally gets a :+1: from someone else then merge the PR. _Note we will not be using the `git flow feature finish`_ option as that merges into develop automatically without the option for review. [see this stackexchange for more on that](http://programmers.stackexchange.com/questions/187723/code-review-with-git-flow-and-github).
8. In your command-line `git checkout develop` then `git pull upstream develop` to get the latest code and `git branch -D feature/{branchname}` to delete the old feature branch.

## Automated Image Build
`exlskills/devstack-installer-base` image is built when updates are pushed into `installer-base-image-build` branch of this repository 

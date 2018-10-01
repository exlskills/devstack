# EXLskills Devstack
  This repo contains docker-compose.yml file used to to start up the backend for front-end work

## Requirements

You may be able to get away with more/less than what's described below, but we can't recommend anything outside of these options:

Operating Systems:

- Ubuntu 16.04
- OS X 10.13+
- Windows has not been thoroughly tested, although it has worked and should work... Windows-related contributions are welcome

Other Dependencies:

- Docker
- Docker compose (https://docs.docker.com/compose/install)

### Disk Space

- allow 5Gb for Docker Image storage 
- 2Gb+ for Development code with `node_modules` and builds

## Installation

- Designate an existing user id on the local machine to perform the devstack work, e.g., `ubuntu`. All folders and components will be set up under the ownership of this user id
- Login with or switch to the user id 
- Create a "base" directory for EXLskills Devstack projects; enter the directory, e.g.
```
mkdir ~/exlskills-dev
cd ~/exlskills-dev
```
- Clone this repository into the `devstack` folder under the "base" directory and enter the folder:
```
git clone https://github.com/exlskills/devstack
cd devstack
```
- Copy `.default.env` file into `.env` and update its content to reflect the folder and user selected. This file is used by `docker-compose` to map the data during the installation. Per `docker-compose` standard, the content should be in the form of `KEY=VALUE` lines
```
cp .default.env .env
vm .env
```
The content of `.env` file should be as follows:

| Variable Name | Sample Value | Description |
|----------|----------|----------|
|EXL_DEVSTACK_WORKSPACE|/home/ubuntu/exlskills-dev|full path of the devstack base installation directory|
|EXL_DEVSTACK_USER|ubuntu|local user to work with the devstack|
|EXL_DEVSTACK_UID|1000|"uid" of the user - find using `id` command, e.g., `id ubuntu`|
|EXL_DEVSTACK_GID|1000|"gid" of the user's group - as returned by the `id` command|
- Set `docker-compose` environment flag to suppress warnings when using `up` command in stages:
```
export COMPOSE_IGNORE_ORPHANS=1
```
- Create a folder for MongoDB data to ensure it is owned by the local user
```
mkdir var-lib-mongodb
```
- Review and update `plays/config/network_footprint.yml` configuration file to assigns ports to the devstack services that are not already in use on the local machine
```
vi plays/config/network_footprint.yml
```
The file defines the following parameters: 

`host_dockernetwork_ip` - in standard docker networking, the value is `172.17.0.1`. See `docker_compose` below for additional considerations  
`ports_on_host` - the list of local machine ports to assign to EXLdevstack individual services  
`docker_compose` values for `network_name` and `domain_suffix` - as there may be other `docker-compose` projects running on the local machine, the network naming and configuraton may need to be adjusted to avoid any potential overlaps  
- From the `devstack` cloned project directory, run `docker-compose` `build` using the `docker-compose-ini.yml` file to build the container for the `installer` service. The process will pull `exlskills/devstack-installer-base` image and configure it with the selected local user information 
```
docker-compose -f docker-compose-ini.yml build
```
- Review and update `plays/config/stack_scope.yml` configuration file that contains setup information for the individual services and project in the devstack's scope. See "Devstack Scope Configuration" below for detailed information. Note, that this configuration can be changed and reapplied anytime after the installation, so the suggested default can be sufficient for the initial setup 
```
vi plays/config/stack_scope.yml
```
- Create and start the `installer`, `keycloak`, `mongodb` and `memcached` devstack support services. Note, this will not kick off the installation process just yet: 
```
docker-compose -f docker-compose-ini.yml up -d
```
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
As the Ansible successfully completes (zero `failed` count in the summary), `docker-compose.yml` will be created in the `devstack` folder on the host. Exit the installer's `bash` and review the file
```
exit
vi docker-compose.yml
```
- If the generated `docker-compose.yml` file contains `build` directives (it will, in the default configuration), run the `docker-compose` `build` process. Note, the `-f` parameter used in the earlier steps is not needed anymore when working with services described in the default `docker-compose.yml` file: 
```
docker-compose build
```
- Create and start the core devstack services: 
```
docker-compose up -d
```
This completes the installation. Devstack state after the installation:  
- all repositories in scope have been cloned into corresponding folders under the base devstack local machine directory
- npm packages have been loaded, applicable builds executed
- keycloak client has been configured and test users created as per `plays/config/stack_scope.yml` `test_users` section
- mongo db has been initiated and loaded with the required (minimal) configuration data
- courses have been loaded as per `plays/config/stack_scope.yml` `courses_to_load` section
- other test data load is TBD-WIP
- EXLskills services have been running and accessible on the `localhost` at ports per `plays/config/network_footprint.yml` `ports_on_host` section

### Running
(use the port specified in `plays/config/network_footprint.yml` `ports_on_host` `web_client`)
```
http://localhost:4000
```

### Installer Service

After the installation completion, the `installer` service can be left running or stopped. In the idle state, it appears not taking up any resources. The role of the `installer` service in the devstack's lifecycle is to be documented (TODO) 
To stop the service: 
```
docker-compose -f docker-compose-ini.yml stop
``` 

### Devstack Scope Configuration
TODO - WIP 
#### service_setup_method

| Value | Service Setup Logic |
|----------|----------|
| void | Service is not created. Use, e.g., when running manually via IDE or terminal       |
| run-image-dev | A base image is started to serve code in dev mode, e.g., Node image running `npm run start` |
| run-image-prod | Similar to `run-image-dev`, but serve objects built for production use |
| build-image | Build image in `docker-compose` process using the Dockerfile provided and run it |
| pull-image | Pull a specific image and start, e.g., a prebuilt image from docker hub |  



## Basic Compose Set 

### Installation

```
git clone https://github.com/exlskills/devstack

cd devstack/basic-compose-set

npm install

```

### Running

- To start up the whole backend nstack, run ```docker-compose up -d```
- To import database dump, run ```node tasks/seed --db db_uri --dump dump_folder```. If ```db_uri``` is not specified, ```mongodb://localhost:27017/webph2_dev``` is used.

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

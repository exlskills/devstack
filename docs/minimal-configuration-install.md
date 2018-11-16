## Minimal Configuration

This configuration uses Keycloak not backed by a database - test users will not be preserved on stack rebuild 

## Installation 

The installation process is similar to that for the regular devstack, with a few steps eliminated. The process is based on a different set of pre-configured files  


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
cp .minimal.config.yml .config.yml 
cp minimal.docker-compose-ini.yml docker-compose-ini.yml
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
|MYSQL_HOST_PORT|3306|NOT USED in this configuration, leave unchanged|
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
Keycloak, memcached and mongo ports on the local machine)  
   
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

- Create and start the `installer`, `keycloak`, `memcached` and `mongodb` devstack support services. Note, this will not kick off the actual stack installation process just yet: 
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
- If the generated `docker-compose.yml` file contains `build` directives (it will NOT, in the minimal configuration), run the `docker-compose` `build` process. Note, the `-f` parameter used in the earlier steps is not needed anymore when working with services described in the default `docker-compose.yml` file: 
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
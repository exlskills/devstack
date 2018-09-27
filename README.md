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


## Full Devstack Set

TODO


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

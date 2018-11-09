#!/usr/bin/env bash

cd $GOPATH/src/github.com/exlskills/eocsutil
git reset HEAD --hard
go get -u github.com/exlskills/eocsutil
dep ensure -v
yarn install
go build
cd /hostlink

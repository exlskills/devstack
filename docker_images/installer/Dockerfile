FROM ubuntu:16.04

# Install core packages and Ansible
RUN apt-get update && \
    apt-get install -y software-properties-common && \
    apt-add-repository ppa:ansible/ansible && \
    apt-get update && \
    apt-get install -y ansible git-core vim curl wget

# Node
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
    apt-get install -y nodejs build-essential

# Yarn
RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y yarn

# Watchman
RUN apt-get install -y autoconf automake python-dev libssl-dev libtool pkg-config && \
    git clone https://github.com/facebook/watchman.git && \
    cd watchman/ && git checkout v4.9.0 && \
    ./autogen.sh && \
    ./configure && \
    make && make install

# GO
RUN add-apt-repository ppa:gophers/archive && \
    apt-get update && \
    apt-get install golang-1.10-go -y 

# Mongoimport
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5 && \
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.6.list && \
    apt-get update && apt-get install -y mongodb-org-shell=3.6.7 mongodb-org-tools=3.6.7

# sudo and misc additional packages
RUN apt-get install -y sudo python-jmespath libx11-dev

COPY ./install.sh /
COPY ./entrypoint.sh /

# Create User
ARG UNAME=ubuntu
ARG UID=1000
ARG GID=1000
RUN groupadd -g $GID $UNAME && useradd -m -u $UID -g $GID -s /bin/bash $UNAME && usermod -aG sudo $UNAME

RUN chown $UNAME:$UNAME /install.sh && chmod +x /install.sh && \
    chown $UNAME:$UNAME /entrypoint.sh && chmod +x /entrypoint.sh

RUN echo "$UNAME ALL=(ALL) NOPASSWD:ALL" | EDITOR='tee -a' visudo

USER $UNAME

# GO HOME
RUN mkdir $HOME/gopkg
ENV GOPATH=/home/$UNAME/gopkg
ENV PATH="$PATH:/usr/lib/go-1.10/bin:$GOPATH/bin"

ENTRYPOINT ["/entrypoint.sh"]

# docker build -t exl-ansible-base .

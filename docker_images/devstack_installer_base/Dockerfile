FROM ubuntu:16.04

# Core packages
RUN apt-get update && \
    apt-get install -y software-properties-common sudo git-core vim curl wget

# NodeJS
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
    apt-get install -y nodejs build-essential
RUN npm install npm@latest -g    

# Watchman
RUN apt-get install -y autoconf automake python-dev libssl-dev libtool pkg-config && \
    git clone https://github.com/facebook/watchman.git && \
    cd watchman/ && git checkout v4.9.0 && \
    ./autogen.sh && \
    ./configure && \
    make && make install

# Add repositories for and install Ansible, GoLang, Yarn, MongoDB
RUN apt-add-repository ppa:ansible/ansible && \
    add-apt-repository ppa:gophers/archive && \
    curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5 && \
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.6.list && \
    apt-get update && \
    apt-get install -y ansible golang-1.10-go yarn mongodb-org-shell=3.6.7 mongodb-org-tools=3.6.7 && \
    apt-get install -y mysql-client-5.7 libmysqlclient20

# Notes:
# - this installs the latest Ubuntu package for Ansible. To control the version, install pip and then install Ansible via pip:
#         apt-get install python-pip python-dev && pip install ansible==x.y.z.0
# - installing MongoDB shell and tools only, MySQL client only

# Misc additional packages
RUN apt-get install -y python-jmespath python-pip libx11-dev

# Additional Python Libraries for Ansible
RUN pip install PyMySQL

COPY ./*.sh /

RUN chmod +x /*.sh

CMD ["/zero-daemon.sh"]

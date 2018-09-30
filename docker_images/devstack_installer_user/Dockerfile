FROM exlskills/devstack-installer-base

# docker-compose Installer Container User - pass as arguments: 
# --build-arg UNAME=ubuntu --build-arg UID=1000 --build-arg GID=1000
ARG UNAME=ubuntu
ARG UID=1000
ARG GID=1000

# Create image user, group; set as sudo - no password; change ownership of the scripts
RUN groupadd -g $GID $UNAME && useradd -m -u $UID -g $GID -s /bin/bash $UNAME && usermod -aG sudo $UNAME && \
    echo "$UNAME ALL=(ALL) NOPASSWD:ALL" | EDITOR='tee -a' visudo && \
    chown $UNAME:$UNAME /install-devstack.sh && chown $UNAME:$UNAME /zero-daemon.sh

USER $UNAME

# Set GoLang Home and Path for the User
RUN mkdir $HOME/gopkg
ENV GOPATH=/home/$UNAME/gopkg
ENV PATH="$PATH:/usr/lib/go-1.10/bin:$GOPATH/bin"

CMD ["/zero-daemon.sh"]
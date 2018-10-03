FROM exlskills/devstack-installer-base

# docker-compose Installer Container User - pass as arguments: 
# --build-arg UNAME=ubuntu --build-arg UID=1000 --build-arg GID=1000
ARG UNAME=ubuntu
ARG UID=1000
ARG GID=1000

COPY ./setup-user.yml /

ansible-playbook -vvv -e host_gid=${GID} -e host_user=${UNAME} -e host_uid=${UID} /setup-user.yml

USER $UNAME

# Set GoLang Home and Path for the User
RUN mkdir $HOME/gopkg
ENV GOPATH=/home/$UNAME/gopkg
ENV PATH="$PATH:/usr/lib/go-1.10/bin:$GOPATH/bin"

CMD ["/zero-daemon.sh"]
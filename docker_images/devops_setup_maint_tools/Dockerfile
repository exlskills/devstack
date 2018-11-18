# cd docker_images/devops_setup_maint_tools
# docker build -t smt-image --build-arg repo_branch=test-branch .

FROM exlskills/devstack-installer-base

ARG repo_branch=master

COPY ./load-image-content.yml /

RUN ansible-playbook -vvv -e repo_branch=$repo_branch /load-image-content.yml 

# Set GoLang Home and Path for the User
ENV GOPATH=/home/root/gopkg
ENV PATH="$PATH:/usr/lib/go-1.10/bin:$GOPATH/bin"

CMD ["/zero-daemon.sh"]
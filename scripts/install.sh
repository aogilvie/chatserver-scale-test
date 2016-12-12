# This should load requirements to a base clean host

echo "This will install docker, virtualbox and docker-machine on this host. OK? (y): "
read input_variable
if [ "$input_variable" != "y" ]; then
  echo -e "\nNothing to do."
  exit 0;
fi

sudo tee /etc/yum.repos.d/docker.repo <<-'EOF'
[dockerrepo]
name=Docker Repository
baseurl=https://yum.dockerproject.org/repo/main/centos/7/
enabled=1
gpgcheck=1
gpgkey=https://yum.dockerproject.org/gpg
EOF

sudo tee /etc/yum.repos.d/VitrualBox.repo <<-'EOF'
[virtualbox]
name=Oracle Linux / RHEL / CentOS-$releasever / $basearch - VirtualBox
baseurl=http://download.virtualbox.org/virtualbox/rpm/el/$releasever/$basearch
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://www.virtualbox.org/download/oracle_vbox.asc
EOF

curl -s -L https://www.virtualbox.org/download/oracle_vbox.asc > /tmp/oracle_vbox.asc
sudo rpm --import /tmp/oracle_vbox.asc

sudo yum install kernel-devel-3.10.0-327.10.1.el7.x86_64
sudo yum install docker-engine VirtualBox-5.1 kernel-devel kernel-headers gcc
sudo /sbin/vboxconfig
sudo systemctl enable docker.service

curl -s -L https://github.com/docker/machine/releases/download/v0.9.0-rc2/docker-machine-`uname -s`-`uname -m` > docker-machine

sudo chmod 755 docker-machine
sudo mv docker-machine /usr/bin/

# Install node.js
curl -s -L https://rpm.nodesource.com/setup | sudo bash -
sudo yum install nodejs

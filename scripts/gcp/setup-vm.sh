#!/bin/bash

####  Install dependencies  ####################################################

# Install common dependencies
sudo apt-get update -y
sudo apt-get install -y curl

# Install nvm
# Source: https://tecadmin.net/how-to-install-nvm-on-ubuntu-22-04/
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Install node via nvm (tested on: 16.14.0)
nvm install 16.14.0

# Install docker (tested on: 20.10.12)
# Source: https://docs.docker.com/engine/install/ubuntu/
sudo apt-get install -y ca-certificates gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --batch --yes --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo groupadd docker
sudo usermod -aG docker $USER
sudo chmod 666 /var/run/docker.sock

# Install kubectl (on GCP VMs)
sudo snap install kubectl --classic

# Install skaffold (tested on: 1.36.0)
# Source: https://skaffold.dev/docs/install/
curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64 && \
  sudo install skaffold /usr/local/bin/

####  Configure gcloud  ########################################################

# Create directory for service account key
mkdir -p $HOME/.secrets

# Retrieve service account key from GCP Secret Manager
gcloud secrets versions access latest --secret="microbs-service-account-key" > $HOME/.secrets/microbs-service-account-key.json

# Activate service account
gcloud auth activate-service-account $GCP_SERVICE_ACCOUNT_NAME \
  --project=$GCP_PROJECT_NAME \
  --key-file=$HOME/.secrets/microbs-service-account-key.json

# Configure access to gcr.io
gcloud auth configure-docker gcr.io -q --project=$GCP_PROJECT_NAME


####  Install microbs  #########################################################

# Install microbs
curl -Ls https://microbs.io/install.js | node


####  Configure microbs  #######################################################

# Create a helper script to escape inputs for regular expressions
sudo bash -c 'cat << EOF > /usr/local/bin/escape
#!/usr/bin/python3
import re; print(re.escape(input()))
EOF'
sudo chmod a+x /usr/local/bin/escape

# Update microbs config.yaml
export MICROBS_CONFIG=$HOME/.microbs/config.yaml
sed -i "s/^\s*kubernetes:.*$/    kubernetes: gke/g" $MICROBS_CONFIG
sed -i "s/^\s*observability:.*$/    observability: grafana-cloud/g" $MICROBS_CONFIG
sed -i "s/^\s*registry:.*$/  registry: gcr.io\/$(echo $GCP_PROJECT_NAME | escape)/g" $MICROBS_CONFIG
sed -i "s/^\s*project_name:.*$/  project_name: $(echo $GCP_PROJECT_NAME | escape)/g" $MICROBS_CONFIG
sed -i "s/^\s*region_name:.*$/  region_name: $(echo $GCP_REGION_NAME | escape)/g" $MICROBS_CONFIG
sed -i "s/^\s*network_name:.*$/  network_name: $(echo $GCP_NETWORK_NAME | escape)/g" $MICROBS_CONFIG
sed -i "s/^\s*subnetwork_name:.*$/  subnetwork_name: $(echo $GCP_SUBNETWORK_NAME | escape)/g" $MICROBS_CONFIG
sed -i "s/^\s*service_account_name:.*$/  service_account_name: $(echo $GCP_SERVICE_ACCOUNT_NAME | escape)/g" $MICROBS_CONFIG
sed -i "s/^\s*service_account_key_path:.*$/  service_account_key_path: ~\/.secrets\/microbs-service-account-key.json/g" $MICROBS_CONFIG

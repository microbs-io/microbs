# GCP Configuration Instructions

These instructions will guide you in the configuration of your GCP project for use with microbs.


## 1. Configure Service Account

Create a service account named `microbs`.

Download and save the service account key as a JSON file.

Grant the service account the following roles:

 - Cloud Build Service Agent
 - Container Registry Service Agent
 - Kubernetes Engine Admin
 - Service Account User
 - Secret Manager Admin
 
## 2. Configure Secret

Store the service account key file from Step 1 as using Secret Manager.

```sh
cat $SERVICE_ACCOUNT_KEY_FILE | gcloud secrets create microbs-service-account-key \
  --replication-policy="automatic" \
  --data-file=- \
  --project=$GCP_PROJECT_NAME
```

## 2. Configure Network

Create a network called `microbs`.

Create subnetworks of the `microbs` network using this naming convention: `microbs-$REGION_NAME`


## 3. Configure VM Image

Create a VM instance with the following configuration:

- **Machine configuration**
  - Machine family: `General-Purpose`
  - Series: `E2`
  - Machine type: `e2-medium (2 vCPU, 4 GB memory)`
- **Boot disk**
  - OS: `Ubuntu`
  - Version: `Ubuntu 22.04 LTS (x86/64, amd64)`
  - Size (GB): `30`
- **Identity and API access**
  - Service account: `microbs`

SSH into the virtual machine.

Paste the following script to `/etc/profile.d/install.sh` and provide values for the environment variables at the beginning of the script.

```
#!/usr/bin/bash

# Required environment variables
export GCP_PROJECT_NAME=
export GCP_NETWORK_NAME=
export GCP_REGION_NAME=
export GCP_SUBNETWORK_NAME=
export GCP_SERVICE_ACCOUNT_NAME=

# Download and run installer
sudo apt-get update -y && sudo apt-get install -y curl
curl -Ls https://raw.githubusercontent.com/microbs-io/microbs/main/scripts/gcp/setup-vm.sh | bash
```

Make `install.sh` executable: `sudo chmod a+x /etc/profile.d/install.sh`

Create the VM image called.

Instances of this image will run `/etc/profile.d/install.sh` on boot.

# 4. Launch VM Image

Create an instance of the VM image from Step 3.

Modify `~/.microbs/config.yaml` and provide the following values:

- `deployment.name`
- `plugins.grafana-cloud.api_key`
- `plugins.grafana-cloud.org_slug`

Run `microbs validate` to verify if the installation was successful.

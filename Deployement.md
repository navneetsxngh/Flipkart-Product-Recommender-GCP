## Initial Setup

1. **Push Code to Github**
   - Push your project code to a github repository.
 
2. **Create a Dockerfile**
    - Write a Dockerfile in the root of your project to containerize the app.

3. **Create Kubernetes Deployment file**
    - Make a file named 'flask-deployment.yaml'

4. **Create a VM Instance on Google Cloud**
    - Go to VM Instances and click "Create Instance"
    - Name: ``
    - Machine Type:``
        - Series: `E2`
        - Preset: `Standard`
        - Memory: `16 GB RAM`
    - Boot Disk:
        - Change size to 256 GB
        - Image: Select Ubuntu 24.04 LTS
    - Networking:
        - Enable HTTP and HTTPS traffic

5. **Create the Instance**
    - Click on "Create"
    
6. **Connect to the VM**
    - Use the SSH option provided to connect to the VM from the browser.

## Configure VM Instance

- **Clone your github repo**
```bash
git clone <repository-url>
cd <project-folder-name>
ls
```

- **Install Docker**

> **Note**: Run the below commands in the VM instance to install Docker.

```bash
# Add Docker's official GPG key:
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
```

```bash
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

- **Run Docker without sudo**

```bash
sudo groupadd docker
```

```bash
sudo usermod -aG docker $USER
```

```bash
newgrp docker
```

```bash
## For testing
docker run hello-world
```

- **Enable Docker to start on boot**
```bash
sudo systemctl enable docker.service && sudo systemctl enable containerd.service
```

- **Verify Docker Setup**
```bash
systemctl status docker       # You should see "active (running)"
docker ps                     # No container should be running
docker ps -a                 # Should show "hello-world" exited container
```

## Configure Minikube inside VM

- **Install Minikube**

    - Open browser and search: `Install Minikube`
    - Open the first official site (minikube.sigs.k8s.io) with `minikube start` on it
    - Choose:
        - OS: Linux
        - Architecture: x86
        - Select Binary download
    
> **Note**: You have already done this on Windows, so you're familiar with how Minikube works

```bash
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
```

- **Install Minikube Binary on VM**
```bash
sudo install minikube-linux-amd64 /usr/local/bin/minikube && rm minikube-linux-amd64
```

- **Start Minicube Cluster**
```bash
minikube start
```

> This uses Docker internally, which is why Docker was installed first

- **Install kubectl**
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
```
> Instead of installing manually, go to the Snap section (below on the same page)

```bash
sudo snap install kubectl --classic
```

- **Verify Installation**
```bash
kubectl version --client
```

- **Check Minikube Status**
```bash
minikube status         # Should show all components running
kubectl get nodes       # Should show minikube node
kubectl cluster-info    # Cluster info
docker ps               # Minikube container should be running
```

## 4. Interlink your Github on VSCode and on VM

> **Note**: You have already done this on Windows, so you're familiar with how to do this

```bash
git config --global user.email "[EMAIL_ADDRESS]"
git config --global user.name "navneetsxngh"

git add .
git commit -m "code uploaded"
git push origin main
```

- When prompted:
    - Username: navneetsxngh
    - Password: GitHub token (paste, it's invisible)

## 5. Build and Deploy your APP on VM

```bash
## Point Docker to Minikube
eval $(minikube docker-env)
```

```bash
docker build -t flask-app:latest .
```

- Delete Secret if already present
```bash
kubectl delete secret llmops-secrets
```

- Creating Secrets
```bash
kubectl create secret generic llmops-secrets --from-literal=TEMPERATURE="<temp>"
```
```bash
kubectl patch secret llmops-secrets -p '{"stringData":{"ASTRA_DB_API_ENDPOINT":"<astra-db-api-endpoint>"}}'
```
```bash
kubectl patch secret llmops-secrets -p '{"stringData":{"GROQ_API_KEY":"<groq-api-key>"}}'
```
```bash
kubectl patch secret llmops-secrets -p '{"stringData":{"ASTRA_DB_APPLICATION_TOKEN":"<astra-db-application-token>"}}'
```
```bash
kubectl patch secret llmops-secrets -p '{"stringData":{"ASTRA_DB_KEYSPACE":"default_keyspace"}}''
```
```bash
kubectl patch secret llmops-secrets -p '{"stringData":{"EMBEDDING_MODEL":"BAAI/bge-large-en-v1.5"}}'
```
```bash
kubectl patch secret llmops-secrets -p '{"stringData":{"HF_TOKEN":"<hf-token>"}}'
```
```bash
kubectl patch secret llmops-secrets -p '{"stringData":{"GROQ_MODEL":"llama-3.1-8b-instant"}}''
```
```bash
kubectl patch secret llmops-secrets -p '{"stringData":{"HUGGINGFACEHUB_API_TOKEN":"<hf-token>"}}'
```

- Create Deployment
```bash
kubectl apply -f flask-deployment.yaml
```

- Check Pods
```bash
kubectl get pods
```

```bash
kubectl port-forward svc/flask-service 5000:80 --address 0.0.0.0
```

- Open the app in browser
```
http://[IP_ADDRESS]
```

```bash
curl -s http://[IP_ADDRESS]/health
```

## 6. PROMETHEUS AND GRAFANA MONITORING OF YOUR APP

-  **Open another VM terminal**
```bash
kubectl create namespace monitoring
```

```bash
kubectl get ns
```

- **Apply YAML Files**
```bash
kubectl apply -f prometheus/prometheus-configmap.yaml
```

```bash
kubectl apply -f prometheus/prometheus-deployment.yaml
```

```bash
kubectl apply -f grafana/grafana-deployment.yaml
```

```bash
kubectl port-forward --address 0.0.0.0 svc/prometheus-service -n monitoring 9090:9090
```

```bash
kubectl port-forward --address 0.0.0.0 svc/grafana-service -n monitoring 3000:3000
```

- Configure Grafana
    - Go to **Settings > Data Sources > Add Data Source**
    - Select **Prometheus**
    - URL: `http://prometheus-service.monitoring.svc.cluster.local:9090`
    - Click **Save & Test**

- Open Grafana Dashboard
    - Open: `http://[IP_ADDRESS]`
    - Login: `admin` / `admin`
    - Change password when prompted

- Import Dashboard
    - In Grafana, go to **Dashboards > Import**
    - Enter ID: `17566`
    - Click **Import**
    - Select your Prometheus data source
    - Click **Import**
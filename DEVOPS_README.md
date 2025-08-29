# ChatApp DevOps Guide 🚀

Bienvenue dans le guide DevOps complet pour l'application ChatApp ! Ce guide vous accompagnera dans la containerisation, l'orchestration et le déploiement de votre application de chat en temps réel.

## 📖 Table des matières

1. [Architecture](#architecture)
2. [Prérequis](#prérequis)
3. [Installation rapide](#installation-rapide)
4. [Déploiement Docker](#déploiement-docker)
5. [Déploiement Kubernetes](#déploiement-kubernetes)
6. [Déploiement Docker Swarm](#déploiement-docker-swarm)
7. [Monitoring et observabilité](#monitoring-et-observabilité)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Sauvegarde et restauration](#sauvegarde-et-restauration)
10. [Dépannage](#dépannage)

## 🏗️ Architecture

### Stack Technologique

- **Frontend** : React + Vite + TypeScript + TailwindCSS
- **Backend** : Node.js + Express + TypeScript + Socket.io
- **Base de données** : MongoDB
- **Cache** : Redis
- **Reverse Proxy** : Nginx
- **Containerisation** : Docker + Docker Compose
- **Orchestration** : Kubernetes / Docker Swarm
- **Monitoring** : Prometheus + Grafana + Loki
- **CI/CD** : GitHub Actions

### Architecture de déploiement

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Monitoring    │    │   CI/CD         │
│   (Nginx)       │    │   (Grafana)     │    │   (GitHub)      │
└─────────┬───────┘    └─────────────────┘    └─────────────────┘
          │
┌─────────▼───────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   WebSocket     │
│   (React)       │    │   (Express)     │    │   (Socket.io)   │
└─────────────────┘    └─────────┬───────┘    └─────────────────┘
                                 │
                       ┌─────────▼───────┐    ┌─────────────────┐
                       │   Database      │    │   Cache         │
                       │   (MongoDB)     │    │   (Redis)       │
                       └─────────────────┘    └─────────────────┘
```

## 🔧 Prérequis

### Système requis

- **OS** : Linux (Ubuntu 20.04+), macOS, Windows 10/11 avec WSL2
- **RAM** : 8GB minimum, 16GB recommandé
- **Stockage** : 50GB d'espace libre
- **Réseau** : Accès internet pour télécharger les images Docker

### Outils nécessaires

#### Pour le déploiement Docker

```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Pour le déploiement Kubernetes

```bash
# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Helm (optionnel)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Minikube (pour les tests locaux)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

#### Pour Ansible

```bash
# Ansible
sudo apt update
sudo apt install ansible

# Collections Kubernetes
ansible-galaxy collection install kubernetes.core
ansible-galaxy collection install community.docker
```

## ⚡ Installation rapide

### 1. Cloner et configurer

```bash
git clone <your-repo-url> chatapp
cd chatapp

# Copier le fichier d'environnement
cp .env.example .env

# Éditer les variables d'environnement
nano .env
```

### 2. Déploiement avec Docker (recommandé pour débuter)

```bash
# Rendre le script exécutable
chmod +x scripts/deploy.sh

# Déployer
./scripts/deploy.sh docker development

# Avec monitoring
./scripts/deploy.sh docker development --monitoring
```

### 3. Vérifier le déploiement

```bash
# Vérifier la santé des services
./scripts/health-check.sh docker

# Accéder aux services
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Monitoring: http://localhost:3001 (admin/grafana123)
```

## 🐳 Déploiement Docker

### Structure des fichiers Docker

```
├── docker-compose.yml           # Configuration principale
├── client/
│   ├── Dockerfile              # Image frontend
│   └── nginx.conf              # Configuration Nginx
├── server/
│   └── Dockerfile              # Image backend
└── monitoring/
    └── docker-compose.monitoring.yml
```

### Commandes Docker essentielles

```bash
# Construire les images
docker-compose build

# Démarrer les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Voir le status
docker-compose ps

# Redémarrer un service
docker-compose restart backend

# Accéder à un container
docker-compose exec backend bash
```

### Variables d'environnement importantes

```bash
# Base de données
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=password123
MONGO_DB_NAME=chatapp

# Cache
REDIS_PASSWORD=redis123

# Application
JWT_SECRET=your-super-secret-key
CORS_ORIGIN=http://localhost:3000

# Ports
FRONTEND_PORT=3000
BACKEND_PORT=5000
```

### Production avec Docker

```bash
# Utiliser l'environnement de production
cp .env.production .env

# Déployer avec profile production
docker-compose --profile production up -d

# Activer le SSL avec Let's Encrypt (à adapter)
docker-compose exec nginx certbot --nginx -d your-domain.com
```

## ☸️ Déploiement Kubernetes

### Structure des manifestes Kubernetes

```
k8s/
├── namespace.yaml              # Namespace chatapp
├── configmap-secrets.yaml      # Configuration et secrets
├── storage.yaml                # PersistentVolumeClaims
├── mongodb.yaml               # Base de données
├── redis.yaml                 # Cache
├── backend.yaml              # API backend
├── frontend.yaml             # Interface utilisateur
└── ingress.yaml              # Exposition externe
```

### Déploiement étape par étape

```bash
# 1. Créer le namespace
kubectl apply -f k8s/namespace.yaml

# 2. Appliquer les configurations
kubectl apply -f k8s/configmap-secrets.yaml
kubectl apply -f k8s/storage.yaml

# 3. Déployer les bases de données
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/redis.yaml

# Attendre que les DB soient prêtes
kubectl wait --for=condition=ready pod -l app=mongodb -n chatapp --timeout=300s

# 4. Déployer les applications
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# 5. Configurer l'ingress
kubectl apply -f k8s/ingress.yaml
```

### Déploiement automatique avec le script

```bash
# Déploiement Kubernetes
./scripts/deploy.sh k8s production

# Vérification de la santé
./scripts/health-check.sh k8s
```

### Commandes Kubernetes utiles

```bash
# Voir tous les pods
kubectl get pods -n chatapp

# Voir les services
kubectl get services -n chatapp

# Voir les logs
kubectl logs -f deployment/chatapp-backend -n chatapp

# Redémarrer un déploiement
kubectl rollout restart deployment/chatapp-backend -n chatapp

# Scaler un service
kubectl scale deployment chatapp-backend --replicas=5 -n chatapp

# Port-forward pour debug
kubectl port-forward svc/chatapp-backend-service 5000:5000 -n chatapp
```

### Helm Chart (Optionnel)

```bash
# Installer avec Helm
helm install chatapp ./helm/chatapp \
  --namespace chatapp \
  --create-namespace \
  --values ./helm/chatapp/values.yaml

# Mettre à jour
helm upgrade chatapp ./helm/chatapp

# Désinstaller
helm uninstall chatapp -n chatapp
```

## 🐋 Déploiement Docker Swarm

### Initialiser Docker Swarm

```bash
# Sur le manager node
docker swarm init --advertise-addr <MANAGER-IP>

# Ajouter des workers (commande donnée par swarm init)
docker swarm join --token <TOKEN> <MANAGER-IP>:2377

# Voir les nodes
docker node ls
```

### Déployer avec Swarm

```bash
# Créer le réseau overlay
docker network create --driver overlay chatapp_network

# Déployer la stack
docker stack deploy --compose-file docker-compose.yml chatapp

# Voir les services
docker stack services chatapp

# Voir les tasks
docker stack ps chatapp
```

### Mise à jour rolling

```bash
# Mettre à jour une image
docker service update --image your-registry/chatapp-backend:v2 chatapp_backend

# Scaler un service
docker service scale chatapp_backend=5
```

## 📊 Monitoring et Observabilité

### Stack de monitoring

- **Prometheus** : Collecte des métriques
- **Grafana** : Visualisation des données
- **AlertManager** : Gestion des alertes
- **Loki** : Agrégation des logs
- **Jaeger** : Tracing distribué

### Déploiement du monitoring

```bash
# Démarrer la stack de monitoring
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Accès aux services
# Grafana: http://localhost:3001 (admin/grafana123)
# Prometheus: http://localhost:9090
# AlertManager: http://localhost:9093
```

### Métriques importantes à surveiller

- **Application** : Temps de réponse, taux d'erreur, throughput
- **Infrastructure** : CPU, RAM, disque, réseau
- **Base de données** : Connexions, requêtes lentes, taille
- **Business** : Utilisateurs actifs, messages envoyés

### Configuration des alertes

```yaml
# Exemple d'alerte Prometheus
groups:
  - name: chatapp_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Le pipeline automatique inclut :

1. **Tests** : Linting, tests unitaires, tests d'intégration
2. **Build** : Construction des images Docker
3. **Scan de sécurité** : Analyse des vulnérabilités
4. **Déploiement** :
   - Development (branche `develop`)
   - Production (branche `main`)
5. **Tests post-déploiement** : Smoke tests
6. **Notifications** : Slack/Email

### Secrets GitHub Actions à configurer

```bash
# SSH pour déploiement
DEV_SSH_KEY          # Clé SSH pour le serveur de dev
DEV_HOST             # IP du serveur de développement

# Kubernetes
KUBE_CONFIG          # Fichier kubeconfig (base64 encoded)

# Notifications
SLACK_WEBHOOK        # Webhook Slack pour les notifications

# Registry Docker
GHCR_TOKEN          # Token GitHub Container Registry
```

### Déclenchement manuel

```bash
# Déclencher un déploiement via GitHub API
curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/owner/repo/actions/workflows/ci-cd.yml/dispatches \
  -d '{"ref":"main"}'
```

## 💾 Sauvegarde et Restauration

### Script de sauvegarde automatique

```bash
# Sauvegarde complète
./scripts/backup.sh all local

# Sauvegarde uniquement la base de données
./scripts/backup.sh database s3

# Sauvegarde avec upload vers le cloud
export S3_BACKUP_BUCKET=my-backup-bucket
./scripts/backup.sh all s3
```

### Restauration

```bash
# Restaurer depuis la sauvegarde la plus récente
./scripts/backup.sh --restore all latest

# Restaurer depuis une date spécifique
./scripts/backup.sh --restore mongodb 20240315_143000
```

### Cron pour sauvegarde automatique

```bash
# Ajouter au crontab
crontab -e

# Sauvegarde quotidienne à 2h du matin
0 2 * * * /opt/chatapp/scripts/backup.sh all s3
```

## 🔧 Dépannage

### Problèmes courants et solutions

#### 1. Services ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs service_name

# Vérifier les resources
docker stats

# Nettoyer et redémarrer
docker-compose down
docker system prune -f
docker-compose up -d
```

#### 2. Base de données inaccessible

```bash
# Vérifier la connexion MongoDB
docker-compose exec mongodb mongo --eval "db.adminCommand('ping')"

# Vérifier les logs MongoDB
docker-compose logs mongodb

# Redémarrer MongoDB
docker-compose restart mongodb
```

#### 3. Erreurs de réseau

```bash
# Vérifier les réseaux Docker
docker network ls
docker network inspect chatapp_chatapp

# Recréer le réseau
docker-compose down
docker network prune
docker-compose up -d
```

#### 4. Problèmes de performance

```bash
# Analyser l'utilisation des ressources
docker stats

# Vérifier l'espace disque
df -h
docker system df

# Nettoyer les images inutilisées
docker image prune -a
```

### Logs et debugging

```bash
# Logs en temps réel
docker-compose logs -f --tail=100

# Logs spécifiques à un service
docker-compose logs backend

# Accéder au container pour debug
docker-compose exec backend bash

# Vérifier la configuration
docker-compose config
```

### Commandes de diagnostic

```bash
# Script de santé complet
./scripts/health-check.sh docker

# Vérifier la connectivité réseau
docker-compose exec backend ping mongodb
docker-compose exec backend ping redis

# Vérifier les variables d'environnement
docker-compose exec backend env | grep -E "(MONGO|REDIS|JWT)"
```

## 📞 Support et Contact

Pour toute question ou problème :

1. Vérifiez d'abord cette documentation
2. Consultez les logs avec les scripts fournis
3. Cherchez dans les [Issues GitHub](https://github.com/your-repo/issues)
4. Créez une nouvelle issue si nécessaire

## 🔗 Liens utiles

- [Documentation Docker](https://docs.docker.com/)
- [Documentation Kubernetes](https://kubernetes.io/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Bon déploiement ! 🚀**

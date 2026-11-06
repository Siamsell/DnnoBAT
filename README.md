# README - DnnoBAT

## Système de Gestion Immobilière

---

## Description

**DnnoBAT** est une application web de gestion immobilière complète développée pour une agence immobilière. Elle permet de gérer efficacement les biens immobiliers, les clients, les employés et les transactions, le tout avec une interface moderne, multilingue (Français, Anglais, Arabe) et responsive.

---

## Fonctionnalités Principales

### Authentification
- Système de connexion sécurisé avec email et mot de passe
- Redirection basée sur le rôle de l'utilisateur (admin ou travailleur)
- Gestion de session via `sessionStorage`

### Tableau de Bord (admin.html)
- Interface d'accueil avec résumé des activités
- Menu de navigation latéral avec animations
- Sélecteur de langue (FR / EN / AR)
- Système de notifications
- Design responsive avec menu mobile

### Gestion Immobilière (gestion_immobilier.html)
- Formulaire complet d'ajout de propriétés
- Upload d'images avec prévisualisation
- Upload de documents PDF
- Gestion des informations : titre, type, description, localisation (wilaya, baladiya, quartier)
- Spécifications : surface, prix, chambres, salles de bain
- Statistiques en temps réel (total, à vendre, à louer, vendus)

### Gestion des Clients (client.html)
- CRUD complet des clients (Créer, Lire, Modifier, Supprimer)
- Catégorisation : VIP, Chaud, Tiède, Froid
- Types de clients : Acheteur, Vendeur, Investisseur
- Recherche de clients
- Historique des interactions (appels, emails, visites, notes)
- Statistiques par catégorie

### Gestion des Employés (gestion des employes.html)
- CRUD complet des employés
- Gestion des postes : Admin, Manager, Agent
- Système de permissions granulaires :
  - Propriétés (voir, ajouter, modifier, supprimer)
  - Clients (voir, ajouter, modifier, supprimer)
  - Ventes (voir, ajouter, modifier)
  - Employés (voir, ajouter, modifier, supprimer)
- Suivi des performances
- Gestion des présences
- Gestion des salaires et primes

### Espace Travailleur (travaille.html)
- Interface dédiée aux employés
- Accès aux tâches assignées
- Envoi de rapports

---

## Technologies Utilisées

| Catégorie | Technologies |
|-----------|-------------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Styling | CSS personnalisé, Glassmorphism, Animations CSS |
| Icônes | Font Awesome 6.4.0 |
| Polices | Google Fonts (Inter, Tajawal) |
| Framework CSS | Bootstrap 5.3.0 (partiel) |
| Backend API | Node.js (localhost:3000) |
| Communication | Fetch API (requêtes asynchrones) |

---


```

---

## Installation et Lancement

### Prérequis
- Navigateur web moderne (Chrome, Firefox, Edge, Safari)
- Serveur backend Node.js fonctionnel sur `http://localhost:3000`
- Base de données configurée (MySQL/PostgreSQL)

### Étapes

1. **Cloner le projet**
   ```bash
   git clone [url-du-projet]
   cd DnnoBAT
   ```

2. **Démarrer le backend**
   ```bash
   cd backend
   npm install
   npm start
   ```

3. **Lancer le frontend**
   - Ouvrir `login.html` dans votre navigateur
   - Ou utiliser un serveur local :
     ```bash
     npx http-server .
     ```

---

## API Endpoints Utilisés

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/login` | Authentification utilisateur |
| GET | `/api/clients` | Liste des clients |
| POST | `/api/clients` | Créer un client |
| PUT | `/api/clients/:id` | Modifier un client |
| DELETE | `/api/clients/:id` | Supprimer un client |
| GET | `/api/clients/:id` | Détails + interactions |
| POST | `/api/clients/:id/interactions` | Ajouter une interaction |
| GET | `/api/properties` | Liste des propriétés |
| POST | `/api/properties` | Ajouter une propriété |
| GET | `/api/property-types` | Types de propriétés |
| GET | `/api/property-status` | Statuts de propriétés |

---


### Typographie
- **Latin** : `Inter`
- **Arabe** : `Tajawal`

### Design
- Effet Glassmorphism (verre dépoli)
- Cartes avec ombres portées
- Animations fluides (fadeIn, float, pulse)
- Border-radius arrondis (10-20px)

---

## Multilinguisme

L'application supporte trois langues :
- **Français** (défaut)
- **Anglais**
- **Arabe** (RTL support)

Le changement de langue est géré dynamiquement via l'attribut `data-lang`.

---

## Responsive Design

L'application est entièrement responsive avec des breakpoints :
- **Desktop** : > 992px
- **Tablette** : 768px - 992px
- **Mobile** : < 768px

Fonctionnalités mobiles :
- Menu hamburger avec sidebar coulissante
- Overlay de fermeture
- Adaptation des grilles et formulaires

---

## Sécurité

- Validation des données côté client
- Gestion de session via `sessionStorage`
- Protection contre les accès non autorisés par rôle
- Redirection automatique si session invalide

---

## Fonctionnalités à Venir

- Module de transactions complet
- Rapports et statistiques avancés
- Système de messagerie interne
- Notifications en temps réel
- Export PDF des rapports
- Calendrier des rendez-vous
- Application mobile

---




## Licence

Ce projet est propriétaire. Toute reproduction non autorisée est interdite.

---

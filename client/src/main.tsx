/*
 * Fichier : client/src/main.tsx
 * Rôle : Point d'entrée principal de l'application React.
 * - Monte l'application React dans le DOM.
 * - Fournit le routeur (BrowserRouter) pour la navigation côté client.
 * - Importe le composant racine App et les styles globaux.
 * Dépendances :
 * - React, ReactDOM : pour le rendu de l'application.
 * - react-router-dom : pour la gestion des routes.
 * - App : composant principal de l'application.
 * - index.css : styles globaux.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';

// Configuration des drapeaux de fonctionnalités futures pour React Router
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router future={router.future}>
      <App />
    </Router>
  </React.StrictMode>
);

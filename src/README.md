# Dialogue Tree Editor - Structure du Code

Ce projet a été refactorisé pour une meilleure organisation et maintenabilité du code.

## Structure des Dossiers

```
src/
├── components/
│   ├── ui/                    # Composants UI de base (shadcn/ui)
│   └── dialogue/              # Composants spécifiques au dialogue
│       ├── DialogueNode.jsx   # Composant de nœud de dialogue
│       ├── NodeEditor.jsx     # Panneau d'édition des nœuds
│       └── Toolbar.jsx        # Barre d'outils
├── hooks/
│   └── useDialogueTree.js     # Hook personnalisé pour la logique métier
├── utils/
│   ├── nodeUtils.js           # Utilitaires pour les nœuds et edges
│   └── exportUtils.js         # Utilitaires pour l'export/import
├── types/
│   └── constants.js           # Constantes et types
└── DialogTreeEditor.jsx       # Composant principal
```

## Composants

### `DialogueNode.jsx`
Composant représentant un nœud de dialogue dans le graphe.
- Affiche le nom et le message du nœud
- Gère les handles de connexion (entrée en haut, sorties en bas)
- Positionne automatiquement les handles de sortie selon le nombre de choix

### `NodeEditor.jsx`
Panneau d'édition qui apparaît quand un nœud est sélectionné.
- Édition du nom et du message du nœud
- Gestion des choix (ajout, modification, suppression)
- Sélection du nœud suivant pour chaque choix
- Création de nouveaux nœuds depuis les choix

### `Toolbar.jsx`
Barre d'outils avec les actions principales.
- Ajout de nouveaux nœuds
- Export/Import de données
- Boutons d'action rapide

## Hooks

### `useDialogueTree.js`
Hook personnalisé qui encapsule toute la logique métier :
- Gestion de l'état des nœuds et edges
- Actions sur les nœuds (ajout, modification, suppression)
- Actions sur les choix
- Gestion des connexions
- Import/Export de données

## Utilitaires

### `nodeUtils.js`
Fonctions utilitaires pour :
- Création de nœuds (`createNode`)
- Création d'edges (`createEdge`)
- Nettoyage des connexions orphelines (`cleanupOrphanedEdges`)

### `exportUtils.js`
Fonctions pour l'export et l'import :
- Export du schéma complet en JSON
- Export des données de conversation simplifiées
- Import depuis un fichier JSON

## Constantes

### `constants.js`
Définit les constantes utilisées dans l'application :
- Types de nœuds
- Configuration ReactFlow
- Dimensions des nœuds
- Données initiales

## Avantages de cette Structure

1. **Séparation des responsabilités** : Chaque fichier a une responsabilité claire
2. **Réutilisabilité** : Les composants et utilitaires peuvent être réutilisés
3. **Maintenabilité** : Code plus facile à maintenir et à déboguer
4. **Testabilité** : Chaque partie peut être testée indépendamment
5. **Évolutivité** : Facile d'ajouter de nouvelles fonctionnalités

## Utilisation

Le composant principal `DialogTreeEditor.jsx` orchestre tous les autres composants et utilise le hook `useDialogueTree` pour la logique métier. Cette approche rend le code plus modulaire et plus facile à comprendre. 
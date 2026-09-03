import { NODE_DIMENSIONS } from "@/types/constants";

/**
 * Exporte le schéma complet en JSON avec sélection de dossier
 */
export async function exportToJSON(nodes, edges) {
  const exportData = {
    nodes: nodes,
    edges: edges,
    metadata: {
      exportDate: new Date().toISOString(),
      version: "1.0",
      nodeCount: nodes.length,
      edgeCount: edges.length
    }
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  
  // Générer le nom de fichier
  const rootNode = nodes.find(n => n.id === "root");
  const rootNodeName = rootNode?.data.name || "root";
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `${rootNodeName}_editor_${timestamp}`;
  
  // Utiliser l'API File System Access si disponible (Chrome/Edge)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: `${fileName}.json`,
        types: [{
          description: 'Fichier JSON',
          accept: { 'application/json': ['.json'] },
        }],
      });
      
      const writable = await handle.createWritable();
      await writable.write(dataStr);
      await writable.close();
      
      return { success: true, message: `Fichier sauvegardé: ${handle.name}` };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, message: 'Export annulé' };
      }
      throw error;
    }
  } else {
    // Fallback pour les navigateurs qui ne supportent pas l'API File System Access
    return exportWithDownload(dataStr, `${fileName}.json`);
  }
}

/**
 * Exporte les données de conversation simplifiées avec sélection de dossier
 */
export async function exportConversationData(nodes) {
  // Convertir les nœuds en format conversation
  const conversationData = nodes.map(node => {
    const choices = (node.data.choices || []).map(choice => {
      // Référence désormais par ID unique
      let nextNodeId = null;
      if (choice.next && choice.next !== "new") {
        nextNodeId = choice.next;
      }
      
      const choiceData = {
        reponse: choice.label,
        next: nextNodeId
      };
      
      // Ajouter OpenResponse si elle est true
      if (choice.OpenResponse) {
        choiceData.OpenResponse = true;
      }
      
      return choiceData;
    });

    return {
      name: node.id,
      question: node.data.message,
      choices: choices,
      AddUnknownOption: node.data.AddUnknownOption || false
    };
  });

  const exportData = {
    conversation: conversationData,
    metadata: {
      exportDate: new Date().toISOString(),
      version: "1.0",
      nodeCount: nodes.length
    }
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  
  // Générer le nom de fichier
  const rootNode = nodes.find(n => n.id === "root");
  const rootNodeName = rootNode?.data.name || "root";
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `${rootNodeName}_conv_${timestamp}`;
  
  // Utiliser l'API File System Access si disponible
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: `${fileName}.json`,
        types: [{
          description: 'Fichier JSON',
          accept: { 'application/json': ['.json'] },
        }],
      });
      
      const writable = await handle.createWritable();
      await writable.write(dataStr);
      await writable.close();
      
      return { success: true, message: `Fichier sauvegardé: ${handle.name}` };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, message: 'Export annulé' };
      }
      throw error;
    }
  } else {
    // Fallback pour les navigateurs qui ne supportent pas l'API File System Access
    return exportWithDownload(dataStr, `${fileName}.json`);
  }
}

/**
 * Fonction helper pour l'export par téléchargement
 */
function exportWithDownload(dataStr, fileName) {
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = fileName;
  link.click();
  
  URL.revokeObjectURL(link.href);
  
  return { success: true, message: `Fichier téléchargé: ${fileName}` };
}

/**
 * Fonction d'export unifiée pour le modal
 */
export async function handleExport(exportType, nodes, edges) {
  try {
    let result;
    
    switch (exportType) {
      case "json":
        result = await exportToJSON(nodes, edges);
        break;
      case "conversation":
        result = await exportConversationData(nodes);
        break;
      default:
        throw new Error("Type d'export non supporté");
    }
    
    if (result.success) {
      alert(`✅ ${result.message}`);
    } else {
      alert(`❌ ${result.message}`);
    }
    
    return result;
  } catch (error) {
    console.error("Erreur lors de l'export:", error);
    alert(`❌ Erreur lors de l'export: ${error.message}`);
    throw error;
  }
}

/**
 * Sauvegarde les données dans un handle de fichier existant
 */
export async function saveToFileHandle(fileHandle, nodes, edges) {
  const exportData = {
    nodes: nodes,
    edges: edges,
    metadata: {
      exportDate: new Date().toISOString(),
      version: "1.0",
      nodeCount: nodes.length,
      edgeCount: edges.length
    }
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(dataStr);
    await writable.close();
    
    return { success: true, message: `Fichier sauvegardé: ${fileHandle.name}` };
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error);
    throw error;
  }
}

/**
 * Importe un schéma depuis JSON avec gestion du handle de fichier
 */
export async function importFromJSONWithHandle(onImport) {
  // Vérifier si l'API File System Access est disponible
  if ('showOpenFilePicker' in window) {
    try {
      // Utiliser l'API File System Access pour obtenir un handle
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'Fichier JSON',
          accept: { 'application/json': ['.json'] },
        }],
      });
      
      const fileContent = await fileHandle.getFile();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          // Vérifier la structure du fichier
          if (!importData.nodes || !importData.edges) {
            alert("Format de fichier invalide. Le fichier doit contenir 'nodes' et 'edges'.");
            return;
          }
          
          // Confirmer l'import
          if (window.confirm("L'import va remplacer l'arbre actuel. Continuer ?")) {
            onImport(importData, fileHandle);
            alert("Import réussi !");
          }
        } catch (error) {
          alert("Erreur lors de l'import : " + error.message);
        }
      };
      
      reader.readAsText(fileContent);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error("Erreur avec l'API File System Access:", error);
      // Fallback vers l'import classique
      importFromJSONClassic(onImport);
    }
  } else {
    // Fallback pour les navigateurs qui ne supportent pas l'API File System Access
    importFromJSONClassic(onImport);
  }
}

/**
 * Import classique sans handle (fallback)
 */
function importFromJSONClassic(onImport) {
  // Créer un input file temporaire
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  // Masquer l'input pour éviter les problèmes visuels
  input.style.display = 'none';
  
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      // Nettoyer l'input même si aucun fichier n'est sélectionné
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        
        // Vérifier la structure du fichier
        if (!importData.nodes || !importData.edges) {
          alert("Format de fichier invalide. Le fichier doit contenir 'nodes' et 'edges'.");
          return;
        }
        
        // Confirmer l'import
        if (window.confirm("L'import va remplacer l'arbre actuel. Continuer ?")) {
          onImport(importData, null); // Pas de handle pour le fallback
          alert("Import réussi !");
        }
      } catch (error) {
        alert("Erreur lors de l'import : " + error.message);
      } finally {
        // Nettoyer l'input après utilisation
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      }
    };
    
    reader.onerror = () => {
      alert("Erreur lors de la lecture du fichier");
      // Nettoyer l'input en cas d'erreur
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };
    
    reader.readAsText(file);
  };
  
  // Ajouter l'input au DOM temporairement
  document.body.appendChild(input);
  input.click();
  
  // Nettoyer l'input après un délai si l'utilisateur annule
  setTimeout(() => {
    if (input.parentNode) {
      input.parentNode.removeChild(input);
    }
  }, 1000);
}

/**
 * Importe un schéma depuis JSON (fonction legacy pour compatibilité)
 */
export function importFromJSON(event, onImport) {
  // Si on a un event, c'est l'ancienne méthode
  if (event && event.target && event.target.files) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        
        // Vérifier la structure du fichier
        if (!importData.nodes || !importData.edges) {
          alert("Format de fichier invalide. Le fichier doit contenir 'nodes' et 'edges'.");
          return;
        }
        
        // Confirmer l'import
        if (window.confirm("L'import va remplacer l'arbre actuel. Continuer ?")) {
          onImport(importData, null);
          alert("Import réussi !");
        }
      } catch (error) {
        alert("Erreur lors de l'import : " + error.message);
      }
    };
    
    reader.onerror = () => {
      alert("Erreur lors de la lecture du fichier");
    };
    
    reader.readAsText(file);
    
    // Réinitialiser l'input pour permettre de recharger le même fichier
    event.target.value = '';
  } else {
    // Nouvelle méthode sans event
    importFromJSONWithHandle(onImport);
  }
}

/**
 * Convertit un format conversation vers le format éditeur (nodes + edges)
 */
export function convertConversationToEditorData(conversationArray) {
  if (!Array.isArray(conversationArray) || conversationArray.length === 0) {
    throw new Error("Le tableau de conversation est vide ou invalide");
  }
  
  // Vérifier que le premier nœud est "root"
  if (conversationArray[0].name !== "root") {
    throw new Error('Le premier nœud doit avoir name="root"');
  }
  
  const nodes = [];
  const edges = [];
  
  // Créer une map pour vérifier l'existence des nœuds
  const nodeIds = new Set(conversationArray.map(conv => conv.name));
  
  // Convertir chaque nœud de conversation
  conversationArray.forEach((convNode, index) => {
    // Calculer une position par défaut en grille
    const col = index % 3;
    const row = Math.floor(index / 3);
    const position = {
      x: col * (NODE_DIMENSIONS.WIDTH + NODE_DIMENSIONS.SPACING),
      y: row * (NODE_DIMENSIONS.HEIGHT + NODE_DIMENSIONS.SPACING * 2)
    };
    
    // Transformer les choix au format éditeur
    const choices = (convNode.choices || []).map(choice => ({
      label: choice.reponse,
      next: choice.next,
      OpenResponse: choice.OpenResponse || false
    }));
    
    // Créer le nœud
    const node = {
      id: convNode.name,
      type: "dialogue",
      position: position,
      data: {
        name: convNode.name,
        message: convNode.question,
        choices: choices,
        AddUnknownOption: convNode.AddUnknownOption || false,
        version: 0
      }
    };
    
    nodes.push(node);
    
    // Créer les edges pour ce nœud
    convNode.choices?.forEach((choice, choiceIndex) => {
      if (choice.next && choice.next !== null) {
        // Vérifier que le nœud cible existe
        if (!nodeIds.has(choice.next)) {
          console.warn(`Le nœud "${convNode.name}" référence un choix vers "${choice.next}" qui n'existe pas`);
          return;
        }
        
        const edge = {
          id: `xy-edge__${convNode.name}choice_${choiceIndex}-${choice.next}`,
          source: convNode.name,
          sourceHandle: `choice_${choiceIndex}`,
          target: choice.next,
          targetHandle: null,
          animated: true,
          type: 'smoothstep'
        };
        
        edges.push(edge);
      }
    });
  });
  
  return { nodes, edges };
}

/**
 * Importe un fichier conversation avec gestion du handle de fichier
 */
export async function importConversationWithHandle(onImport) {
  // Vérifier si l'API File System Access est disponible
  if ('showOpenFilePicker' in window) {
    try {
      // Utiliser l'API File System Access pour obtenir un handle
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'Fichier JSON Conversation',
          accept: { 'application/json': ['.json'] },
        }],
      });
      
      const fileContent = await fileHandle.getFile();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          // Vérifier la structure du fichier
          if (!importData.conversation || !Array.isArray(importData.conversation)) {
            alert("Format de fichier invalide. Le fichier doit contenir un tableau 'conversation'.");
            return;
          }
          
          // Convertir le format conversation vers le format éditeur
          const editorData = convertConversationToEditorData(importData.conversation);
          
          // Confirmer l'import
          if (window.confirm("L'import va remplacer l'arbre actuel. Continuer ?")) {
            onImport(editorData, null); // Pas de handle pour les fichiers conversation
            alert("Import réussi !");
          }
        } catch (error) {
          alert("Erreur lors de l'import : " + error.message);
          console.error("Erreur détaillée:", error);
        }
      };
      
      reader.readAsText(fileContent);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error("Erreur avec l'API File System Access:", error);
      // Fallback vers l'import classique
      importConversationClassic(onImport);
    }
  } else {
    // Fallback pour les navigateurs qui ne supportent pas l'API File System Access
    importConversationClassic(onImport);
  }
}

/**
 * Import conversation classique sans handle (fallback)
 */
function importConversationClassic(onImport) {
  // Créer un input file temporaire
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  // Masquer l'input pour éviter les problèmes visuels
  input.style.display = 'none';
  
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      // Nettoyer l'input même si aucun fichier n'est sélectionné
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        
        // Vérifier la structure du fichier
        if (!importData.conversation || !Array.isArray(importData.conversation)) {
          alert("Format de fichier invalide. Le fichier doit contenir un tableau 'conversation'.");
          return;
        }
        
        // Convertir le format conversation vers le format éditeur
        const editorData = convertConversationToEditorData(importData.conversation);
        
        // Confirmer l'import
        if (window.confirm("L'import va remplacer l'arbre actuel. Continuer ?")) {
          onImport(editorData, null); // Pas de handle pour les fichiers conversation
          alert("Import réussi !");
        }
      } catch (error) {
        alert("Erreur lors de l'import : " + error.message);
        console.error("Erreur détaillée:", error);
      } finally {
        // Nettoyer l'input après utilisation
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      }
    };
    
    reader.onerror = () => {
      alert("Erreur lors de la lecture du fichier");
      // Nettoyer l'input en cas d'erreur
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };
    
    reader.readAsText(file);
  };
  
  // Ajouter l'input au DOM temporairement
  document.body.appendChild(input);
  input.click();
  
  // Nettoyer l'input après un délai si l'utilisateur annule
  setTimeout(() => {
    if (input.parentNode) {
      input.parentNode.removeChild(input);
    }
  }, 1000);
} 
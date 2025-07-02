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
  // Créer un mapping des IDs vers les noms pour les références
  const idToNameMap = {};
  nodes.forEach(node => {
    idToNameMap[node.id] = node.data.name;
  });

  // Convertir les nœuds en format conversation
  const conversationData = nodes.map(node => {
    const choices = (node.data.choices || []).map(choice => {
      let nextNodeName = null;
      if (choice.next && choice.next !== "new") {
        nextNodeName = idToNameMap[choice.next] || choice.next;
      }
      
      return {
        reponse: choice.label,
        next: nextNodeName
      };
    });

    return {
      name: node.data.name,
      question: node.data.message,
      choices: choices
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
 * Importe un schéma depuis JSON
 */
export function importFromJSON(event, onImport) {
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
        onImport(importData);
        alert("Import réussi !");
      }
    } catch (error) {
      alert("Erreur lors de l'import : " + error.message);
    }
  };
  reader.readAsText(file);
  
  // Réinitialiser l'input pour permettre de recharger le même fichier
  event.target.value = '';
} 
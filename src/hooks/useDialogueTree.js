import { useCallback, useState, useEffect } from "react";
import { useNodesState, useEdgesState, addEdge } from "@xyflow/react";
import { createNode, createEdge, cleanupOrphanedEdges } from "@/utils/nodeUtils";
import { INITIAL_NODES, INITIAL_EDGES, NODE_DIMENSIONS } from "@/types/constants";
import { saveToFileHandle } from "@/utils/exportUtils";

export function useDialogueTree(centerOnNodeCallback) {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState("root");
  const [newNodeId, setNewNodeId] = useState("");
  const [currentFileHandle, setCurrentFileHandle] = useState(null);
  
  // Fonction pour centrer la vue sur un nœud
  const centerOnNode = useCallback((nodeId) => {
    if (centerOnNodeCallback) {
      const targetNode = nodes.find(n => n.id === nodeId);
      if (targetNode) {
        centerOnNodeCallback(
          targetNode.position.x + (targetNode.measured?.width || 112) / 2,
          targetNode.position.y + (targetNode.measured?.height || 80) / 2
        );
      }
    }
  }, [nodes, centerOnNodeCallback]);

  // Nettoyer les connexions orphelines quand les nœuds changent
  useEffect(() => {
    cleanupOrphanedEdges(nodes, setEdges);
  }, [nodes, setEdges]);

  // Connect bottom handle -> top handle
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_, node) => setSelectedNodeId(node.id), []);

  // Fonction pour incrémenter la version d'un nœud (force le re-render)
  const incrementNodeVersion = useCallback((nodeId) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId 
          ? { ...n, data: { ...n.data, version: (n.data.version || 0) + 1 } }
          : n
      )
    );
  }, [setNodes]);

  // Ajouter un nouveau nœud
  const addNode = useCallback(() => {
    const newId = `node_${Date.now()}`;
    const newNode = createNode(newId, `Nœud ${nodes.length + 1}`, "Nouveau message");
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newId);
  }, [nodes.length, setNodes]);

  // Mettre à jour les données d'un nœud
  const updateNodeData = useCallback((field, value) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId ? { ...n, data: { ...n.data, [field]: value } } : n
      )
    );
  }, [selectedNodeId, setNodes]);

  // Ajouter un choix
  const addChoice = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId
          ? { 
              ...n, 
              data: { 
                ...n.data, 
                choices: [...n.data.choices, { label: `Choix ${n.data.choices.length + 1}`, next: null, OpenResponse: false }],
                version: (n.data.version || 0) + 1
              } 
            }
          : n
      )
    );
  }, [selectedNodeId, setNodes]);

  // Mettre à jour un choix
  const updateChoice = useCallback((index, field, value) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId
          ? {
              ...n,
              data: {
                ...n.data,
                choices: n.data.choices.map((c, i) => 
                  i === index ? { ...c, [field]: value } : c
                ),
              },
            }
          : n
      )
    );
  }, [selectedNodeId, setNodes]);

  // Gérer la sélection du nœud suivant
  const handleNextNodeSelection = useCallback((choiceIndex, selectedValue) => {
    if (selectedValue === "new") {
      updateChoice(choiceIndex, "next", "new");
      
      // Pré-remplir le champ avec le nom du nœud actuel + le nom du choix
      const currentNode = nodes.find(n => n.id === selectedNodeId);
      const currentChoice = currentNode?.data.choices?.[choiceIndex];
      if (currentNode && currentChoice) {
        const suggestedName = `${currentNode.data.name}${currentChoice.label}`.replace(/\s+/g, '_');
        setNewNodeId(suggestedName);
      }
      return;
    } else if (selectedValue) {
      updateChoice(choiceIndex, "next", selectedValue);
      
      // Créer la connexion
      const sourceHandle = `choice_${choiceIndex}`;
      const newEdge = createEdge(selectedNodeId, sourceHandle, selectedValue);
      setEdges((eds) => addEdge(newEdge, eds));
    }
  }, [selectedNodeId, nodes, updateChoice, setEdges]);

  // Créer un nouveau nœud depuis un choix
  const createNewNodeFromChoice = useCallback((choiceIndex) => {
    if (!newNodeId.trim()) return;
    
    const newId = newNodeId.trim();
    
    // Vérifier si l'ID existe déjà
    if (nodes.find(n => n.id === newId)) {
      alert("Un nœud avec cet ID existe déjà !");
      return;
    }
    
    // Trouver le nœud parent pour calculer sa position
    const parentNode = nodes.find(n => n.id === selectedNodeId);
    const parentPosition = parentNode ? parentNode.position : { x: 0, y: 0 };
    
    // Positionner le nouveau nœud sous le nœud parent
    const newNode = createNode(
      newId, 
      newId, 
      "Nouveau message",
      { 
        x: parentPosition.x, 
        y: parentPosition.y + NODE_DIMENSIONS.HEIGHT + NODE_DIMENSIONS.SPACING 
      }
    );
    
    setNodes((nds) => [...nds, newNode]);
    
    // Mettre à jour le choix avec le nouveau nœud
    updateChoice(choiceIndex, "next", newId);
    
    // Créer la connexion
    const sourceHandle = `choice_${choiceIndex}`;
    const newEdge = createEdge(selectedNodeId, sourceHandle, newId);
    setEdges((eds) => addEdge(newEdge, eds));
    setNewNodeId("");
  }, [newNodeId, nodes, selectedNodeId, setNodes, updateChoice, setEdges]);

  // Supprimer un choix
  const removeChoice = useCallback((index) => {
    // Supprimer les connexions qui utilisent ce handle
    setEdges((eds) => 
      eds.filter(edge => 
        !(edge.source === selectedNodeId && edge.sourceHandle === `choice_${index}`)
      )
    );
    
    // Supprimer le choix et incrémenter la version
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId
          ? {
              ...n,
              data: {
                ...n.data,
                choices: n.data.choices.filter((_, i) => i !== index),
                version: (n.data.version || 0) + 1
              },
            }
          : n
      )
    );

    // Mettre à jour les IDs des edges pour les handles décalés
    setTimeout(() => {
      setEdges((eds) => 
        eds.map(edge => {
          if (edge.source === selectedNodeId && edge.sourceHandle) {
            const handleIndex = parseInt(edge.sourceHandle.split('_')[1]);
            if (handleIndex > index) {
              return {
                ...edge,
                sourceHandle: `choice_${handleIndex - 1}`,
                id: `xy-edge__${edge.source}choice_${handleIndex - 1}-${edge.target}`
              };
            }
          }
          return edge;
        })
      );
    }, 100);
  }, [selectedNodeId, setNodes, setEdges]);

  // Supprimer un nœud
  const deleteNode = useCallback(() => {
    if (!selectedNodeId || selectedNodeId === "root") {
      alert("Impossible de supprimer le nœud racine !");
      return;
    }

    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le nœud "${selectedNode?.data.name}" ?`)) {
      // Supprimer toutes les connexions qui partent de ce nœud
      setEdges((eds) => 
        eds.filter(edge => edge.source !== selectedNodeId && edge.target !== selectedNodeId)
      );
      
      // Supprimer le nœud
      setNodes((nds) => nds.filter(n => n.id !== selectedNodeId));
      
      // Sélectionner le nœud racine par défaut
      setSelectedNodeId("root");
    }
  }, [selectedNodeId, nodes, setNodes, setEdges]);

  // Importer des données
  const importData = useCallback((importData, fileHandle = null) => {
    setNodes(importData.nodes);
    setEdges(importData.edges);
    setSelectedNodeId(importData.nodes[0]?.id || "root");
    setCurrentFileHandle(fileHandle);
  }, [setNodes, setEdges]);

  // Sauvegarder dans le fichier actuel
  const saveToCurrentFile = useCallback(async () => {
    if (!currentFileHandle) {
      alert("Aucun fichier importé. Utilisez 'Export' pour créer un nouveau fichier.");
      return;
    }

    try {
      const result = await saveToFileHandle(currentFileHandle, nodes, edges);
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
      return result;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert(`❌ Erreur lors de la sauvegarde: ${error.message}`);
      throw error;
    }
  }, [currentFileHandle, nodes, edges]);

  return {
    // État
    nodes,
    edges,
    selectedNodeId,
    newNodeId,
    setNewNodeId,
    currentFileHandle,
    
    // Événements ReactFlow
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    
    // Actions sur les nœuds
    addNode,
    updateNodeData,
    deleteNode,
    incrementNodeVersion,
    
    // Actions sur les choix
    addChoice,
    updateChoice,
    removeChoice,
    handleNextNodeSelection,
    createNewNodeFromChoice,
    
    // Import/Export
    importData,
    saveToCurrentFile,
    
    // Sélection
    setSelectedNodeId,
    
    // Navigation
    centerOnNode,
  };
} 
import React, { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Handle,
  Position,
  useEdgesState,
  useNodesState,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * DialogueNode: top target handle + N source handles under the node, spaced evenly.
 */
function DialogueNode({ data }) {
  const choices = data.choices || [];
  
  return (
    <div className="relative w-56">
      {/* Incoming connection */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 rounded-full bg-blue-500"
      />

      <div className="rounded-2xl bg-white border shadow p-4 space-y-1">
        <p className="font-semibold truncate">{data.name}</p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.message}</p>
      </div>

      {/* Outgoing connections: one per choice */}
      {choices.map((choice, idx) => {
        const nodeWidth = 224; // w-56 = 14rem = 224px
        const spacing = nodeWidth / (choices.length + 1);
        const leftPosition = spacing * (idx + 1);
        
        return (
          <Handle
            key={`${data.version || 0}_${idx}`} // Clé unique incluant version
            id={`choice_${idx}`}
            type="source"
            position={Position.Bottom}
            className="w-2 h-2 rounded-full bg-green-500"
            style={{
              position: 'absolute',
              left: `${leftPosition}px`,
              bottom: '-8px',
              transform: 'translateX(-50%)'
            }}
          />
        );
      })}
    </div>
  );
}

const nodeTypes = { dialogue: DialogueNode };

const initialNodes = [
  {
    id: "root",
    type: "dialogue",
    position: { x: 0, y: 0 },
    data: {
      name: "Rooty",
      message: "Bonjour, que puis-je faire pour vous ?",
      choices: [{ label: "Oui" }, { label: "Non" }],
      version: 0, // Version pour forcer les re-renders
    },
  },
];

const initialEdges = [];

export default function DialogueTreeEditorFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState("root");
  const [newNodeId, setNewNodeId] = useState("");

  /* Connect bottom handle -> top handle */
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = (_, node) => setSelectedNodeId(node.id);

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

  /* Helpers */
  const addNode = () => {
    const newId = `node_${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: "dialogue",
        position: { x: 120 + Math.random() * 200, y: 180 + Math.random() * 200 },
        data: {
          name: `Nœud ${nds.length + 1}`,
          message: "Nouveau message",
          choices: [],
          version: 0,
        },
      },
    ]);
    setSelectedNodeId(newId);
  };

  const updateNodeData = (field, value) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId ? { ...n, data: { ...n.data, [field]: value } } : n
      )
    );
  };

  const addChoice = () => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId
          ? { 
              ...n, 
              data: { 
                ...n.data, 
                choices: [...n.data.choices, { label: `Choix ${n.data.choices.length + 1}`, next: null }],
                version: (n.data.version || 0) + 1 // Incrémenter la version
              } 
            }
          : n
      )
    );
  };

  const updateChoice = (index, field, value) => {
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
  };

  const handleNextNodeSelection = (choiceIndex, selectedValue) => {
    if (selectedValue === "new") {
      // Ne pas créer le nœud immédiatement, attendre que l'utilisateur entre l'ID
      updateChoice(choiceIndex, "next", "new");
      return;
    } else if (selectedValue) {
      // Sélectionner un nœud existant
      updateChoice(choiceIndex, "next", selectedValue);
      
      // Créer la connexion
      const sourceHandle = `choice_${choiceIndex}`;
      const newEdge = {
        id: `xy-edge__${selectedNodeId}${sourceHandle}-${selectedValue}`,
        source: selectedNodeId,
        sourceHandle: sourceHandle,
        target: selectedValue,
        targetHandle: null, // Handle d'entrée en haut
        animated: true,
        type: 'smoothstep'
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
    }
  };

  const createNewNodeFromChoice = (choiceIndex) => {
    if (!newNodeId.trim()) return;
    
    const newId = newNodeId.trim();
    
    // Vérifier si l'ID existe déjà
    if (nodes.find(n => n.id === newId)) {
      alert("Un nœud avec cet ID existe déjà !");
      return;
    }
    
    // Créer un nouveau nœud
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: "dialogue",
        position: { x: 120 + Math.random() * 200, y: 180 + Math.random() * 200 },
        data: {
          name: `Nœud ${nds.length + 1}`,
          message: "Nouveau message",
          choices: [],
          version: 0,
        },
      },
    ]);
    
    // Mettre à jour le choix avec le nouveau nœud
    updateChoice(choiceIndex, "next", newId);
    
    // Créer la connexion
    const sourceHandle = `choice_${choiceIndex}`;
    const newEdge = {
      id: `xy-edge__${selectedNodeId}${sourceHandle}-${newId}`,
      source: selectedNodeId,
      sourceHandle: sourceHandle,
      target: newId,
      targetHandle: null, // Handle d'entrée en haut
      animated: true,
      type: 'smoothstep'
    };
    
    setEdges((eds) => addEdge(newEdge, eds));
    setNewNodeId("");
  };

  const removeChoice = (index) => {
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
                version: (n.data.version || 0) + 1 // Incrémenter la version
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
                id: `xy-edge__${edge.source}choice_${handleIndex - 1}-${edge.target}` // Mettre à jour l'ID de l'edge
              };
            }
          }
          return edge;
        })
      );
    }, 100);
  };

  // Fonction pour nettoyer les connexions orphelines
  const cleanupOrphanedEdges = useCallback(() => {
    setEdges((eds) => 
      eds.filter(edge => {
        // Vérifier si le nœud source existe
        const sourceExists = nodes.find(n => n.id === edge.source);
        if (!sourceExists) return false;
        
        // Vérifier si le nœud target existe
        const targetExists = nodes.find(n => n.id === edge.target);
        if (!targetExists) return false;
        
        // Vérifier si le handle source existe
        if (edge.sourceHandle) {
          const sourceNode = nodes.find(n => n.id === edge.source);
          if (sourceNode && sourceNode.data.choices) {
            const handleIndex = parseInt(edge.sourceHandle.split('_')[1]);
            if (handleIndex >= sourceNode.data.choices.length) return false;
          }
        }
        
        return true;
      })
    );
  }, [nodes, setEdges]);

  // Nettoyer les connexions orphelines quand les nœuds changent
  React.useEffect(() => {
    cleanupOrphanedEdges();
  }, [nodes, cleanupOrphanedEdges]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <ReactFlowProvider>
      <div className="grid grid-cols-5 h-[calc(100vh-4rem)]">
        {/* Canvas */}
        <div className="col-span-3 relative border-r">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            zoomOnScroll
            panOnDrag
            connectionLineType="smoothstep"
            defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
            key={nodes.map(n => `${n.id}_${n.data.version || 0}`).join('_')} // Force re-render complet
          >
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>

          <Button onClick={addNode} className="absolute top-4 right-4 shadow-xl">
            + Ajouter un nœud
          </Button>
        </div>

        {/* Side panel */}
        <div className="col-span-2 p-4 overflow-y-auto">
          {selectedNode ? (
            <Card>
              <CardContent className="space-y-4 p-4">
                <h3 className="font-semibold text-lg">Édition du nœud : {selectedNode.id}</h3>
                <Input
                  value={selectedNode.data.name}
                  onChange={(e) => updateNodeData("name", e.target.value)}
                  placeholder="Nom du nœud"
                />

                <Textarea
                  value={selectedNode.data.message}
                  onChange={(e) => updateNodeData("message", e.target.value)}
                  placeholder="Message affiché par le bot"
                  rows={4}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Choix ({selectedNode.data.choices?.length || 0})</h4>
                    <Button onClick={addChoice} size="sm">+ Ajouter</Button>
                  </div>
                  
                  {(selectedNode.data.choices || []).map((choice, idx) => (
                    <div key={idx} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex gap-2 items-center">
                        <span className="text-sm text-gray-500 w-8">{idx + 1}.</span>
                        <Input
                          value={choice.label}
                          onChange={(e) => updateChoice(idx, "label", e.target.value)}
                          placeholder={`Choix ${idx + 1}`}
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => removeChoice(idx)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 px-2"
                        >
                          ×
                        </Button>
                      </div>
                      
                      <div className="flex gap-2 items-center ml-8">
                        <span className="text-sm text-gray-500 w-16">Next:</span>
                        <Select 
                          value={choice.next || ""} 
                          onValueChange={(value) => handleNextNodeSelection(idx, value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Sélectionner un nœud" />
                          </SelectTrigger>
                          <SelectContent>
                            {choice.next === "new" && (
                              <div className="p-2 border-t">
                                <Input
                                  value={newNodeId}
                                  onChange={(e) => setNewNodeId(e.target.value)}
                                  placeholder="ID du nouveau nœud"
                                  className="mb-2"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      createNewNodeFromChoice(idx);
                                    }
                                  }}
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => createNewNodeFromChoice(idx)}
                                    size="sm"
                                    className="flex-1"
                                    disabled={!newNodeId.trim()}
                                  >
                                    Créer
                                  </Button>
                                  <Button 
                                    onClick={() => {
                                      updateChoice(idx, "next", null);
                                      setNewNodeId("");
                                    }}
                                    variant="outline"
                                    size="sm"
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            )}
                            <SelectItem value="new">+ Nouveau nœud</SelectItem>
                            {nodes
                              .filter(node => node.id !== selectedNodeId)
                              .map((node) => (
                                <SelectItem key={node.id} value={node.id}>
                                  {node.data.name} ({node.id})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {choice.next && choice.next !== "new" && (
                          <Button 
                            onClick={() => {
                              // Supprimer la connexion
                              setEdges((eds) => 
                                eds.filter(edge => 
                                  !(edge.source === selectedNodeId && edge.sourceHandle === `choice_${idx}`)
                                )
                              );
                              // Réinitialiser le choix
                              updateChoice(idx, "next", null);
                            }}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 px-2"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(!selectedNode.data.choices || selectedNode.data.choices.length === 0) && (
                    <p className="text-sm text-gray-500 italic">Aucun choix défini</p>
                  )}
                </div>

                <div className="text-xs text-gray-400">
                  Version: {selectedNode.data.version || 0}
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-gray-500">Sélectionne un nœud pour l'éditer</p>
          )}
        </div>
      </div>
    </ReactFlowProvider>
  );
}
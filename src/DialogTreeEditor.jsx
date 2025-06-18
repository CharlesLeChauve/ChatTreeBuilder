import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function DialogueTreeEditor() {
  const [nodes, setNodes] = useState([
    {
      id: "root",
      name: "Rooty",
      message: "Bonjour, que puis-je faire pour vous ?",
      choices: []
    }
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState("root");
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [draggedNodeId, setDraggedNodeId] = useState(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const updateNode = (field, value) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNodeId ? { ...node, [field]: value } : node
      )
    );
  };

  const addChoice = () => {
    updateNode("choices", [
      ...selectedNode.choices,
      { next: "" }
    ]);
  };

  const addChoiceFromNode = (nodeId) => {
    const targetNode = nodes.find(n => n.id === nodeId);
    if (targetNode && targetNode.id !== selectedNodeId) {
      updateNode("choices", [
        ...selectedNode.choices,
        { next: targetNode.id }
      ]);
    }
  };

  const updateChoice = (index, field, value) => {
    const updatedChoices = [...selectedNode.choices];
    updatedChoices[index][field] = value;
    updateNode("choices", updatedChoices);
  };

  const addNode = () => {
    const newId = `node_${nodes.length}`;
    setNodes((prev) => [
      ...prev,
      { id: newId, name: `Nœud ${nodes.length + 1}`, message: "Nouveau message", choices: [] }
    ]);
    setSelectedNodeId(newId);
  };

  const renameNode = (oldId, newId, newName) => {
    if (newId === oldId && nodes.find(n => n.id === newId)) {
      // Just updating the name
      setNodes((prev) =>
        prev.map((node) =>
          node.id === oldId ? { ...node, name: newName } : node
        )
      );
    } else {
      // Renaming the ID and updating all references
      setNodes((prev) =>
        prev.map((node) => {
          if (node.id === oldId) {
            return { ...node, id: newId, name: newName };
          }
          // Update choice references
          const updatedChoices = node.choices.map(choice => 
            choice.next === oldId ? { ...choice, next: newId } : choice
          );
          return { ...node, choices: updatedChoices };
        })
      );
      setSelectedNodeId(newId);
    }
    setEditingNodeId(null);
  };

  const handleRenameSubmit = (nodeId, newName) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      renameNode(nodeId, nodeId, newName);
    }
  };

  const handleDragStart = (e, nodeId) => {
    setDraggedNodeId(nodeId);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedNodeId) {
      addChoiceFromNode(draggedNodeId);
      setDraggedNodeId(null);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      <div className="col-span-1">
        <h2 className="font-bold mb-2">Nœuds</h2>
        <div className="flex flex-col gap-2">
          {nodes.map((node) => (
            <div key={node.id} className="flex gap-2">
              {editingNodeId === node.id ? (
                <div className="flex gap-1 flex-1">
                  <Input
                    value={node.name}
                    onChange={(e) => {
                      setNodes((prev) =>
                        prev.map((n) =>
                          n.id === node.id ? { ...n, name: e.target.value } : n
                        )
                      );
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameSubmit(node.id, node.name);
                      } else if (e.key === 'Escape') {
                        setEditingNodeId(null);
                      }
                    }}
                    onBlur={() => handleRenameSubmit(node.id, node.name)}
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <Button
                    variant={node.id === selectedNodeId ? "default" : "outline"}
                    onClick={() => setSelectedNodeId(node.id)}
                    onDoubleClick={() => setEditingNodeId(node.id)}
                    className="flex-1 justify-start cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => handleDragStart(e, node.id)}
                    style={{ 
                      opacity: draggedNodeId === node.id ? 0.5 : 1,
                      transform: draggedNodeId === node.id ? 'scale(0.95)' : 'scale(1)'
                    }}
                  >
                    {node.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingNodeId(node.id)}
                    className="px-2"
                  >
                    ✏️
                  </Button>
                </>
              )}
            </div>
          ))}
          <Button onClick={addNode}>+ Ajouter un nœud</Button>
        </div>
      </div>

      <div className="col-span-2">
        {selectedNode && (
          <Card>
            <CardContent className="space-y-4 p-4">
              <h3 className="font-semibold text-lg">Édition du nœud : <Button onDoubleClick={() => setEditingNodeId(selectedNode.id)}>{selectedNode.id}</Button></h3>
              <Textarea
                value={selectedNode.message}
                onChange={(e) => updateNode("message", e.target.value)}
                placeholder="Message affiché par le bot"
              />
              <div 
                className="space-y-2 p-4 border-2 border-dashed border-gray-300 rounded-lg transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                  borderColor: draggedNodeId ? '#3b82f6' : '#d1d5db',
                  backgroundColor: draggedNodeId ? '#eff6ff' : 'transparent'
                }}
              >
                <h4 className="font-semibold">
                  Choix 
                  {draggedNodeId && (
                    <span className="text-sm text-blue-600 ml-2">
                      (Déposez ici pour ajouter "{nodes.find(n => n.id === draggedNodeId)?.name}")
                    </span>
                  )}
                </h4>
                {selectedNode.choices.map((choice, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={choice.next}
                      onChange={(e) => updateChoice(i, "next", e.target.value)}
                      placeholder="ID du nœud suivant"
                    />
                  </div>
                ))}
                <Button onClick={addChoice}>+ Ajouter un choix</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

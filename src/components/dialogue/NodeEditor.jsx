import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function NodeEditor({ 
  selectedNode, 
  nodes, 
  newNodeId, 
  setNewNodeId,
  onUpdateNodeData, 
  onAddChoice, 
  onUpdateChoice, 
  onRemoveChoice, 
  onNextNodeSelection, 
  onCreateNewNodeFromChoice, 
  onDeleteNode, 
  onClose,
  onCenterOnNode
}) {
  if (!selectedNode) return null;

  return (
    <div className="absolute top-20 right-4 w-80 max-h-[calc(100vh-6rem)] overflow-y-auto bg-white border rounded-lg shadow-2xl z-10">
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Édition : {selectedNode.id}</h3>
          <Button 
            onClick={onClose}
            variant="outline"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {nodes.length} nœuds
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Nom du nœud</label>
          <Input
            value={selectedNode.data.name}
            onChange={(e) => onUpdateNodeData("name", e.target.value)}
            placeholder="Nom du nœud"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Message</label>
          <Textarea
            value={selectedNode.data.message}
            onChange={(e) => onUpdateNodeData("message", e.target.value)}
            placeholder="Message affiché par le bot"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Choix ({selectedNode.data.choices?.length || 0})</h4>
            <Button onClick={onAddChoice} size="sm" className="text-xs">+ Ajouter</Button>
          </div>
          
          {(selectedNode.data.choices || []).map((choice, idx) => (
            <ChoiceEditor
              key={idx}
              choice={choice}
              index={idx}
              selectedNode={selectedNode}
              nodes={nodes}
              newNodeId={newNodeId}
              setNewNodeId={setNewNodeId}
              onUpdateChoice={onUpdateChoice}
              onRemoveChoice={onRemoveChoice}
              onNextNodeSelection={onNextNodeSelection}
              onCreateNewNodeFromChoice={onCreateNewNodeFromChoice}
              onCenterOnNode={onCenterOnNode}
            />
          ))}
          
          {(!selectedNode.data.choices || selectedNode.data.choices.length === 0) && (
            <p className="text-xs text-gray-500 italic">Aucun choix défini</p>
          )}
        </div>

        {selectedNode.id !== "root" && (
          <Button 
            onClick={onDeleteNode}
            variant="outline"
            size="sm"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
          >
            🗑️ Supprimer ce nœud
          </Button>
        )}

        <div className="text-xs text-gray-400 text-center">
          Version: {selectedNode.data.version || 0}
        </div>
      </div>
    </div>
  );
}

function ChoiceEditor({ 
  choice, 
  index, 
  selectedNode, 
  nodes, 
  newNodeId, 
  setNewNodeId,
  onUpdateChoice, 
  onRemoveChoice, 
  onNextNodeSelection, 
  onCreateNewNodeFromChoice,
  onCenterOnNode
}) {
  return (
    <div className="space-y-2 p-2 border rounded text-sm">
      <div className="flex gap-2 items-center">
        <button
          onClick={() => {
            if (choice.next && choice.next !== "new") {
              onCenterOnNode(choice.next);
            }
          }}
          disabled={!choice.next || choice.next === "new"}
          className={`text-xs w-6 h-6 rounded flex items-center justify-center transition-colors ${
            choice.next && choice.next !== "new"
              ? "text-blue-600 hover:text-blue-800 hover:bg-blue-100 cursor-pointer"
              : "text-gray-400 cursor-not-allowed"
          }`}
          title={choice.next && choice.next !== "new" ? `Centrer sur ${choice.next}` : "Aucun nœud cible"}
        >
          {index + 1}
        </button>
        <Input
          value={choice.label}
          onChange={(e) => onUpdateChoice(index, "label", e.target.value)}
          placeholder={`Choix ${index + 1}`}
          className="flex-1 text-sm"
        />
        <Button 
          onClick={() => onRemoveChoice(index)}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 px-2 text-xs"
        >
          ×
        </Button>
      </div>
      
      <div className="flex gap-2 items-center ml-6">
        <span className="text-xs text-gray-500 w-12">Next:</span>
        <Select 
          value={choice.next || ""} 
          onValueChange={(value) => onNextNodeSelection(index, value)}
        >
          <SelectTrigger className="flex-1 text-xs">
            <SelectValue placeholder="Sélectionner un nœud" />
          </SelectTrigger>
          <SelectContent>
            {choice.next === "new" && (
              <div className="p-2 border-t">
                <Input
                  value={newNodeId}
                  onChange={(e) => setNewNodeId(e.target.value)}
                  placeholder="ID du nouveau nœud"
                  className="mb-2 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onCreateNewNodeFromChoice(index);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={() => onCreateNewNodeFromChoice(index)}
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={!newNodeId.trim()}
                  >
                    Créer
                  </Button>
                  <Button 
                    onClick={() => {
                      onUpdateChoice(index, "next", null);
                      setNewNodeId("");
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
            <SelectItem value="new">+ Nouveau nœud</SelectItem>
            {nodes
              .filter(node => node.id !== selectedNode.id)
              .map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.data.name} ({node.id})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 
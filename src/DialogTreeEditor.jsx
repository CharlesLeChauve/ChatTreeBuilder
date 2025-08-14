import React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Composants
import { DialogueNode } from "@/components/dialogue/DialogueNode";
import { NodeEditor } from "@/components/dialogue/NodeEditor";
import { Toolbar } from "@/components/dialogue/Toolbar";

// Hooks
import { useDialogueTree } from "@/hooks/useDialogueTree";

// Utilitaires
import { importFromJSONWithHandle } from "@/utils/exportUtils";

// Constantes
import { NODE_TYPES, REACTFLOW_CONFIG } from "@/types/constants";

const nodeTypes = { [NODE_TYPES.DIALOGUE]: DialogueNode };

function DialogueTreeEditorContent() {
  // Instance ReactFlow pour le centrage
  const { setCenter } = useReactFlow();

  // Fonction de centrage avec animation
  const centerOnNodeCallback = React.useCallback((x, y) => {
    setCenter(x, y, { duration: 800, zoom: 1.2 });
  }, [setCenter]);

  const {
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
  } = useDialogueTree(centerOnNodeCallback);

  // Handler pour l'import
  const handleImportJSON = () => {
    importFromJSONWithHandle(importData);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Canvas */}
      <div className="w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          {...REACTFLOW_CONFIG}
          key={nodes.map(n => `${n.id}_${n.data.version || 0}`).join('_')} // Force re-render complet
        >
          <MiniMap />
          <Controls />
          <Background gap={16} />
        </ReactFlow>

        <Toolbar
          onAddNode={addNode}
          onImportJSON={handleImportJSON}
          onSave={saveToCurrentFile}
          nodes={nodes}
          edges={edges}
          currentFileHandle={currentFileHandle}
        />

        {/* Popup d'édition - affiché seulement quand un nœud est sélectionné */}
        {selectedNode && (
          <NodeEditor
            selectedNode={selectedNode}
            nodes={nodes}
            newNodeId={newNodeId}
            setNewNodeId={setNewNodeId}
            onUpdateNodeData={updateNodeData}
            onAddChoice={addChoice}
            onUpdateChoice={updateChoice}
            onRemoveChoice={removeChoice}
            onNextNodeSelection={handleNextNodeSelection}
            onCreateNewNodeFromChoice={createNewNodeFromChoice}
            onDeleteNode={deleteNode}
            onClose={() => setSelectedNodeId(null)}
            onCenterOnNode={centerOnNode}
          />
        )}
      </div>
    </div>
  );
}

export default function DialogueTreeEditorFlow() {
  return (
    <ReactFlowProvider>
      <DialogueTreeEditorContent />
    </ReactFlowProvider>
  );
}
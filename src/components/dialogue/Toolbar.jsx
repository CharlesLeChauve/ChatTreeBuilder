import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExportModal } from "./ExportModal";

export function Toolbar({ 
  onAddNode, 
  onImportJSON,
  onSave,
  nodes,
  edges,
  currentFileHandle
}) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleExport = async (exportType) => {
    const { handleExport } = await import("@/utils/exportUtils");
    return handleExport(exportType, nodes, edges);
  };

  const rootNode = nodes.find(n => n.id === "root");
  const rootNodeName = rootNode?.data.name || "root";

  return (
    <>
      <div className="absolute top-4 right-4 flex gap-2">
        <Button onClick={onAddNode} className="shadow-xl">
          + Ajouter un nœud
        </Button>
        
        {/* Bouton Save - visible seulement si un fichier est importé */}
        {currentFileHandle && (
          <Button 
            onClick={onSave} 
            variant="outline" 
            className="shadow-xl bg-green-50 border-green-200 hover:bg-green-100"
          >
            💾 Sauvegarder
          </Button>
        )}
        
        <Button 
          onClick={() => setIsExportModalOpen(true)} 
          variant="outline" 
          className="shadow-xl"
        >
          📤 Exporter
        </Button>
        
        <Button 
          variant="outline" 
          className="shadow-xl"
          onClick={onImportJSON}
        >
          📥 Importer JSON
        </Button>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        nodes={nodes}
        edges={edges}
        rootNodeName={rootNodeName}
      />
    </>
  );
} 
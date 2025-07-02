import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExportModal } from "./ExportModal";

export function Toolbar({ 
  onAddNode, 
  onImportJSON,
  nodes,
  edges
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
        <Button 
          onClick={() => setIsExportModalOpen(true)} 
          variant="outline" 
          className="shadow-xl"
        >
          📤 Exporter
        </Button>
        <label className="cursor-pointer">
          <input
            id="file-import"
            type="file"
            accept=".json"
            onChange={onImportJSON}
            className="hidden"
          />
          <Button 
            variant="outline" 
            className="shadow-xl"
            onClick={() => document.getElementById('file-import').click()}
          >
            📥 Importer JSON
          </Button>
        </label>
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
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ExportModal({ 
  isOpen, 
  onClose, 
  onExport, 
  nodes, 
  edges,
  rootNodeName = "root"
}) {
  const [exportType, setExportType] = useState("json");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(exportType);
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Erreur lors de l'export: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const getExportInfo = () => {
    switch (exportType) {
      case "json":
        return {
          title: "JSON Complet",
          description: "Schéma complet avec tous les nœuds et connexions",
          details: `${nodes.length} nœuds, ${edges.length} connexions`
        };
      case "conversation":
        return {
          title: "Données de Conversation",
          description: "Données simplifiées pour l'utilisation en conversation",
          details: `${nodes.length} nœuds de dialogue`
        };
      default:
        return {
          title: "Export",
          description: "Exporte les données",
          details: ""
        };
    }
  };

  const exportInfo = getExportInfo();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📤 Exporter</span>
            <Button 
              onClick={onClose}
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Type d'export */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Type d'export
            </label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON Complet</SelectItem>
                <SelectItem value="conversation">Données de Conversation</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {exportInfo.description}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {exportInfo.details}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? "Export..." : "Exporter"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
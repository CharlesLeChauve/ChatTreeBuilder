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

/**
 * DialogueNode: top target handle + N source handles under the node, spaced evenly.
 */
function DialogueNode({ data }) {
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
      <div className="absolute left-0 right-0 -bottom-2 flex justify-evenly">
        {(data.choices || []).map((_, idx) => (
        <Handle
            key={idx}
            id={`choice_${idx}`}
            type="source"
            position={Position.Bottom}
            className="w-2 h-2 rounded-full bg-green-500"
        />
        ))}
      </div>
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
    },
  },
];

const initialEdges = [];

export default function DialogueTreeEditorFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState("root");

  /* Connect bottom handle -> top handle */
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = (_, node) => setSelectedNodeId(node.id);

  /* Helpers */
  const addNode = () => {
    const newId = `node_${nodes.length}`;
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: "dialogue",
        position: { x: 120 + 80 * nds.length, y: 180 + 100 * nds.length },
        data: {
          name: `Nœud ${nds.length + 1}`,
          message: "Nouveau message",
          choices: [],
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
          ? { ...n, data: { ...n.data, choices: [...n.data.choices, { label: "" }] } }
          : n
      )
    );
  };

  const updateChoice = (index, value) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId
          ? {
              ...n,
              data: {
                ...n.data,
                choices: n.data.choices.map((c, i) => (i === index ? { ...c, label: value } : c)),
              },
            }
          : n
      )
    );
  };

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
                />

                <div className="space-y-2">
                  <h4 className="font-semibold">Choix</h4>
                  {(selectedNode.data.choices || []).map((choice, idx) => (
                    <Input
                        key={idx}
                        value={choice.label}
                        onChange={(e) => updateChoice(idx, e.target.value)}
                        placeholder={`Choix ${idx + 1}`}
                    />
                    ))}
                  <Button onClick={addChoice}>+ Ajouter un choix</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p>Sélectionne un nœud pour l’éditer</p>
          )}
        </div>
      </div>
    </ReactFlowProvider>
  );
}

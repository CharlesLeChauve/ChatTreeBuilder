import React from "react";
import { Handle, Position } from "@xyflow/react";
import { NODE_DIMENSIONS } from "@/types/constants";

/**
 * DialogueNode: top target handle + N source handles under the node, spaced evenly.
 */
export function DialogueNode({ data }) {
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
        const spacing = NODE_DIMENSIONS.WIDTH / (choices.length + 1);
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
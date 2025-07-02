/**
 * Crée un nouveau nœud de dialogue
 */
export function createNode(id, name, message, position = null) {
  const defaultPosition = position || { 
    x: 120 + Math.random() * 200, 
    y: 180 + Math.random() * 200 
  };
  
  return {
    id,
    type: "dialogue",
    position: defaultPosition,
    data: {
      name,
      message,
      choices: [],
      version: 0,
    },
  };
}

/**
 * Crée une nouvelle connexion (edge)
 */
export function createEdge(source, sourceHandle, target) {
  return {
    id: `xy-edge__${source}${sourceHandle}-${target}`,
    source,
    sourceHandle,
    target,
    targetHandle: null, // Handle d'entrée en haut
    animated: true,
    type: 'smoothstep'
  };
}

/**
 * Nettoie les connexions orphelines
 */
export function cleanupOrphanedEdges(nodes, setEdges) {
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
} 
// Types de nœuds
export const NODE_TYPES = {
  DIALOGUE: 'dialogue'
};

// Configuration ReactFlow
export const REACTFLOW_CONFIG = {
  deleteKeyCode: null,
  fitView: true,
  zoomOnScroll: true,
  panOnDrag: true,
  connectionLineType: "smoothstep",
  defaultEdgeOptions: { 
    type: 'smoothstep', 
    animated: true 
  }
};

// Dimensions des nœuds
export const NODE_DIMENSIONS = {
  WIDTH: 224, // w-56 = 14rem = 224px
  HEIGHT: 120,
  SPACING: 80
};

// Données initiales
export const INITIAL_NODES = [
  {
    id: "root",
    type: NODE_TYPES.DIALOGUE,
    position: { x: 0, y: 0 },
    data: {
      name: "Rooty",
      message: "Bonjour, que puis-je faire pour vous ?",
      choices: [{ label: "Oui" }, { label: "Non" }],
      version: 0,
    },
  },
];

export const INITIAL_EDGES = []; 
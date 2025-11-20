export type NodeType = 'TASK' | 'START' | 'END';

export interface NodeData {
  label: string;
  [key: string]: unknown;
}

export interface Node {
  id: string;
  type: string; // React Flow uses specific types, we can map our NodeType
  position: { x: number; y: number };
  data: NodeData;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  nodes: Node[];
  edges: Edge[];
}

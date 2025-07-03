import {
  Edge,
  EdgeChange,
  NodeChange,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  XYPosition,
  InternalNode,
} from "@xyflow/react";
import { create } from "zustand";
import { nanoid } from "nanoid/non-secure";

import { MindMapNode } from "./types";

export type RFState = {
  nodes: MindMapNode[];
  edges: Edge[];
  nodeLookup: Map<string, InternalNode>;
  setNodeLookup: (map: Map<string, InternalNode>) => void;
  onNodesChange: OnNodesChange<MindMapNode>;
  onEdgesChange: OnEdgesChange;
  updateNodeLabel: (nodeId: string, label: string) => void;
  addChildNode: (parentNode: InternalNode, position: XYPosition) => void;
  createRootNode: (label: string) => void;
};

const useStore = create<RFState>((set, get) => ({
  nodes: [],
  edges: [],
  nodeLookup: new Map(),

  setNodeLookup: (map: Map<string, InternalNode>) => {
    set({ nodeLookup: map });
  },

  onNodesChange: (changes: NodeChange<MindMapNode>[]) => {
    set({
      nodes: applyNodeChanges<MindMapNode>(changes, get().nodes),
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  updateNodeLabel: (nodeId: string, label: string) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, label },
          };
        }
        return node;
      }),
    });
  },

  addChildNode: (parentNode: InternalNode, position: XYPosition) => {
    const newNode: MindMapNode = {
      id: nanoid(),
      type: "mindmap",
      data: { label: "New Node" },
      position,
      dragHandle: ".dragHandle",
      parentId: parentNode.id,
    };

    const newEdge: Edge = {
      id: nanoid(),
      source: parentNode.id,
      target: newNode.id,
    };

    set({
      nodes: [...get().nodes, newNode],
      edges: [...get().edges, newEdge],
    });
  },

  createRootNode: (label: string) => {
    const rootNode: MindMapNode = {
      id: "root",
      type: "mindmap",
      data: { label: label },
      position: { x: 0, y: 0 },
      dragHandle: ".dragHandle",
    };

    set({
      nodes: [rootNode],
      edges: [],
    });

    console.log("✅ Root node created:", rootNode);
  },
}));

export default useStore;

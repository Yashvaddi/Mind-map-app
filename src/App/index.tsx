import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  ConnectionLineType,
  NodeOrigin,
  OnConnectEnd,
  OnConnectStart,
  useReactFlow,
  useStoreApi,
  Panel,
  InternalNode,
} from "@xyflow/react";
import { useShallow } from "zustand/react/shallow";

import useStore, { RFState } from "./store";
import MindMapNode from "./MindMapNode";
import MindMapEdge from "./MindMapEdge";

import "@xyflow/react/dist/style.css";
import { create } from "zustand";
import useLabelStore from "./useLabelStore";

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  addChildNode: state.addChildNode,
});

const nodeTypes = {
  mindmap: MindMapNode,
};

const edgeTypes = {
  mindmap: MindMapEdge,
};

const nodeOrigin: NodeOrigin = [0.5, 0.5];

const connectionLineStyle = { stroke: "rgb(79 42 193)", strokeWidth: 3 };
const defaultEdgeOptions = { style: connectionLineStyle, type: "mindmap" };
function Flow() {
  const label = useLabelStore((state) => state.label);
  const setLabel = useLabelStore((state) => state.setLabel);
  const store = useStoreApi();
  const { nodes, edges, onNodesChange, onEdgesChange, addChildNode } = useStore(
    useShallow(selector)
  );
  const { screenToFlowPosition } = useReactFlow();
  const connectingNodeId = useRef<string | null>(null);

  const flowRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!flowRef.current) return;

    const printContent = flowRef.current.innerHTML;

    const printWindow = window.open("", "", "width=900,height=600");
    const styles = `
  <style>
    @page {
      size: landscape;
      margin: 20mm;
    }
    body {
      font-family: sans-serif;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .react-flow__node {
      border: 1px solid #004871;
      padding: 10px;
      border-radius: 6px;
      margin: 10px;
      background: #f9f9f9;
    }
    .dragHandle, button {
      display: none;
    }
    input {
      border: none;
      background: transparent;
      font-size: 16px;
    }
  </style>
`;

    printWindow!.document.write(`
    <html>
      <head><title>Print Mind Map</title>${styles}</head>
      <body>${printContent}</body>
    </html>
  `);
    printWindow!.document.close();
    printWindow!.focus();
    printWindow!.print();
    printWindow!.close();
  };

  const getChildNodePosition = (
    event: MouseEvent | TouchEvent,
    parentNode?: InternalNode
  ) => {
    const { domNode } = store.getState();

    if (
      !domNode ||
      !parentNode?.internals.positionAbsolute ||
      !parentNode?.measured.width ||
      !parentNode?.measured.height
    ) {
      return;
    }

    const panePosition = screenToFlowPosition({
      x: "clientX" in event ? event.clientX : event.touches[0].clientX,
      y: "clientY" in event ? event.clientY : event.touches[0].clientY,
    });

    return {
      x: panePosition.x - parentNode.internals.positionAbsolute.x,
      y: panePosition.y - parentNode.internals.positionAbsolute.y,
    };
  };

  const onConnectStart: OnConnectStart = useCallback((_, { nodeId }) => {
    connectingNodeId.current = nodeId;
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const { nodeLookup } = store.getState();
      const targetIsPane = (event.target as Element).classList.contains(
        "react-flow__pane"
      );
      const node = (event.target as Element).closest(".react-flow__node");

      if (node) {
        node.querySelector("input")?.focus({ preventScroll: true });
      } else if (targetIsPane && connectingNodeId.current) {
        const parentNode = nodeLookup.get(connectingNodeId.current);

        if (parentNode) {
          const childNodePosition = getChildNodePosition(event, parentNode);

          if (childNodePosition) {
            addChildNode(parentNode, childNodePosition);
          }
        }
      }
    },
    [getChildNodePosition]
  );
  const createRootNode = useStore((s) => s.createRootNode);

  return (
    // <div ref={flowRef}>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      ref={flowRef}
      onEdgesChange={onEdgesChange}
      onConnectStart={onConnectStart}
      onConnectEnd={onConnectEnd}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      className="print-wrapper"
      nodeOrigin={nodeOrigin}
      defaultEdgeOptions={defaultEdgeOptions}
      connectionLineStyle={connectionLineStyle}
      connectionLineType={ConnectionLineType.Straight}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Panel position="top-center" className="header">
        {!nodes?.length && (
          <div className="add-root-node">
            <input type="text" onChange={(e) => setLabel(e.target.value)} />
            <button
              onClick={() => {
                createRootNode(label);
              }}
              disabled={!!nodes?.length || !label}
            >
              Add Root Node
            </button>
          </div>
        )}
        <div className="add-root-node">
          {!!nodes.length && (
            <button
              onClick={handlePrint}
              className="ml-4 px-3 py-1 bg-blue-600 text-white rounded"
            >
              Print Nodes
            </button>
          )}
        </div>
      </Panel>
    </ReactFlow>
    // </div>
  );
}

export default Flow;

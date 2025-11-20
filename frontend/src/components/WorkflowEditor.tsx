import React, { useCallback, useState } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    MiniMap,
} from 'reactflow';
import type { Connection, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import type { Workflow } from '../types/workflow';
import LLMNode from './nodes/LLMNode';
import ResultNode from './nodes/ResultNode';
import SettingsModal from './SettingsModal';
import JsonViewModal from './JsonViewModal';

const nodeTypes = {
    LLM: LLMNode,
    RESULT: ResultNode,
};

const initialNodes: Node[] = [
    { id: '1', position: { x: 250, y: 5 }, data: { label: 'Start', model: 'GPT-4', prompt: 'Hello' }, type: 'LLM' },
    { id: '2', position: { x: 250, y: 200 }, data: { label: 'Result' }, type: 'RESULT' },
];
const initialEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

export default function WorkflowEditor() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isJsonViewOpen, setIsJsonViewOpen] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

    // Auto-dismiss success toast
    React.useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds: Edge[]) => addEdge(params, eds)),
        [setEdges],
    );

    const handleExport = async () => {
        const workflow: Workflow = {
            id: 'wf-' + Date.now(),
            nodes: nodes.map((n: Node) => {
                let nodeType = 'TASK';
                if (n.type === 'LLM') nodeType = 'LLM';
                else if (n.type === 'RESULT') nodeType = 'RESULT';
                else if (n.type === 'input') nodeType = 'START';
                else if (n.type === 'output') nodeType = 'END';

                return {
                    id: n.id,
                    type: nodeType,
                    position: n.position,
                    data: n.data,
                };
            }),
            edges: edges.map((e: Edge) => ({
                id: e.id,
                source: e.source,
                target: e.target,
            })),
        };

        console.log('Exporting workflow:', workflow);

        try {
            // Clear previous errors and results
            setNodes((nds) => nds.map(node => ({
                ...node,
                data: { ...node.data, error: undefined, result: undefined }
            })));

            const response = await fetch('http://localhost:8080/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workflow),
            });

            if (!response.ok) {
                const errorText = await response.text();

                // Try to parse node-specific error
                // Expected format: "vertex [ID] failed: [message]"
                const match = errorText.match(/vertex (\w+) failed: (.+)/);
                if (match) {
                    const [, nodeId, errorMessage] = match;
                    setNodes((nds) => nds.map(node => {
                        if (node.id === nodeId) {
                            return { ...node, data: { ...node.data, error: errorMessage } };
                        }
                        return node;
                    }));
                }

                throw new Error(`Server error (${response.status}):\n${errorText}`);
            }

            const result = await response.json();
            console.log('Backend response:', result);

            // Update nodes with results
            setNodes((nds) => nds.map((node) => {
                if (result[node.id]) {
                    return {
                        ...node,
                        data: { ...node.data, result: JSON.stringify(result[node.id], null, 2) },
                    };
                }
                return node;
            }));

            setSuccess('Workflow executed successfully!');
        } catch (err) {
            setError((err as Error).message || 'An unknown error occurred');
        }
    };

    const addNode = (type: string) => {
        const id = (nodes.length + 1).toString();
        const newNode: Node = {
            id,
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: { label: `${type} Node` },
            type,
        };
        setNodes((nds: Node[]) => nds.concat(newNode));
    };

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <div style={{ position: 'absolute', zIndex: 10, top: 10, right: 10, display: 'flex', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                    <button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}>+ Add Node</button>
                    {isAddMenuOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '5px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: '150px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                        }}>
                            <button
                                onClick={() => { addNode('LLM'); setIsAddMenuOpen(false); }}
                                style={{ textAlign: 'left', border: 'none', background: 'transparent', padding: '10px', color: '#e0e0e0', borderRadius: '4px 4px 0 0' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                LLM Node
                            </button>
                            <button
                                onClick={() => { addNode('RESULT'); setIsAddMenuOpen(false); }}
                                style={{ textAlign: 'left', border: 'none', background: 'transparent', padding: '10px', color: '#e0e0e0', borderRadius: '0 0 4px 4px' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                Result Node
                            </button>
                        </div>
                    )}
                </div>
                <button onClick={() => setIsSettingsOpen(true)}>Settings</button>
                <button onClick={() => setIsJsonViewOpen(true)}>Show JSON</button>
                <button onClick={handleExport}>Run Workflow</button>
            </div>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="dark"
            >
                <Controls />
                <MiniMap />
                <Background gap={12} size={1} />
            </ReactFlow>
            {error && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 100,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                        padding: 20,
                        borderRadius: 8,
                        maxWidth: 400,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                        border: '1px solid #333'
                    }}>
                        <h3 style={{ marginTop: 0, color: '#ff6b6b' }}>Error Details</h3>
                        <pre style={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            maxHeight: '300px',
                            overflow: 'auto',
                            backgroundColor: '#000',
                            padding: '10px',
                            borderRadius: '4px',
                            color: '#ff6b6b'
                        }}>
                            {error}
                        </pre>
                        <button onClick={() => setError(null)} style={{ marginTop: 10 }}>Close</button>
                    </div>
                </div>
            )}
            {success && (
                <div style={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    backgroundColor: '#4caf50',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    animation: 'fadeIn 0.3s ease-in-out'
                }}>
                    {success}
                    {success}
                </div>
            )}
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <JsonViewModal
                isOpen={isJsonViewOpen}
                onClose={() => setIsJsonViewOpen(false)}
                data={{ nodes, edges }}
            />
        </div>
    );
}

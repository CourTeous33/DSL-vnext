import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from 'reactflow';

const LLMNode = ({ id, data, isConnectable }: NodeProps) => {
    const [expanded, setExpanded] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const { setNodes } = useReactFlow();

    const handlePromptChange = useCallback((evt: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newPrompt = evt.target.value;
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                // Create a new data object to ensure immutability and trigger re-renders
                return { ...node, data: { ...node.data, prompt: newPrompt } };
            }
            return node;
        }));
    }, [id, setNodes]);

    const handleModelChange = useCallback((evt: React.ChangeEvent<HTMLSelectElement>) => {
        const newModel = evt.target.value;
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, model: newModel } };
            }
            return node;
        }));
    }, [id, setNodes]);

    return (
        <div style={{
            padding: '15px',
            borderRadius: '8px',
            background: '#fff',
            border: data.error ? '2px solid #ff4d4f' : '1px solid #e0e0e0',
            minWidth: '250px',
            color: '#333',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>LLM Node</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setNodes((nds) => nds.filter((n) => n.id !== id))}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ff4d4f',
                            fontSize: '14px',
                            padding: '0 4px'
                        }}
                        title="Delete Node"
                    >
                        ×
                    </button>
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: showDebug ? '#1890ff' : '#666',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                        title="Toggle Debug Info"
                    >
                        {'{ }'}
                    </button>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#666',
                            fontSize: '12px'
                        }}
                    >
                        {expanded ? '▼' : '▶'}
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', color: '#555' }}>Model</label>
                <select
                    value={data.model || 'GPT-4'}
                    onChange={handleModelChange}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #d9d9d9',
                        fontSize: '13px',
                        backgroundColor: '#fff',
                        color: '#333'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <option value="GPT-4">GPT-4</option>
                    <option value="GPT-3.5">GPT-3.5</option>
                    <option value="Gemini">Gemini</option>
                    <option value="Claude">Claude</option>
                </select>
            </div>

            {expanded && (
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', color: '#555' }}>Prompt</label>
                    <textarea
                        value={data.prompt || ''}
                        onChange={handlePromptChange}
                        placeholder="Enter prompt..."
                        rows={6}
                        className="nodrag"
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #d9d9d9',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: '#333',
                            backgroundColor: '#fff'
                        }}
                    />
                </div>
            )}

            {!expanded && (
                <div style={{
                    fontSize: '12px',
                    color: '#666',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    padding: '4px 0',
                    borderTop: '1px solid #f0f0f0',
                    marginTop: '8px'
                }}>
                    {data.prompt ? `"${data.prompt}"` : <span style={{ fontStyle: 'italic', color: '#999' }}>No prompt set</span>}
                </div>
            )}

            {data.error && (
                <div style={{
                    marginTop: '10px',
                    padding: '8px',
                    backgroundColor: '#fff1f0',
                    border: '1px solid #ffccc7',
                    borderRadius: '4px',
                    color: '#cf1322',
                    fontSize: '12px'
                }}>
                    <strong>Error:</strong> {data.error}
                </div>
            )}

            {showDebug && (
                <div style={{
                    marginTop: '10px',
                    padding: '8px',
                    backgroundColor: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: '4px',
                    color: '#389e0d',
                    fontSize: '11px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '200px',
                    overflow: 'auto'
                }}>
                    <strong>Debug Output:</strong>
                    <div style={{ marginTop: '4px', fontFamily: 'monospace' }}>
                        {data.result || 'No result yet'}
                    </div>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
        </div>
    );
};

export default memo(LLMNode);

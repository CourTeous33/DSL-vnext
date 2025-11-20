import { memo } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from 'reactflow';

const ResultNode = ({ id, data, isConnectable }: NodeProps) => {
    const { setNodes } = useReactFlow();
    return (
        <div style={{
            padding: '15px',
            borderRadius: '8px',
            background: '#f0fcfd',
            border: '1px solid #006064',
            minWidth: '200px',
            color: '#006064',
            boxShadow: '0 4px 6px -1px rgba(0, 96, 100, 0.1), 0 2px 4px -1px rgba(0, 96, 100, 0.06)'
        }}>
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>Result Node</div>
                <button
                    onClick={() => setNodes((nds) => nds.filter((n) => n.id !== id))}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#006064',
                        opacity: 0.6,
                        fontSize: '16px',
                        padding: '0 4px',
                        lineHeight: 1
                    }}
                    title="Delete Node"
                >
                    ×
                </button>
            </div>
            <div style={{
                fontSize: '13px',
                lineHeight: '1.5',
                backgroundColor: 'rgba(255,255,255,0.5)',
                padding: '8px',
                borderRadius: '4px',
                marginTop: '5px',
                color: '#006064',
                position: 'relative'
            }}>
                {data.result ? (
                    <>
                        <span style={{ fontWeight: '500' }}>Output: {data.result}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(data.result);
                            }}
                            style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'rgba(255,255,255,0.8)',
                                border: '1px solid #006064',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '10px',
                                padding: '2px 6px',
                                color: '#006064'
                            }}
                            title="Copy to clipboard"
                        >
                            Copy
                        </button>
                    </>
                ) : (
                    <span style={{ fontStyle: 'italic', opacity: 0.8 }}>Waiting for output...</span>
                )}
            </div>
        </div>
    );
};

export default memo(ResultNode);

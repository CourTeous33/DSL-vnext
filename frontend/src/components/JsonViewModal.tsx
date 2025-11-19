import React from 'react';

interface JsonViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
}

const JsonViewModal: React.FC<JsonViewModalProps> = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 2000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{
                backgroundColor: '#1a1a1a',
                color: '#e0e0e0',
                padding: '20px',
                borderRadius: '8px',
                width: '80%',
                maxWidth: '800px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                border: '1px solid #333'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px' }}>Workflow JSON</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#999',
                            cursor: 'pointer',
                            fontSize: '20px'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    backgroundColor: '#111',
                    padding: '15px',
                    borderRadius: '4px',
                    border: '1px solid #333',
                    textAlign: 'left'
                }}>
                    <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', lineHeight: '1.5' }}>{JSON.stringify(data, null, 2)}</pre>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                        }}
                        style={{
                            marginRight: '10px',
                            background: '#333',
                            color: 'white',
                            border: '1px solid #555'
                        }}
                    >
                        Copy to Clipboard
                    </button>
                    <button onClick={onClose} style={{ background: '#646cff', border: 'none', color: 'white' }}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default JsonViewModal;

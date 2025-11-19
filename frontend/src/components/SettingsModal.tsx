import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [apiKeys, setApiKeys] = useState({
        openai: '',
        gemini: '',
        anthropic: ''
    });

    useEffect(() => {
        if (isOpen) {
            const storedKeys = localStorage.getItem('workflow_api_keys');
            if (storedKeys) {
                setApiKeys(JSON.parse(storedKeys));
            }
        }
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('workflow_api_keys', JSON.stringify(apiKeys));
        onClose();
    };

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
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                width: '400px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                border: '1px solid #333'
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Settings</h2>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>OpenAI API Key</label>
                    <input
                        type="password"
                        value={apiKeys.openai}
                        onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Gemini API Key</label>
                    <input
                        type="password"
                        value={apiKeys.gemini}
                        onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white' }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Anthropic API Key</label>
                    <input
                        type="password"
                        value={apiKeys.anthropic}
                        onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #666', color: 'white' }}>Cancel</button>
                    <button onClick={handleSave} style={{ background: '#646cff', border: 'none', color: 'white' }}>Save</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;

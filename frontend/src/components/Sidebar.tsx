import React, { useEffect, useState } from 'react';

interface SavedWorkflow {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

interface SidebarProps {
    onLoadWorkflow: (id: string | null) => void;
    refreshTrigger: number; // Used to trigger a refresh of the list
}

const Sidebar: React.FC<SidebarProps> = ({ onLoadWorkflow, refreshTrigger }) => {
    const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
    const [isOpen, setIsOpen] = useState(true);
    const [hasLoadedDefault, setHasLoadedDefault] = useState(false);

    useEffect(() => {
        fetchWorkflows();
    }, [refreshTrigger]);

    const fetchWorkflows = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/workflows');
            if (response.ok) {
                const data = await response.json();
                setWorkflows(data || []);

                // Auto-load the first workflow if not yet loaded
                if (!hasLoadedDefault && data && data.length > 0) {
                    onLoadWorkflow(data[0].id);
                    setHasLoadedDefault(true);
                }
            }
        } catch (error) {
            console.error('Failed to fetch workflows:', error);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 100,
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderLeft: 'none',
                    color: '#fff',
                    padding: '10px 5px',
                    cursor: 'pointer',
                    borderRadius: '0 4px 4px 0'
                }}
            >
                ▶
            </button>
        );
    }

    return (
        <div style={{
            width: '250px',
            height: '100vh',
            backgroundColor: '#1a1a1a',
            borderRight: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 90
        }}>
            <div style={{
                padding: '15px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>Workflows</h3>
                    <button
                        onClick={() => onLoadWorkflow(null)}
                        style={{
                            background: '#2a2a2a',
                            border: '1px solid #444',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 8px',
                            borderRadius: '4px'
                        }}
                        title="New Workflow"
                    >
                        + New
                    </button>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    ◀
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                {workflows.length === 0 ? (
                    <div style={{ color: '#666', textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                        No saved workflows
                    </div>
                ) : (
                    workflows.map((wf) => (
                        <div
                            key={wf.id}
                            onClick={() => onLoadWorkflow(wf.id)}
                            style={{
                                padding: '10px',
                                marginBottom: '8px',
                                backgroundColor: '#2a2a2a',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                border: '1px solid #333',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#646cff'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333'}
                        >
                            <div style={{ color: '#fff', fontWeight: '500', marginBottom: '4px' }}>{wf.name}</div>
                            <div style={{ color: '#666', fontSize: '12px' }}>
                                {new Date(wf.updated_at).toLocaleDateString()} {new Date(wf.updated_at).toLocaleTimeString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Sidebar;

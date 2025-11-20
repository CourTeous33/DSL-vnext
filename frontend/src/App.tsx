import { useState } from 'react';
import WorkflowEditor from './components/WorkflowEditor';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [loadedWorkflowId, setLoadedWorkflowId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleWorkflowSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="App" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        onLoadWorkflow={setLoadedWorkflowId}
        refreshTrigger={refreshTrigger}
      />
      <div style={{ flex: 1, position: 'relative' }}>
        <WorkflowEditor
          loadedWorkflowId={loadedWorkflowId}
          onWorkflowSaved={handleWorkflowSaved}
        />
      </div>
    </div>
  );
}

export default App;

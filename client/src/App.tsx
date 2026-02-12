import { useEffect, useState } from 'react'
import './App.css'
import {
  Navbar,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarItem,
  Card,
  Button,
  Input,
  Table,
  Chart,
  Modal
} from './components'

function App() {
  const [health, setHealth] = useState<{ status: string } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5001/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error('Fetch error:', err))
  }, [])

  const sampleData = [
    { label: 'Jan', value: 40 },
    { label: 'Feb', value: 70 },
    { label: 'Mar', value: 55 },
    { label: 'Apr', value: 90 },
  ];

  return (
    <div className="layout-container">
      <Sidebar>
        <SidebarHeader>
          <div className="card-title" style={{ margin: 0 }}>Ryze AI</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarItem active>Dashboard</SidebarItem>
          <SidebarItem>Analytics</SidebarItem>
          <SidebarItem>Settings</SidebarItem>
        </SidebarContent>
      </Sidebar>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar brand="Core Dashboard">
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>Open Modal</Button>
        </Navbar>

        <div className="panel-content">
          <div className="stack-md">
            <div className="grid-2">
              <Card title="System Performance">
                <p style={{ fontSize: 'var(--text-sm)' }}>
                  Visualizing deterministic metric data.
                </p>
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <Input label="Search Logs" placeholder="e.g. error..." />
                </div>
              </Card>
              <Chart title="User Activity" data={sampleData} />
            </div>

            <Card title="Recent Transactions">
              <Table
                headers={['ID', 'Status', 'Timestamp']}
                data={[
                  { ID: 'TX-101', Status: 'Success', Timestamp: '2026-02-13 01:00' },
                  { ID: 'TX-102', Status: 'Pending', Timestamp: '2026-02-13 01:05' },
                ]}
              />
            </Card>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Configuration"
      >
        <div className="stack-md">
          <p style={{ fontSize: 'var(--text-sm)' }}>Edit your system settings below.</p>
          <Input label="Admin Email" defaultValue="admin@ryze.ai" />
        </div>
      </Modal>

      {/* Backend Status floating indicator */}
      <div className="backend-status">
        Backend: <strong>{health?.status || 'loading...'}</strong>
      </div>
    </div>
  )
}

export default App

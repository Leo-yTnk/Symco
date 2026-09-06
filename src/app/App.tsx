import { Check } from 'lucide-react'
import { useState } from 'react'
import { AppSidebar } from '../components/layout/AppSidebar'
import { PageHeader } from '../components/layout/PageHeader'
import { Topbar } from '../components/layout/Topbar'
import { tasks as initialTasks, weeks } from '../data'
import { BoardPage, TaskDrawer } from '../pages/BoardPage'
import { DashboardPage } from '../pages/DashboardPage'
import { DocumentsPage } from '../pages/DocumentsPage'
import { GatesPage } from '../pages/GatesPage'
import { GovernancePage } from '../pages/GovernancePage'
import { HoursPage } from '../pages/HoursPage'
import { RisksPage } from '../pages/RisksPage'
import { SchedulePage } from '../pages/SchedulePage'
import type { Task, View } from '../types'

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [mobileNav, setMobileNav] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [doneDocuments, setDoneDocuments] = useState<string[]>([])
  const [actualHours, setActualHours] = useState<number[]>(weeks.map(() => 0))
  const [toast, setToast] = useState('')

  const navigate = (nextView: View) => {
    setView(nextView)
    setMobileNav(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateTask = (task: Task) => {
    setTasks(current => current.map(item => item.id === task.id ? task : item))
    setSelectedTask(null)
    setToast(`${task.id} atualizado. Indicadores recalculados.`)
    window.setTimeout(() => setToast(''), 2800)
  }

  const primaryAction = () => {
    if (view === 'dashboard') navigate('board')
    else if (view === 'board' && tasks[0]) setSelectedTask(tasks[0])
  }

  return <div className="app-shell">
    <AppSidebar view={view} open={mobileNav} navigate={navigate} close={() => setMobileNav(false)} />
    <div className="workspace">
      <Topbar openMenu={() => setMobileNav(true)} />
      <main><PageHeader view={view} onAction={view === 'dashboard' || view === 'board' ? primaryAction : undefined} />
        {view === 'dashboard' && <DashboardPage tasks={tasks} documentsDone={doneDocuments.length} hours={actualHours} navigate={navigate} />}
        {view === 'board' && <BoardPage tasks={tasks} select={setSelectedTask} />}
        {view === 'gates' && <GatesPage tasks={tasks} doneDocuments={doneDocuments} />}
        {view === 'schedule' && <SchedulePage tasks={tasks} />}
        {view === 'risks' && <RisksPage />}
        {view === 'documents' && <DocumentsPage done={doneDocuments} setDone={setDoneDocuments} />}
        {view === 'hours' && <HoursPage actual={actualHours} setActual={setActualHours} />}
        {view === 'governance' && <GovernancePage />}
      </main>
    </div>
    {selectedTask && <TaskDrawer task={selectedTask} close={() => setSelectedTask(null)} save={updateTask} />}
    {toast && <div className="toast"><Check size={18} /><span>{toast}</span></div>}
  </div>
}

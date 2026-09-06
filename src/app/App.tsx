import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { SettingsPage } from '../pages/SettingsPage'
import { WelcomePage } from '../pages/WelcomePage'
import type { Task, UserPreferences, View } from '../types'

const defaultPreferences: UserPreferences = { sidebarWidth: 244, accent: 'cyan', theme: 'light', density: 'comfortable', motion: 'full' }

function loadPreferences(): UserPreferences {
  try { return { ...defaultPreferences, ...JSON.parse(localStorage.getItem('symos-preferences') || '{}') } }
  catch { return defaultPreferences }
}

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [mobileNav, setMobileNav] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [doneDocuments, setDoneDocuments] = useState<string[]>([])
  const [actualHours, setActualHours] = useState<number[]>(weeks.map(() => 0))
  const [toast, setToast] = useState('')
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences)
  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem('symos-welcome-seen') !== 'true')

  useEffect(() => {
    localStorage.setItem('symos-preferences', JSON.stringify(preferences))
    const root = document.documentElement
    root.dataset.accent = preferences.accent
    root.dataset.theme = preferences.theme
    root.dataset.density = preferences.density
    root.dataset.motion = preferences.motion
    root.style.setProperty('--sidebar-width', `${preferences.sidebarWidth}px`)
  }, [preferences])

  const updatePreferences = (next: Partial<UserPreferences>) => setPreferences(current => ({ ...current, ...next }))

  const continueToApp = () => {
    localStorage.setItem('symos-welcome-seen', 'true')
    setShowWelcome(false)
  }

  const navigate = (nextView: View) => {
    if (nextView === view) {
      setMobileNav(false)
      return
    }

    const commitNavigation = () => {
      setView(nextView)
      setMobileNav(false)
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' })
    }

    commitNavigation()
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

  if (showWelcome) return <WelcomePage continueToApp={continueToApp} />

  return <div className="app-shell">
    <AppSidebar view={view} open={mobileNav} navigate={navigate} close={() => setMobileNav(false)} width={preferences.sidebarWidth} setWidth={width => updatePreferences({ sidebarWidth: width })} />
    <div className="workspace">
      <Topbar openMenu={() => setMobileNav(true)} />
      <main><div className="page-transition" key={view}>
          <PageHeader view={view} onAction={view === 'dashboard' || view === 'board' ? primaryAction : undefined} />
          {view === 'dashboard' && <DashboardPage tasks={tasks} documentsDone={doneDocuments.length} hours={actualHours} navigate={navigate} />}
          {view === 'board' && <BoardPage tasks={tasks} select={setSelectedTask} />}
          {view === 'gates' && <GatesPage tasks={tasks} doneDocuments={doneDocuments} />}
          {view === 'schedule' && <SchedulePage tasks={tasks} />}
          {view === 'risks' && <RisksPage />}
          {view === 'documents' && <DocumentsPage done={doneDocuments} setDone={setDoneDocuments} />}
          {view === 'hours' && <HoursPage actual={actualHours} setActual={setActualHours} />}
          {view === 'governance' && <GovernancePage />}
          {view === 'settings' && <SettingsPage preferences={preferences} updatePreferences={updatePreferences} />}
        </div>
      </main>
    </div>
    {selectedTask && <TaskDrawer task={selectedTask} close={() => setSelectedTask(null)} save={updateTask} />}
    {toast && <div className="toast"><Check size={18} /><span>{toast}</span></div>}
  </div>
}

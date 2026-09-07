import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AppSidebar } from '../components/layout/AppSidebar'
import { PageHeader } from '../components/layout/PageHeader'
import { Topbar } from '../components/layout/Topbar'
import { gates as initialGateData, tasks as initialTasks, weeks } from '../data'
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
import type { BoardGate, Sprint, Task, TaskClassification, UserPreferences, View } from '../types'
import { defaultSprints, hydrateTasks, loadBoard, saveBoard } from '../services/boardStorage'

const defaultPreferences: UserPreferences = { sidebarWidth: 244, accent: 'cyan', theme: 'light', density: 'comfortable', motion: 'full' }

function loadPreferences(): UserPreferences {
  try { return { ...defaultPreferences, ...JSON.parse(localStorage.getItem('symos-preferences') || '{}') } }
  catch { return defaultPreferences }
}

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [mobileNav, setMobileNav] = useState(false)
  const initialBoard = loadBoard({
    tasks: hydrateTasks(initialTasks),
    sprints: defaultSprints,
    gates: initialGateData.map((gate, index) => ({ id: gate[0], name: gate[1], description: gate[3], decisionOwner: gate[2], evidence: gate[4], plannedDate: gate[5], color: ['#2475d0', '#7b5cc7', '#d9822b', '#28947b'][index % 4] })),
  })
  const [tasks, setTasks] = useState<Task[]>(initialBoard.tasks)
  const [sprints, setSprints] = useState<Sprint[]>(initialBoard.sprints)
  const [boardGates, setBoardGates] = useState<BoardGate[]>(initialBoard.gates)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [doneDocuments, setDoneDocuments] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('symos-documents-done') || '[]') } catch { return [] } })
  const [actualHours, setActualHours] = useState<number[]>(() => { try { return JSON.parse(localStorage.getItem('symos-actual-hours') || 'null') || weeks.map(() => 0) } catch { return weeks.map(() => 0) } })
  const [toast, setToast] = useState('')
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences)
  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem('symos-welcome-seen') !== 'true')
  const [boardClassification, setBoardClassification] = useState<TaskClassification | 'Todas'>('Todas')

  useEffect(() => {
    localStorage.setItem('symos-preferences', JSON.stringify(preferences))
    const root = document.documentElement
    root.dataset.accent = preferences.accent
    root.dataset.theme = preferences.theme
    root.dataset.density = preferences.density
    root.dataset.motion = preferences.motion
    root.style.setProperty('--sidebar-width', `${preferences.sidebarWidth}px`)
  }, [preferences])

  useEffect(() => { saveBoard({ tasks, sprints, gates: boardGates }) }, [tasks, sprints, boardGates])
  useEffect(() => { localStorage.setItem('symos-documents-done', JSON.stringify(doneDocuments)) }, [doneDocuments])
  useEffect(() => { localStorage.setItem('symos-actual-hours', JSON.stringify(actualHours)) }, [actualHours])

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
    closeSelectedTask()
    setToast(`${task.id} atualizado. Indicadores recalculados.`)
    window.setTimeout(() => setToast(''), 2800)
  }

  const closeSelectedTask = () => {
    const overlay = document.querySelector('.overlay:has(> .drawer)')
    if (!overlay) return setSelectedTask(null)
    overlay.classList.add('popup-closing')
    window.setTimeout(() => setSelectedTask(null), 150)
  }

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const primaryAction = () => {
    if (view === 'dashboard') navigate('board')
    else if (view === 'board') document.querySelector<HTMLButtonElement>('[data-create-task]')?.click()
  }

  const openBoardWithClassification = (classification: TaskClassification) => {
    setBoardClassification(classification)
    navigate('board')
  }

  if (showWelcome) return <WelcomePage continueToApp={continueToApp} />

  return <div className="app-shell">
    <AppSidebar view={view} open={mobileNav} navigate={navigate} close={() => setMobileNav(false)} width={preferences.sidebarWidth} setWidth={width => updatePreferences({ sidebarWidth: width })} />
    <div className="workspace">
      <Topbar openMenu={() => setMobileNav(true)} />
      <main><div className="page-transition" key={view}>
          <PageHeader view={view} onAction={view === 'dashboard' || view === 'board' ? primaryAction : undefined} />
          {view === 'dashboard' && <DashboardPage tasks={tasks} gates={boardGates} documentsDone={doneDocuments.length} hours={actualHours} navigate={navigate} openBoardWithClassification={openBoardWithClassification} />}
          {view === 'board' && <BoardPage tasks={tasks} sprints={sprints} gates={boardGates} initialClassification={boardClassification} select={setSelectedTask} setTasks={setTasks} setSprints={setSprints} setGates={setBoardGates} notify={notify} />}
          {view === 'gates' && <GatesPage tasks={tasks} gates={boardGates} doneDocuments={doneDocuments} />}
          {view === 'schedule' && <SchedulePage tasks={tasks} gates={boardGates} sprints={sprints} />}
          {view === 'risks' && <RisksPage />}
          {view === 'documents' && <DocumentsPage gates={boardGates} done={doneDocuments} setDone={setDoneDocuments} />}
          {view === 'hours' && <HoursPage actual={actualHours} setActual={setActualHours} />}
          {view === 'governance' && <GovernancePage />}
          {view === 'settings' && <SettingsPage preferences={preferences} updatePreferences={updatePreferences} />}
        </div>
      </main>
    </div>
    {selectedTask && <TaskDrawer task={selectedTask} gates={boardGates} sprints={sprints} close={closeSelectedTask} save={updateTask} />}
    {toast && <div className="toast"><Check size={18} /><span>{toast}</span></div>}
  </div>
}

import { useState } from 'react'
import TagSelector from './components/TagSelector.jsx'
import StudySession from './components/StudySession.jsx'

export default function App() {
  const [session, setSession] = useState(null) // null = tag page, array = study page

  return session
    ? <StudySession cards={session} onBack={() => setSession(null)} />
    : <TagSelector onStart={setSession} />
}

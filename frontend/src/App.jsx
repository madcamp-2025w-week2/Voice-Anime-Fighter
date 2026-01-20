import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TitleScreen from './screens/TitleScreen'
import LobbyScreen from './screens/LobbyScreen'
import CharacterSelectScreen from './screens/CharacterSelectScreen'
import MultiCharacterSelect from './screens/MultiCharacterSelect'
import BackgroundSelectScreen from './screens/BackgroundSelectScreen'
import MatchmakingScreen from './screens/MatchmakingScreen'
import BattleScreen from './screens/BattleScreen'
import ResultScreen from './screens/ResultScreen'
import ErrorModal from './components/ErrorModal'

import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen stars-bg">
        <Routes>
          <Route path="/" element={<TitleScreen />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/lobby" element={<LobbyScreen />} />
            <Route path="/select" element={<CharacterSelectScreen />} />
            <Route path="/multi-select" element={<MultiCharacterSelect />} />
            <Route path="/background-select" element={<BackgroundSelectScreen />} />
            <Route path="/matchmaking" element={<MatchmakingScreen />} />
            <Route path="/battle" element={<BattleScreen />} />
            <Route path="/result" element={<ResultScreen />} />
          </Route>
        </Routes>
        {/* Global Error Modal */}
        <ErrorModal />
      </div>
    </BrowserRouter>
  )
}

export default App


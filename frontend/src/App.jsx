import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TitleScreen from './screens/TitleScreen'
import LobbyScreen from './screens/LobbyScreen'
import CharacterSelectScreen from './screens/CharacterSelectScreen'
import MatchmakingScreen from './screens/MatchmakingScreen'
import BattleScreen from './screens/BattleScreen'
import ResultScreen from './screens/ResultScreen'
import SocialScreen from './screens/SocialScreen'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen stars-bg">
        <Routes>
          <Route path="/" element={<TitleScreen />} />
          <Route path="/lobby" element={<LobbyScreen />} />
          <Route path="/select" element={<CharacterSelectScreen />} />
          <Route path="/matchmaking" element={<MatchmakingScreen />} />
          <Route path="/battle" element={<BattleScreen />} />
          <Route path="/result" element={<ResultScreen />} />
          <Route path="/social" element={<SocialScreen />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App

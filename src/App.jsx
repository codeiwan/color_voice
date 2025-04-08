import Listening from './components/Listening'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/listen" element={<Listening />} />
        </Routes>
      </Router>
    </>
  )
}

export default App

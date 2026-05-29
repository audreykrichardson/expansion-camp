import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Signup from './pages/Signup.jsx'
import Login from './pages/Login.jsx'
import CampHome from './pages/CampHome.jsx'
import CampAdmin from './pages/CampAdmin.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      {/* The platform's own pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      {/* Each camp lives under its own slug, e.g. /roosevelt */}
      <Route path="/:campSlug" element={<CampHome />} />
      <Route path="/:campSlug/admin" element={<CampAdmin />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

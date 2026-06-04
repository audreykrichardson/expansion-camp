import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Signup from './pages/Signup.jsx'
import Login from './pages/Login.jsx'
import CampHome from './pages/CampHome.jsx'
import CampRegister from './pages/CampRegister.jsx'
import CampAdmin from './pages/CampAdmin.jsx'
import CampAdminCampers from './pages/CampAdminCampers.jsx'
import CampAdminSettings from './pages/CampAdminSettings.jsx'
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
      <Route path="/:campSlug/register" element={<CampRegister />} />
      <Route path="/:campSlug/admin" element={<CampAdmin />} />
      <Route path="/:campSlug/admin/campers" element={<CampAdminCampers />} />
      <Route path="/:campSlug/admin/settings" element={<CampAdminSettings />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

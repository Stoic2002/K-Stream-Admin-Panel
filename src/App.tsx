import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/Login';

import { Dashboard } from './pages/Dashboard';

// Placeholder Pages for now
import { DramaList } from './pages/dramas/DramaList';
import { DramaForm } from './pages/dramas/DramaForm';
import { EpisodeManage } from './pages/dramas/EpisodeManage';
import { Genres } from './pages/Genres';
import { Actors } from './pages/Actors';
import { Users } from './pages/Users';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dramas" element={<DramaList />} />
            <Route path="/dramas/new" element={<DramaForm />} />
            <Route path="/dramas/:id/edit" element={<DramaForm />} />
            <Route path="/dramas/:dramaId/episodes" element={<EpisodeManage />} />
            <Route path="/genres" element={<Genres />} />
            <Route path="/actors" element={<Actors />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

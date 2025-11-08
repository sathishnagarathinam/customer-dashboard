
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Traffic from './pages/Traffic';
import Reports from './pages/Reports';
import Upload from './pages/Upload';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/traffic" element={<Traffic />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

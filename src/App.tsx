import ExperimentApp from './ExperimentApp';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <div className="min-h-screen bg-brown-900 text-brown-100">
      <ExperimentApp />
      <ToastContainer position="top-center" autoClose={4000} hideProgressBar newestOnTop />
    </div>
  );
}

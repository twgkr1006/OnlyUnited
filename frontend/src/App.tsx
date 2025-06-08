import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import LoginSuccessPage from "./pages/LoginSuccessPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login-success" element={<LoginSuccessPage />} />
    </Routes>
  );
};

export default App;

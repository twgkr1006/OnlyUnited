import { Routes, Route } from "react-router-dom";
import axios from "axios";

// 배포 환경에서 VITE_API_URL을 Railway 백엔드 주소로 설정
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}
import Layout from "./components/Layout";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SquadPage from "./pages/SquadPage";
import StandingsPage from "./pages/StandingsPage";
import NewsPage from "./pages/NewsPage";
import MatchesPage from "./pages/MatchesPage";
import MatchDetailPage from "./pages/MatchDetailPage";
import PlayerDetailPage from "./pages/PlayerDetailPage";
import BoardPage from "./pages/BoardPage";
import PostDetailPage from "./pages/PostDetailPage";
import WritePostPage from "./pages/WritePostPage";
import PlayerComparePage from "./pages/PlayerComparePage";
import SeasonPage from "./pages/SeasonPage";
import TransferPage from "./pages/TransferPage";
import LegendsPage from "./pages/LegendsPage";

function App() {
  return (
    <Routes>
      {/* 레이아웃(헤더+네비+푸터) 공유 */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/squad" element={<SquadPage />} />
        <Route path="/squad/:id" element={<PlayerDetailPage />} />
        <Route path="/standings" element={<StandingsPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/matches/:id" element={<MatchDetailPage />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/board/write" element={<WritePostPage />} />
        <Route path="/board/:id" element={<PostDetailPage />} />
        <Route path="/compare" element={<PlayerComparePage />} />
        <Route path="/season" element={<SeasonPage />} />
        <Route path="/transfer" element={<TransferPage />} />
        <Route path="/legends" element={<LegendsPage />} />
      </Route>
      {/* 레이아웃 없는 페이지 */}
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

export default App;

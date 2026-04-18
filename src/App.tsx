import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { User, Notice, Info, Material, GalleryItem } from './types';
import { api } from './api';

// Pages Import
import Home from './pages/Home';
import Notices from './pages/NoticeList';
import NoticeDetail from './pages/NoticeDetail';
import NoticeForm from './pages/NoticeForm';
import InfoList from './pages/InfoList';
import InfoDetail from './pages/InfoDetail';
import InfoForm from './pages/InfoForm';
import GalleryList from './pages/GalleryList';
import GalleryForm from './pages/GalleryForm';
import MaterialList from './pages/MaterialList';
import MaterialForm from './pages/MaterialForm';
import MaterialDetail from './pages/MaterialDetail';
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import LoginForm from './pages/LoginForm';
import MemberForm from './pages/MemberForm';
import MyPage from './pages/MyPage';
import FindId from './pages/FindId';
import ResetPassword from './pages/ResetPassword';


// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [infos, setInfos] = useState<Info[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ★ [핵심 수정] 데이터 로드 로직 변경 (403 에러 방지)
  useEffect(() => {
    const initData = async () => {
      try {
        // 1. 유저 인증 확인
        const currentUser = await api.checkAuth();
        if (currentUser) setUser(currentUser);

        // 2. 공용 데이터 로드
        // api.getNotices()는 이제 PageResponse 객체({ content: [...], totalPages: ... })를 반환합니다.
        const [nData, i, g] = await Promise.all([
          api.getNotices(), // 파라미터 없이 호출하면 기본값(0페이지) 로드
          api.getInfos(),
          api.getGalleries(),
        ]);

        // ★★★ [여기 수정됨] nData에서 .content를 꺼내야 함! ★★★
        // nData가 없거나 content가 없으면 빈 배열 []
        setNotices(nData?.content || []);

        setInfos(i || []);
        setGalleries(g || []);

        // 3. 자료실(Materials)은 로그인한 경우에만
        if (currentUser) {
          const m = await api.getMaterials();
          setMaterials(m || []);
        } else {
          setMaterials([]);
        }

      } catch (err) {
        console.error("Failed to fetch initial data", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // 로그인 핸들러
  const handleLogin = (u: User) => setUser(u);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setMaterials([]); // 로그아웃 시 자료실 데이터 비우기
    alert("로그아웃 되었습니다.");
    window.location.href = '/';
  };

  const handleUpdateUser = (updatedUser: User) => setUser(updatedUser);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Connecting to SKAI...</p>
        </div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Router>
        <div className="flex flex-col min-h-screen font-sans bg-slate-50">
          <Navbar user={user} onLogout={handleLogout} />

          <main className="flex-grow container mx-auto px-6 py-12 max-w-7xl">
            <Routes>
              <Route path="/" element={<Home notices={notices} infos={infos} />} />

              {/* 공지사항 */}
              <Route path="/notice" element={<Notices user={user} />} />
              <Route path="/notice/:id" element={<NoticeDetail user={user} />} />
              <Route path="/notice/new" element={user ? <NoticeForm user={user} /> : <Navigate to="/login" />} />
              <Route path="/notice/edit/:id" element={user ? <NoticeForm user={user} /> : <Navigate to="/login" />} />

              {/* 정보 게시판 */}
              <Route path="/info" element={<InfoList infos={infos} user={user} setInfos={setInfos} />} />
              <Route path="/info/:id" element={<InfoDetail />} />
              <Route path="/info/new" element={user ? <InfoForm user={user} /> : <Navigate to="/login" />} />
              <Route path="/info/edit/:id" element={user ? <InfoForm user={user} /> : <Navigate to="/login" />} />

              {/* 갤러리 */}
              <Route path="/gallery" element={<GalleryList user={user} />} />
              <Route path="/gallery/new" element={<GalleryForm />} />
              <Route path="/gallery/edit/:id" element={<GalleryForm />} />

              {/* 학술자료실 */}
              <Route path="/material" element={<MaterialList />} />
              <Route path="/material/:id" element={<MaterialDetail />} />
              <Route path="/material/new" element={user ? <MaterialForm /> : <Navigate to="/login" />} />
              <Route path="/material/edit/:id" element={user ? <MaterialForm /> : <Navigate to="/login" />} />

              <Route path="/about" element={<About />} />

              {/* 로그인 & 회원가입 */}
              <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
              <Route path="/join" element={<MemberForm />} />
              <Route path="/mypage" element={user ? <MyPage user={user} onUpdateUser={handleUpdateUser} /> : <Navigate to="/login" />} />
              <Route path="/find-id" element={<FindId />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* 관리자 페이지 */}
              <Route
                path="/admin"
                element={
                  <AdminDashboard
                    user={user}
                    infos={infos}
                    setInfos={setInfos}
                  />
                }
              />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </HelmetProvider>
  );
};

export default App;
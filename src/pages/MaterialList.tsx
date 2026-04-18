import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api'; // 실제 환경에 맞게 주석 해제하여 사용하세요.

const ITEMS_PER_PAGE = 8; // 한 페이지에 보여줄 개수 (3열이므로 9개)

const MaterialList: React.FC = () => {
  const navigate = useNavigate();

  // 상태 관리
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);      // 데이터 로딩 중인지
  const [authLoading, setAuthLoading] = useState(true); // 로그인 체크 중인지
  const [user, setUser] = useState<any>(null);

  // 1. 필터 상태 관리
  const [filter, setFilter] = useState({
    school: 'All',
    major: 'All',
    category: 'All',
    languages: [] as string[],
    keyword: ''
  });

  // 2. 페이지네이션 상태 (더보기 대신 추가)
  const [currentPage, setCurrentPage] = useState(1);

  // 필터가 바뀔 때마다 무조건 1페이지로 돌아가도록 설정
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // 3. 권한 확인 및 초기 데이터 로드
  useEffect(() => {
    const init = async () => {
      setAuthLoading(true);
      const currentUser = await api.checkAuth();
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        setLoading(true);

        // 백엔드로 요청을 보낼 때 '기타'는 'All'로 변환해서 전체 데이터를 가져옵니다.
        const apiFilter = {
          ...filter,
          school: filter.school === '기타' ? 'All' : filter.school,
          major: filter.major === '기타' ? 'All' : filter.major,
        };

        const data = await api.getMaterials(apiFilter); // 변환된 필터로 백엔드 요청
        setResources(data);
        setLoading(false);
      }
    };
    init();
  }, [filter.school, filter.major, filter.category]);

  // 4. 프론트엔드 필터링 및 최신순 정렬
  const displayedResources = useMemo(() => {
    // 주요 학교 및 전공 배열 정의 (이 목록에 없는 것은 모두 '기타'로 취급)
    const mainSchools = ['히브리대', '텔아비브대', '테크니온', '바일란대'];
    const mainMajors = [
      '국제관계학', '정치학', '중동학', '히브리어',
      '성서학', '고고학', '경영학', '경제학'
    ];

    const filteredData = resources.filter(res => {
      // 1. 학교 필터링 로직
      let matchSchool = false;
      if (filter.school === 'All') {
        matchSchool = true;
      } else if (filter.school === '기타') {
        matchSchool = !mainSchools.includes(res.school);
      } else {
        matchSchool = res.school === filter.school;
      }

      // 2. 전공 필터링 로직 
      let matchMajor = false;
      if (filter.major === 'All') {
        matchMajor = true;
      } else if (filter.major === '기타') {
        matchMajor = !mainMajors.includes(res.major);
      } else {
        matchMajor = res.major === filter.major;
      }

      // 3. 나머지 조건 (카테고리, 언어, 검색어) 유지
      const matchCategory = filter.category === 'All' || res.category === filter.category;
      const matchLang = filter.languages.length === 0 || filter.languages.includes(res.language);

      const rawSearch = filter.keyword.toLowerCase().replace(/\s+/g, '');
      const matchSearch = !filter.keyword ||
        (res.title && res.title.toLowerCase().replace(/\s+/g, '').includes(rawSearch)) ||
        (res.subject && res.subject.toLowerCase().replace(/\s+/g, '').includes(rawSearch)) ||
        (res.major && res.major.toLowerCase().replace(/\s+/g, '').includes(rawSearch)) ||
        (res.professor && res.professor.toLowerCase().replace(/\s+/g, '').includes(rawSearch));

      return matchSchool && matchMajor && matchCategory && matchLang && matchSearch;
    });

    return filteredData.reverse();
  }, [resources, filter]);

  // ★ 페이지네이션 계산 로직
  const totalPages = Math.ceil(displayedResources.length / ITEMS_PER_PAGE);
  const visibleResources = displayedResources.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 페이지 네비게이션 범위 (현재 페이지 ±2)
  const pageRange = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    p => p >= currentPage - 2 && p <= currentPage + 2
  );

  const isStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';

  // 카테고리별 아이콘/색상 매핑 함수
  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'Note': return { color: 'bg-emerald-50 text-emerald-700' };
      case 'Summary': return { color: 'bg-amber-50 text-amber-700' };
      case 'Exam': return { color: 'bg-rose-50 text-rose-700' };
      case 'Material': return { color: 'bg-sky-50 text-sky-700' };
      default: return { color: 'bg-slate-50 text-slate-700' };
    }
  };

  const LoginRequiredView = () => (
    <div className="col-span-full py-24 bg-white border border-slate-100 rounded-[3rem] text-center shadow-lg flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-3xl text-indigo-600 shadow-inner">
        🔒
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-3">회원 전용 공간입니다</h3>
      <p className="text-slate-500 font-medium mb-10 leading-relaxed">
        학술 자료를 열람하려면 로그인이 필요합니다.
      </p>
      <div className="flex gap-4">
        <Link to="/login" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 hover:shadow-xl transition-all">
          로그인
        </Link>
        <Link to="/join" className="px-10 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">
          회원가입
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-16 max-w-7xl mx-auto px-4 py-8">
      {/* 헤더 섹션 */}
      <header className="bg-indigo-950 text-white p-12 md:p-20 rounded-[3rem] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-24 opacity-10 pointer-events-none">
          <svg className="w-80 h-80 fill-current" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45L20.14 19H3.86L12 5.45z" /></svg>
        </div>

        <div className="relative z-10 max-w-3xl">
          <span className="inline-block px-4 py-1.5 bg-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-md mb-8 shadow-lg shadow-indigo-900/50">
            Academic Archives
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            학술 자료실
          </h1>
          <p className="text-indigo-200 text-base md:text-lg font-medium leading-relaxed mb-10">
            과목·언어·출처가 명확하게 구분된 신뢰도 높은 학술 자료실입니다.<br className="hidden md:block" />
            자료는 구글 드라이브에 안전하게 보관되며, 학생회 승인 후 공개됩니다.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href={user ? "https://docs.google.com/forms/d/e/1FAIpQLSc5rLgeg9jQynL26w7sgjKwhAT35zL8V4x_V-RHhNtYF7eu8w/viewform?usp=dialog" : "/login"}
              target={user ? "_blank" : "_self"}
              rel="noreferrer"
              className="px-8 py-4 bg-white text-indigo-950 rounded-2xl font-black text-sm hover:bg-white/95 hover:shadow-2xl transition-all flex items-center gap-3 shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              자료 제보
            </a>
            {isStaff && (
              <Link to="/material/new"
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-900/30 transition-all flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                자료 등록
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 pt-8">
        {/* 사이드바 필터 섹션 */}
        <aside className="lg:col-span-1">
          <div className={`bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10 sticky top-24 transition-all duration-300 ${!user && !authLoading ? 'opacity-40 pointer-events-none filter grayscale' : ''}`}>
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">University</h3>
              <select className="w-full p-4 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-inner cursor-pointer" value={filter.school} onChange={(e) => setFilter({ ...filter, school: e.target.value })}>
                {['All', '히브리대', '텔아비브대', '테크니온', '바일란대', '기타'].map(opt => (
                  <option key={opt} value={opt}>{opt === 'All' ? '전체 학교' : opt}</option>
                ))}
              </select>
            </section>
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">Major</h3>
              <select className="w-full p-4 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-inner cursor-pointer" value={filter.major} onChange={(e) => setFilter({ ...filter, major: e.target.value })}>
                {['All', '국제관계학', '정치학', '중동학', '히브리어', '성서학', '고고학', '경영학', '경제학', '기타'].map(opt => (
                  <option key={opt} value={opt}>{opt === 'All' ? '전체 전공' : opt}</option>
                ))}
              </select>
            </section>
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">Category</h3>
              <select className="w-full p-4 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-inner cursor-pointer" value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
                <option value="All">전체 유형</option>
                <option value="Note">필기 노트</option>
                <option value="Summary">요약본 (סיכום)</option>
                <option value="Exam">기출문제</option>
                <option value="Material">수업 자료</option>
                <option value="Etc">기타</option>
              </select>
            </section>
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">Language</h3>
              <div className="space-y-4">
                {['한국어', '히브리어', '영어'].map(lang => (
                  <label key={lang} className="flex items-center gap-4 text-sm font-bold text-slate-600 cursor-pointer group">
                    <input type="checkbox" checked={filter.languages.includes(lang)} onChange={() => setFilter(prev => ({ ...prev, languages: prev.languages.includes(lang) ? prev.languages.filter(l => l !== lang) : [...prev.languages, lang] }))} className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500" />
                    <span className="group-hover:text-indigo-600 transition-colors">{lang}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>
        </aside>

        {/* 메인 콘텐츠 구역 */}
        <div className="lg:col-span-3 space-y-10">
          {/* 검색바 */}
          <div className={`relative group ${!user && !authLoading ? 'opacity-40 pointer-events-none' : ''}`}>
            <input type="text" placeholder="제목, 과목명, 교수명으로 검색하세요..." className="w-full p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-base pl-16 transition-all" value={filter.keyword} onChange={(e) => setFilter({ ...filter, keyword: e.target.value })} />
            <svg className="w-6 h-6 absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>

          {authLoading ? (
            <div className="py-32 text-center">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">인증 정보 확인 중...</p>
            </div>
          ) : !user ? (
            <LoginRequiredView />
          ) : loading ? (
            <div className="py-32 text-center">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">자료를 불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                {visibleResources.map(res => {
                  const categoryMeta = getCategoryMeta(res.category);
                  return (
                    <Link key={res.id} to={`/material/${res.id}`}
                      className="bg-white border border-transparent px-9 py-7 rounded-[2rem] shadow-sm hover:border-indigo-400 transition-all duration-300 group flex flex-col h-full active:scale-[0.98]">
                      <div className="flex justify-between items-center mb-5">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${categoryMeta.color}`}>
                          <span className="text-[10px] font-black uppercase tracking-widest">{res.category}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-md">{res.school}</span>
                      </div>

                      <h3 className="text-xl font-black text-slate-800 mb-2.5 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2">
                        {res.title}
                      </h3>

                      <p className="text-xs font-semibold text-indigo-900/80 mb-4">{res.major}</p>

                      <div className="flex flex-wrap gap-1.5 mb-6">
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded">{res.subject}</span>
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded">{res.professor || '교수 미정'}</span>
                      </div>

                      <div className="mt-auto flex justify-between items-center pt-5 border-t border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-inner">
                            {res.writer?.charAt(0) || '익'}
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">{res.writer || '익명'}</span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-300">{res.language}</span>
                      </div>
                    </Link>
                  );
                })}

                {displayedResources.length === 0 && (
                  <div className="col-span-full py-24 text-center bg-white border border-dashed border-slate-200 rounded-[3rem]">
                    <p className="text-slate-400 font-bold text-sm">해당 조건의 자료가 없습니다.</p>
                  </div>
                )}
              </div>

              {/* ★ 새롭게 적용된 페이지네이션 영역 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-8">
                  <button
                    onClick={() => {
                      setCurrentPage(p => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' }); // 페이지 이동 시 위로 스크롤
                    }}
                    disabled={currentPage === 1}
                    className="w-10 h-10 rounded-xl font-bold text-xs transition-all bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border border-transparent shadow-sm"
                  >
                    &lt;
                  </button>

                  {pageRange.map(page => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' }); // 페이지 이동 시 위로 스크롤
                      }}
                      className={`w-10 h-10 rounded-xl font-bold text-xs transition-all shadow-sm
                        ${currentPage === page
                          ? 'bg-slate-900 text-white shadow-lg'
                          : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setCurrentPage(p => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' }); // 페이지 이동 시 위로 스크롤
                    }}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 rounded-xl font-bold text-xs transition-all bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border border-transparent shadow-sm"
                  >
                    &gt;
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialList;
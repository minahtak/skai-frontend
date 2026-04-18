import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Notice, Info } from '../types';

interface HomeProps {
  notices: Notice[];
  infos: Info[];
}

const Home: React.FC<HomeProps> = ({ notices, infos }) => {
  // 1. 공지사항 최신순 4개 자르기 (고정 여부 무시하고 regDate 기준 최신순 정렬)
  const recentNotices = [...notices] // 원본 배열 보호를 위해 복사본 생성
    .sort((a, b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime()) // ★ 날짜 기준 내림차순 정렬
    .slice(0, 4);

  // 2. 생활가이드(Info) 조회수(viewCount)순 3개 필터링 및 정렬
  const popularInfos = [...infos] // ★ 원본 배열 보호를 위해 복사본 생성
    .filter(p => {
      // status가 없으면(null/undefined) 일단 보여주거나,
      if (!p.status) return true;
      // 백엔드(APPROVED)와 프론트(approved) 대소문자 차이로 인한 에러 방지
      return p.status === 'APPROVED';
    })
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)) // ★ 조회수 내림차순 정렬 추가
    .slice(0, 3);

  return (
    <div className="space-y-16 pb-12">
      {/* ★ 2. Helmet 컴포넌트를 이용해 이 페이지의 SEO 정보 입력 */}
      <Helmet>
        <title>SKAI | 이스라엘 한인 학생회</title>
        <meta name="description" content="이스라엘 유학의 모든 것. 한인 학생회 공지, 학술 자료, 이스라엘 맛집 및 생활 가이드를 제공합니다." />
        <meta property="og:title" content="SKAI | 이스라엘 한인 학생회" />
        <meta property="og:description" content="이스라엘 유학생을 위한 학술 아카이브와 정착 가이드!" />
        <meta property="og:url" content="https://skaisrael.com" />
      </Helmet>
      {/* Hero Section */}
      <section className="relative rounded-[3rem] overflow-hidden bg-slate-900 text-white min-h-[460px] flex items-center shadow-2xl">
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1544971587-b842c27f8e14?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent"></div>
        <div className="relative z-10 px-8 md:px-16 w-full">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 bg-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mt-4 mb-4">
              Student Korean Association in Israel
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
              Connecting Scholars,<br />
              <span className="text-indigo-400">Empowering</span> Your Journey.
            </h1>
            <p className="text-sm md:text-lg text-slate-300 mb-8 leading-relaxed font-medium">
              이스라엘 전역의 한국인 학생들을 위한 학술 아카이브와<br className="hidden md:block" />
              정착 가이드를 제공합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/about" className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-center text-sm hover:bg-white/95 hover:shadow-xl transition-all">학생회 소개</Link>
              <Link to="/material" className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-center text-sm hover:bg-white/20 transition-all">학술 자료실</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Card Action Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Notice Link */}
        <Link to="/notice" className="group p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-indigo-500 hover:shadow-2xl transition-all relative overflow-hidden">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-600 group-hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">공지/모임안내</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">모임 알림부터 학생회 공식 소식까지 모두 여기에!</p>
          <div className="absolute top-4 right-6 text-slate-50 font-black text-3xl opacity-30 group-hover:opacity-100 transition-opacity">NEWS</div>
        </Link>

        {/* Material Link */}
        <Link to="/material" className="group p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-indigo-500 hover:shadow-2xl transition-all relative overflow-hidden">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">학술 자료실(족보)</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">요약 노트와 기출문제 자료 아카이브</p>
          <div className="absolute top-4 right-6 text-slate-50 font-black text-3xl opacity-30 group-hover:opacity-100 transition-opacity">STUDY</div>
        </Link>

        {/* Info Link */}
        <Link to="/info" className="group p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-emerald-500 hover:shadow-2xl transition-all relative overflow-hidden">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">생활 가이드</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">비자 신청부터 맛집, 현지 취업 꿀팁까지</p>
          <div className="absolute top-4 right-6 text-slate-50 font-black text-3xl opacity-30 group-hover:opacity-100 transition-opacity">GUIDE</div>
        </Link>
      </section>

      {/* Recent Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8">
        {/* 왼쪽: 최근 공지사항 */}
        <div className="lg:col-span-8 space-y-10">
          <div className="flex justify-between items-center px-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">최근 공지사항</h2>
            <Link to="/notice" className="text-xs font-bold text-indigo-600 hover:underline">View All →</Link>
          </div>
          <div className="space-y-4">
            {recentNotices.map(notice => (
              <Link key={notice.id} to={`/notice/${notice.id}`} className="block p-7 bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl transition-all group">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${notice.category === 'OFFICIAL' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {notice.category}
                    </span>
                    <h4 className="text-base font-bold text-slate-800 group-hover:text-indigo-600">{notice.title}</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2.5" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2.5" /></svg>
                      {notice.viewCount}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {notice.regDate ? notice.regDate.substring(0, 10) : ''}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 오른쪽: 인기 가이드 */}
        <div className="lg:col-span-4 space-y-10">
          <h3 className="text-2xl font-black text-slate-900 px-4 tracking-tight">인기 가이드</h3>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="space-y-8">
              {popularInfos.map(post => (
                <Link key={post.id} to={`/info/${post.id}`} className="block group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{post.category}</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2.5" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2.5" /></svg>
                      {post.viewCount}
                    </span>
                  </div>
                  <h5 className="font-bold text-base text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{post.title}</h5>
                </Link>
              ))}
            </div>
            <Link to="/info" className="mt-10 block w-full py-4 bg-slate-900 text-white text-center rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg">
              View More Guides
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
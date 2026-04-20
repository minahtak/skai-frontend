import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Notice, Info } from '../types';

interface HomeProps {
  notices: Notice[];
  infos: Info[];
}

const Home: React.FC<HomeProps> = ({ notices, infos }) => {
  // 1. 공지사항 최신순 4개 자르기
  const recentNotices = [...notices]
    .sort((a, b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime())
    .slice(0, 4);

  // 2. 생활가이드(Info) 조회수(viewCount)순 3개 필터링 및 정렬
  const popularInfos = [...infos]
    .filter(p => {
      if (!p.status) return true;
      return p.status === 'APPROVED';
    })
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 3);

  return (
    <div className="space-y-12 md:space-y-16 pb-12">
      <Helmet>
        <title>SKAI | 이스라엘 한인 학생회</title>
        <meta name="description" content="이스라엘 유학의 모든 것. 한인 학생회 공지, 학술 자료, 이스라엘 맛집 및 생활 가이드를 제공합니다." />
        <meta property="og:title" content="SKAI | 이스라엘 한인 학생회" />
        <meta property="og:description" content="이스라엘 유학생을 위한 학술 아카이브와 정착 가이드" />
        <meta property="og:url" content="https://skaisrael.com" />
      </Helmet>

      {/* Hero Section (모바일 높이 및 곡률 축소) */}
      <section className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-slate-900 text-white min-h-[340px] sm:min-h-[400px] md:min-h-[460px] flex items-center shadow-2xl mx-4 sm:mx-0">
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1544971587-b842c27f8e14?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-slate-950/90 md:from-slate-950 md:via-slate-950/70 to-transparent"></div>
        <div className="relative z-10 px-6 sm:px-8 md:px-16 w-full py-12 md:py-0">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1.5 md:px-4 bg-indigo-600 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-3 md:mb-4">
              Student Korean Association in Israel
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-6 md:mb-9 leading-tight tracking-tight">
              Connecting Scholars,<br />
              <span className="text-indigo-400">Empowering</span> Your Journey.
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link to="/about" className="px-6 md:px-8 py-3.5 md:py-4 bg-white text-slate-950 rounded-2xl font-black text-center text-sm hover:bg-white/95 hover:shadow-xl transition-all">학생회 소개</Link>
              <Link to="/material" className="px-6 md:px-8 py-3.5 md:py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-center text-sm hover:bg-white/20 transition-all">학술 자료실</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Card Action Row (패딩 및 곡률 반응형) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4 sm:px-0">
        <Link to="/notice" className="group p-6 md:p-8 bg-white border border-slate-100 rounded-3xl md:rounded-[2.5rem] hover:border-indigo-500 hover:shadow-2xl transition-all relative overflow-hidden">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 text-red-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-red-600 group-hover:text-white transition-all">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2">공지/모임안내</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">모임 알림부터 학생회 공식 소식까지 모두 여기에!</p>
          <div className="absolute top-4 right-6 text-slate-50 font-black text-3xl opacity-30 group-hover:opacity-100 transition-opacity">NEWS</div>
        </Link>

        <Link to="/material" className="group p-6 md:p-8 bg-white border border-slate-100 rounded-3xl md:rounded-[2.5rem] hover:border-indigo-500 hover:shadow-2xl transition-all relative overflow-hidden">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2">학술 자료실(족보)</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">요약 노트와 기출문제 자료 아카이브</p>
          <div className="absolute top-4 right-6 text-slate-50 font-black text-3xl opacity-30 group-hover:opacity-100 transition-opacity">STUDY</div>
        </Link>

        <Link to="/info" className="group p-6 md:p-8 bg-white border border-slate-100 rounded-3xl md:rounded-[2.5rem] hover:border-emerald-500 hover:shadow-2xl transition-all relative overflow-hidden">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2">생활 가이드</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">비자 신청부터 맛집, 현지 취업 꿀팁까지</p>
          <div className="absolute top-4 right-6 text-slate-50 font-black text-3xl opacity-30 group-hover:opacity-100 transition-opacity">GUIDE</div>
        </Link>
      </section>

      {/* Recent Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 pt-4 md:pt-8 px-4 sm:px-0">
        {/* 왼쪽: 최근 공지사항 */}
        <div className="lg:col-span-8 space-y-6 md:space-y-10">
          <div className="flex justify-between items-end md:items-center px-2 md:px-4">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">최근 공지사항</h2>
            <Link to="/notice" className="text-xs font-bold text-indigo-600 hover:underline">View All →</Link>
          </div>
          <div className="space-y-3 md:space-y-4">
            {recentNotices.map(notice => (
              <Link key={notice.id} to={`/notice/${notice.id}`} className="block p-5 md:p-7 bg-white border border-slate-100 rounded-2xl md:rounded-[2rem] hover:shadow-xl transition-all group">
                {/* 모바일에서는 세로 배치, 태블릿(sm) 이상부터 가로 배치 */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                  <div className="flex items-center gap-3 md:gap-4 flex-1 pr-4">
                    <span className={`shrink-0 px-2.5 py-1 md:px-3 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest ${notice.category === 'OFFICIAL' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {notice.category}
                    </span>
                    <h4 className="text-sm md:text-base font-bold text-slate-800 group-hover:text-indigo-600 truncate">{notice.title}</h4>
                  </div>
                  <div className="flex items-center gap-4 pl-10 sm:pl-0">
                    <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-slate-400 md:text-slate-300">
                      <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2.5" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2.5" /></svg>
                      {notice.viewCount}
                    </span>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 md:text-slate-300">
                      {notice.regDate ? notice.regDate.substring(0, 10) : ''}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 오른쪽: 인기 가이드 */}
        <div className="lg:col-span-4 space-y-6 md:space-y-10">
          <h3 className="text-xl md:text-2xl font-black text-slate-900 px-2 md:px-4 tracking-tight">인기 가이드</h3>
          <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="space-y-6 md:space-y-8">
              {popularInfos.map(post => (
                <Link key={post.id} to={`/info/${post.id}`} className="block group">
                  <div className="flex justify-between items-start mb-1.5 md:mb-2">
                    <span className="text-[9px] md:text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{post.category}</span>
                    <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-slate-300">
                      <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2.5" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2.5" /></svg>
                      {post.viewCount}
                    </span>
                  </div>
                  <h5 className="font-bold text-sm md:text-base text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 md:line-clamp-1">{post.title}</h5>
                </Link>
              ))}
            </div>
            <Link to="/info" className="mt-8 md:mt-10 block w-full py-3.5 md:py-4 bg-slate-900 text-white text-center rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg">
              View More Guides
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Executive } from '../types';
import { api } from '../api';

const About: React.FC = () => {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getExecutives();
        setExecutives(data);
      } catch (error) {
        console.error("임원진 데이터 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const leaders = executives.filter(e =>
    e.role.includes('회장') || e.role.toLowerCase().includes('chairman') || e.role.toLowerCase().includes('president')
  );
  const staff = executives.filter(e => !leaders.find(l => l.id === e.id));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-zinc-400 font-medium tracking-widest text-sm uppercase animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>About Us | SKAI 이스라엘 한인 학생회</title>
        <meta name="description" content="SKAI(이스라엘 한인 학생회)의 미션과 비전, 그리고 학생회를 이끌어가는 임원진 및 설립 멤버를 소개합니다." />
        <meta name="keywords" content="이스라엘 한인 학생회 소개, SKAI 임원진, 이스라엘 유학생 모임" />
        <meta property="og:title" content="SKAI 소개 | 이스라엘 한인 학생회" />
        <meta property="og:description" content="Connecting Scholars, Empowering Journeys. SKAI를 소개합니다." />
        <meta property="og:image"
          content="https://images.unsplash.com/photo-1544971587-b842c27f8e14?auto=format&fit=crop&q=80&w=1200" />

      </Helmet>

      <div className="min-h-screen text-zinc-900 font-sans selection:bg-blue-900 selection:text-white pb-24">

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-3">
            <div className="h-px w-8 bg-blue-600"></div>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-[0.2em]">
              About SKAI
            </span>
            <div className="h-px w-8 bg-blue-600"></div>
          </div>

          <h1 className="text-5xl md:text-7xl tracking-tight text-zinc-900 leading-[1.1]">
            Connecting Scholars,<br />
            <span className="font-semibold text-indigo-700">Empowering Journeys.</span>
          </h1>

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-[0.2em]">
            Student Korean Association in Israel
          </p>

          <div className="w-8 h-px bg-zinc-200 mx-auto" />

          <div className="max-w-5xl mx-auto text-left space-y-5">
            <p className="text-zinc-500 text-base leading-relaxed">
              SKAI는 이스라엘 내 한인 유학생들의 화합과 성장, 그리고 더 나은 미래를 위해 만들어진 학생회 플랫폼입니다.
            </p>
            <p className="text-zinc-500 text-base leading-relaxed">
              이름은 히브리어 표현 "סטודנט קוריאני"(Korean Student)의 어순에서 착안한{' '}
              <span className="font-semibold text-zinc-800">Student Korean Association in Israel</span>의 앞글자를 담아 탄생했습니다.
              동시에 하늘처럼 넓고 높은 학생들의 꿈이 이스라엘에서 더욱 크게 펼쳐지기를 바라는 의미를 함께 담고 있습니다.
            </p>
            <p className="text-zinc-500 text-base leading-relaxed">
              학업 정보, 생활 지원, 네트워킹, 그리고 서로를 연결하는 커뮤니티를 통해 낯선 타지에서도 함께 성장할 수 있는 환경을 만들어갑니다.
            </p>
          </div>
        </section>

        {/* Executives Section */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200 pb-6 mb-12">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-[0.2em] mb-3">
                2025 — 2026
              </p>
              <h2 className="text-3xl md:text-4xl tracking-tight text-zinc-900">
                임원진 소개
              </h2>
            </div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest mt-4 md:mt-0">
              Student Korean Association in Israel
            </span>
          </div>

          {/* Leaders (회장, 부회장) */}
          {leaders.length > 0 && (
            <div className="flex justify-center gap-x-12 md:gap-x-24 gap-y-12 mb-16 flex-wrap">
              {leaders.map((person) => (
                <div
                  key={person.id}
                  className="group flex flex-col items-center text-center w-40 md:w-48 scale-[0.8]"
                >
                  {/* Photo (갤러리 방식 + 이니셜 Fallback 적용) */}
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-6 transition-transform duration-500 group-hover:scale-105 bg-zinc-100 shadow-sm border border-zinc-200">
                    <img
                      src={person.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random`}
                      alt={person.name}
                      className="w-full h-full object-cover transition-all duration-500"
                      onError={(e) => (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random&color=fff`}
                    />
                  </div>

                  {/* Role */}
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2 text-indigo-600">
                    {person.role}
                  </span>

                  {/* Name */}
                  <h5 className="text-lg font-medium text-zinc-900 mb-1.5">
                    {person.name}
                  </h5>

                  {/* School */}
                  {person.school && (
                    <p className="text-sm text-zinc-500 line-clamp-2 px-2">
                      {person.school}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Staff (운영진) */}
          {staff.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-x-6 gap-y-12 max-w-4xl mx-auto justify-items-center">
              {staff.map((person) => (
                <div
                  key={person.id}
                  className="group flex flex-col items-center text-center"
                >
                  {/* Photo (갤러리 방식 + 이니셜 Fallback 적용) */}
                  <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-5 transition-transform duration-500 group-hover:scale-105 bg-zinc-100 shadow-sm border border-zinc-200">
                    <img
                      src={person.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random`}
                      alt={person.name}
                      className="w-full h-full object-cover transition-all duration-500"
                      onError={(e) => (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random&color=fff`}
                    />
                  </div>

                  {/* Role */}
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2 text-zinc-500">
                    {person.role}
                  </span>

                  {/* Name */}
                  <h5 className="text-base font-medium text-zinc-900 mb-1">
                    {person.name}
                  </h5>

                  {/* School */}
                  {person.school && (
                    <p className="text-xs text-zinc-500 line-clamp-2 px-2">
                      {person.school}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Philosophy */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-12 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-indigo-600 mb-8">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-zinc-900 mb-4">Transparency</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                SKAI는 모든 활동 내역과 예산 집행을 분기별로 투명하게 공개합니다. 모든 회원의 소중한 회비는 오로지 유학생 복지만을 위해 사용됩니다.
              </p>
            </div>
            <div className="bg-white p-12 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-indigo-600 mb-8">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-zinc-900 mb-4">Unity</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                학교와 전공을 불문하고 이스라엘 내 모든 한국인 유학생들을 하나의 네트워크로 묶어 서로가 서로의 든든한 조력자가 되는 공동체를 지향합니다.
              </p>
            </div>
          </div>
        </section>

        {/* Founding Members */}
        <section className="max-w-5xl mx-auto px-6 pt-20 border-t border-zinc-200">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-[0.2em] block mb-3">Origin</span>
            <h2 className="text-3xl text-zinc-900 mb-4">Founding Members</h2>
            <p className="text-zinc-500 text-sm">본 웹사이트의 기획 및 개발을 총괄한 사람들</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12 max-w-3xl mx-auto">
            {[
              { role: 'Developer & UX', name: '탁민아' },
              { role: 'Content Strategy', name: '이헌재' },
              { role: 'Manager', name: '하세윤' },
              { role: 'Marketing', name: '왕성한' },
              { role: 'Quality Assurance', name: '김예인' },
              { role: 'Operations', name: '이유정' },
            ].map((m) => (
              <div key={m.name} className="text-center group">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.15em] mb-2 transition-colors group-hover:text-indigo-600">{m.role}</p>
                <h5 className="text-sm font-medium text-zinc-900">{m.name}</h5>
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  );
};

export default About;
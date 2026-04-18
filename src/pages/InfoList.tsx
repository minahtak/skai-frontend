import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Info, User } from '../types';
import { api } from '../api';

interface InfoListProps {
  infos: Info[];
  user: User | null;
  setInfos: React.Dispatch<React.SetStateAction<Info[]>>;
}

const CATEGORIES = ['LIFE', 'FOOD', 'TRAVEL', 'JOB', 'SCHOOL', 'FAQ'];
const ITEMS_PER_PAGE = 9;

const InfoList: React.FC<InfoListProps> = ({ infos, user, setInfos }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // 정렬 상태 (기본값: 최신순)
  const [sortBy, setSortBy] = useState<string>('regDate,desc');

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');

  // 데이터 호출 로직 (카테고리, 정렬, 페이지 감지)
  useEffect(() => {
    const fetchData = async () => {
      if (page === 0) setIsLoading(true);
      else setIsLoadingMore(true);

      const data = await api.getInfos({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        page: page,
        size: ITEMS_PER_PAGE,
        sort: sortBy // API에 정렬 파라미터 전달
      });

      if (page === 0) {
        setInfos(data);
      } else {
        setInfos(prev => [...prev, ...data]);
      }

      setHasMore(data.length === ITEMS_PER_PAGE);

      setIsLoading(false);
      setIsLoadingMore(false);
    };

    fetchData();
  }, [selectedCategory, page, sortBy, setInfos]); // ★ sortBy 의존성 추가

  // 카테고리 변경
  const handleCategoryClick = (cat: string) => {
    if (selectedCategory !== cat) {
      setSelectedCategory(cat);
      setPage(0);
      setHasMore(true);
    }
  };

  // ★ 정렬 변경
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    setPage(0);
    setHasMore(true);
  };

  const handleShowRejection = (e: React.MouseEvent, reason?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedReason(reason || '작성된 사유가 없습니다.');
    setRejectionModalOpen(true);
  };

  return (
    <>

      <Helmet>
        <title>Life Guide (생활/맛집) | SKAI 이스라엘 한인 학생회</title>
        <meta name="description" content="이스라엘 유학 생활의 필수 정보! 현지 맛집, 주거, 취업, 비자 등 유학생들이 직접 작성한 생생한 가이드를 확인하세요." />
        <meta name="keywords" content="이스라엘 맛집, 이스라엘 취업, 이스라엘 비자, 이스라엘 생활, 한인 학생회" />
        <meta property="og:title" content="이스라엘 생활 가이드 | SKAI" />
        <meta property="og:description" content="이스라엘 맛집부터 현지 꿀팁까지, 유학생을 위한 모든 정보" />
        <meta property="og:image" content="https://구매할도매인.com/logo3.png" />
      </Helmet>

      <div className="space-y-12 max-w-7xl mx-auto relative">
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Life Guide</h1>
            <p className="text-slate-500 font-medium">이스라엘 생활을 위한 정보 모음입니다.</p>
          </div>
          <button
            onClick={() => user ? navigate('/info/new') : alert('로그인이 필요합니다.')}
            className="px-6 py-3 bg-slate-950 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2"
          >
            정보 공유
          </button>
        </header>

        {/* ★ 카테고리 탭 & 정렬 옵션 컨테이너 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4">

          {/* 좌측: 카테고리 탭 */}
          <div className="flex overflow-x-auto gap-3 scrollbar-hide w-full md:w-auto pb-2 md:pb-0">
            <button
              onClick={() => handleCategoryClick('All')}
              className={`px-6 py-3 rounded-2xl whitespace-nowrap text-xs font-black transition-all ${selectedCategory === 'All' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-6 py-3 rounded-2xl whitespace-nowrap text-xs font-black transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 우측: 정렬 셀렉트 박스 */}
          <div className="flex-shrink-0 w-full md:w-auto text-right">
            <select
              className="w-full md:w-auto px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer transition-colors hover:bg-slate-50"
              value={sortBy}
              onChange={handleSortChange}
            >
              {/* 백엔드 Pageable이 바로 알아들을 수 있도록 변경 */}
              <option value="regDate,desc">최신순</option>
              <option value="viewCount,desc">조회순</option>
            </select>
          </div>

        </div>

        {isLoading ? (
          <div className="py-40 text-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">정보를 불러오는 중...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {infos.length > 0 ? infos.map(info => (
                <Link key={info.id} to={`/info/${info.id}`} className="group bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:border-indigo-200 ">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-2">
                      <span className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wide group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        {info.category}
                      </span>

                      {info.status === 'PENDING' && (
                        <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-xl text-[10px] font-black uppercase tracking-wide">
                          승인 대기
                        </span>
                      )}
                      {info.status === 'REJECTED' && (
                        <button
                          onClick={(e) => handleShowRejection(e, info.rejectionReason)}
                          className="px-3 py-1.5 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wide hover:bg-red-200 transition-colors z-20 relative"
                        >
                          반려됨
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] font-bold text-slate-300">
                      {info.regDate ? new Date(info.regDate).toLocaleDateString() : ''}
                    </span>
                  </div>

                  <div className={info.status === 'REJECTED' ? 'opacity-50' : ''}>
                    <h3 className="text-xl font-black text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2">
                      {info.title}
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed font-medium line-clamp-3 mb-8">
                      {info.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')}
                    </p>
                  </div>

                  <div className="mt-auto flex justify-between items-center pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                        {info.writer?.charAt(0)}
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">{info.writer}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                      {info.comments ? info.comments.length : 0}
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="col-span-full py-24 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold text-sm">아직 등록된 정보가 없습니다.</p>
                </div>
              )}
            </div>

            {hasMore && infos.length > 0 && (
              <div className="flex justify-center pt-10">
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={isLoadingMore}
                  className="w-full md:w-auto min-w-[200px] px-10 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm shadow-sm hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      불러오는 중...
                    </>
                  ) : (
                    '더보기'
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* 반려 사유 모달 */}
        {rejectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setRejectionModalOpen(false)}
            ></div>
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md relative z-10 shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-black text-slate-900 mb-2 mt-2">반려 사유 안내</h3>
              <p className="text-slate-500 text-sm font-medium mb-6">
                관리자에 의해 게시글이 반려되었습니다.<br />
                아래 내용을 확인 후 수정해 주세요.
              </p>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                <p className="text-slate-700 font-bold text-sm leading-relaxed">
                  "{selectedReason}"
                </p>
              </div>

              <button
                onClick={() => setRejectionModalOpen(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-colors"
              >
                확인했습니다
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InfoList;
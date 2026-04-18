import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Notice, User, UserRole } from '../types';
import { api } from '../api'; // ★ API 임포트 추가

interface NoticesProps {
  user: User | null;
  notices?: Notice[]; // App.tsx에서 props를 안 지워도 에러 안 나게 처리
}

const ITEMS_PER_PAGE = 10;

const Notices: React.FC<NoticesProps> = ({ user }) => {
  const navigate = useNavigate();

  // ★ 백엔드 연동을 위한 상태 관리
  const [boardData, setBoardData] = useState<Notice[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // 검색 버튼/엔터용
  const [filterSchool, setFilterSchool] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<'LATEST' | 'VIEWS'>('LATEST');
  const [currentPage, setCurrentPage] = useState(1);

  // ★ 페이지, 필터, 검색어가 바뀔 때마다 백엔드에 새로 요청 (핵심!)
  useEffect(() => {
    const fetchNotices = async () => {
      const response = await api.getNotices({
        page: currentPage - 1, // 백엔드 Pageable은 0부터 시작
        school: filterSchool,
        category: filterCategory,
        keyword: searchTerm,
        sort: sortBy
      });

      if (response) {
        setBoardData(response.content || []);
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || 0);
      }
    };

    fetchNotices();
  }, [currentPage, filterSchool, filterCategory, sortBy, searchTerm]);

  // 필터 변경 시 무조건 1페이지로 초기화
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  // 엔터키 검색 처리
  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return dateString.substring(0, 10);
  };

  const isNew = (dateString?: string) => {
    if (!dateString) return false;
    return dateString.substring(0, 10) === new Date().toISOString().substring(0, 10);
  };

  // 전체 게시글 기준 고유 번호 계산
  const getRowNumber = (notice: Notice, index: number) => {
    if (notice.pinned) return '📌';
    return totalElements - ((currentPage - 1) * ITEMS_PER_PAGE) - index;
  };

  const canWrite =
    user?.role === UserRole.ADMIN ||
    user?.role === UserRole.STAFF ||
    user?.role === UserRole.WRITER;

  // 카테고리별 라벨 색상 매핑 함수
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Official': return 'bg-red-50 text-red-600';
      case 'Event': return 'bg-emerald-50 text-emerald-600';
      case 'Visa': return 'bg-sky-50 text-sky-600';
      case 'Etc': return 'bg-slate-100 text-slate-600';
      default: return 'bg-indigo-50 text-indigo-600';
    }
  };

  // 페이지 네비게이션 범위 (현재 페이지 ±2)
  const pageRange = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    p => p >= currentPage - 2 && p <= currentPage + 2
  );

  const TableHeader = () => (
    <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
      <div className="col-span-1 text-center">No</div>
      <div className="col-span-2 text-center">Category</div>
      <div className="col-span-6">Title</div>
      <div className="col-span-1 text-center">Writer</div>
      <div className="col-span-1 text-center">Views</div>
      <div className="col-span-1 text-right">Date</div>
    </div>
  );

  const NoticeRow = ({ notice, index }: { notice: Notice; index: number }) => (
    <Link
      to={`/notice/${notice.id}`}
      className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-8 py-5 hover:bg-indigo-50/30 transition-colors items-center group relative
        ${notice.pinned ? 'bg-amber-50/60' : ''}`}
    >
      {/* 번호 */}
      <div className="hidden md:block col-span-1 text-center text-slate-400 font-bold text-xs">
        {getRowNumber(notice, index)}
      </div>

      {/* 카테고리 & 학교 */}
      <div className="col-span-12 md:col-span-2 flex items-center gap-2 md:justify-center">
        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${getCategoryColor(notice.category)}`}>
          {notice.category}
        </span>
        {notice.targetSchool !== 'All' && (
          <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">
            {notice.targetSchool}
          </span>
        )}
      </div>

      {/* 제목 */}
      <div className="col-span-12 md:col-span-6">
        <h3 className={`text-sm md:text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1
          ${notice.pinned ? 'text-indigo-900' : ''}`}>
          {notice.pinned && <span className="mr-2 text-red-500 text-xs">[필독]</span>}
          {notice.title}
          {isNew(notice.regDate) && (
            <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full animate-pulse">
              N
            </span>
          )}
        </h3>
      </div>

      {/* 작성자 */}
      <div className="hidden md:block col-span-1 text-center text-xs font-bold text-slate-500">
        {notice.writer}
      </div>

      {/* 조회수 */}
      <div className="hidden md:block col-span-1 text-center text-xs font-bold text-slate-400">
        {notice.viewCount}
      </div>

      {/* 날짜 */}
      <div className="col-span-12 md:col-span-1 md:text-right text-xs text-slate-400 font-bold flex justify-between md:block mt-2 md:mt-0">
        <span className="md:hidden">Updated:</span>
        {formatDate(notice.regDate)}
      </div>
    </Link>
  );

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">공지사항</h1>
          <p className="text-slate-500 font-medium mt-1">이스라엘 한인 학생회의 중요 공지 및 이벤트를 확인하세요.</p>
        </div>
        {canWrite && (
          <button
            onClick={() => navigate('/notice/new')}
            className="px-6 py-3 bg-slate-950 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2"
          >
            공지 작성
          </button>
        )}
      </header>

      {/* 검색 및 필터 바 */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select
            className="px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100"
            value={filterSchool}
            onChange={(e) => handleFilterChange(setFilterSchool, e.target.value)}
          >
            <option value="ALL">모든 학교</option>
            <option value="히브리대">히브리대</option>
            <option value="텔아비브대">텔아비브대</option>
            <option value="테크니온">테크니온</option>
            <option value="바일란대">바일란대</option>
            <option value="ETC">기타</option>
          </select>

          <select
            className="px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100"
            value={filterCategory}
            onChange={(e) => handleFilterChange(setFilterCategory, e.target.value)}
          >
            <option value="ALL">전체 분류</option>
            <option value="공지">공지</option>
            <option value="행사">행사</option>
            <option value="비자">비자</option>
            <option value="긴급">긴급</option>
            <option value="Etc">기타</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none"
            value={sortBy}
            onChange={(e) => handleFilterChange(setSortBy, e.target.value as 'LATEST' | 'VIEWS')}
          >
            <option value="LATEST">최신순</option>
            <option value="VIEWS">조회순</option>
          </select>

          <div className="relative flex-1 sm:w-64 flex gap-2">
            <input
              type="text"
              placeholder="제목 + 내용 검색"
              className="w-full pl-4 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <button
              onClick={handleSearch}
              className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors whitespace-nowrap"
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 리스트 */}
      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <TableHeader />
        <div className="divide-y divide-slate-50">
          {boardData.length > 0 ? (
            boardData.map((notice, idx) => (
              <NoticeRow key={notice.id} notice={notice} index={idx} />
            ))
          ) : (
            <div className="py-20 text-center text-slate-400 font-bold">
              게시글이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-10 h-10 rounded-xl font-bold text-xs transition-all bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            &lt;
          </button>

          {pageRange.map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-xl font-bold text-xs transition-all
                ${currentPage === page
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white text-slate-400 hover:bg-slate-50'}`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-10 h-10 rounded-xl font-bold text-xs transition-all bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default Notices;
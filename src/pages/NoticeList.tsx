import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Notice, User, UserRole } from '../types';
import { api } from '../api';

interface NoticesProps {
  user: User | null;
  notices?: Notice[]; 
}

const ITEMS_PER_PAGE = 10;

const Notices: React.FC<NoticesProps> = ({ user }) => {
  const navigate = useNavigate();

  const [boardData, setBoardData] = useState<Notice[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterSchool, setFilterSchool] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<'LATEST' | 'VIEWS'>('LATEST');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchNotices = async () => {
      const response = await api.getNotices({
        page: currentPage - 1,
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

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

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

  const getRowNumber = (notice: Notice, index: number) => {
    if (notice.pinned) return '📌';
    return totalElements - ((currentPage - 1) * ITEMS_PER_PAGE) - index;
  };

  const canWrite =
    user?.role === UserRole.ADMIN ||
    user?.role === UserRole.STAFF ||
    user?.role === UserRole.WRITER;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Official': return 'bg-red-50 text-red-600';
      case 'Event': return 'bg-emerald-50 text-emerald-600';
      case 'Visa': return 'bg-sky-50 text-sky-600';
      case 'Etc': return 'bg-slate-100 text-slate-600';
      default: return 'bg-indigo-50 text-indigo-600';
    }
  };

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
      className={`block md:grid md:grid-cols-12 gap-4 px-5 py-4 md:px-8 md:py-5 hover:bg-indigo-50/30 transition-colors items-center group relative border-b border-slate-50 md:border-none last:border-none
        ${notice.pinned ? 'bg-amber-50/60' : ''}`}
    >
      {/* PC: 번호 */}
      <div className="hidden md:block col-span-1 text-center text-slate-400 font-bold text-xs">
        {getRowNumber(notice, index)}
      </div>

      {/* Mobile Top Row: 카테고리, 학교, 날짜 (PC에선 숨김) */}
      <div className="flex justify-between items-center md:hidden mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${getCategoryColor(notice.category)}`}>
            {notice.category}
          </span>
          {notice.targetSchool !== 'All' && (
            <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">
              {notice.targetSchool}
            </span>
          )}
        </div>
        <div className="text-[10px] text-slate-400 font-bold">
          {formatDate(notice.regDate)}
        </div>
      </div>

      {/* PC: 카테고리 & 학교 (모바일에선 숨김) */}
      <div className="hidden md:flex col-span-2 items-center justify-center gap-2">
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
      <div className="col-span-6 mb-1 md:mb-0">
        <h3 className={`text-sm md:text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 md:line-clamp-1
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

      {/* PC: 작성자 */}
      <div className="hidden md:block col-span-1 text-center text-xs font-bold text-slate-500">
        {notice.writer}
      </div>

      {/* PC: 조회수 / Mobile: 작성자 & 조회수 통합 */}
      <div className="col-span-1 text-xs font-bold text-slate-400 flex items-center gap-3 md:justify-center">
        <span className="md:hidden">{notice.writer}</span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2.5" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2.5" /></svg>
          {notice.viewCount}
        </span>
      </div>

      {/* PC: 날짜 */}
      <div className="hidden md:block col-span-1 text-right text-xs text-slate-400 font-bold">
        {formatDate(notice.regDate)}
      </div>
    </Link>
  );

  return (
    <div className="space-y-8 md:space-y-10 max-w-6xl mx-auto px-4 md:px-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">공지사항</h1>
          <p className="text-sm md:text-base text-slate-500 font-medium mt-1">이스라엘 한인 학생회의 중요 공지 및 이벤트를 확인하세요.</p>
        </div>
        {canWrite && (
          <button
            onClick={() => navigate('/notice/new')}
            className="w-full md:w-auto px-6 py-3 bg-slate-950 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex justify-center items-center gap-2"
          >
            공지 작성
          </button>
        )}
      </header>

      {/* 검색 및 필터 바 */}
      <div className="bg-white p-4 md:p-5 rounded-3xl md:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-3 xl:gap-4 justify-between items-center">
        
        {/* 필터 그룹 (학교, 카테고리) */}
        <div className="grid grid-cols-2 sm:flex gap-2 md:gap-3 w-full xl:w-auto">
          <select
            className="px-3 md:px-4 py-2.5 md:py-3 bg-slate-50 rounded-xl text-xs md:text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100"
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
            className="px-3 md:px-4 py-2.5 md:py-3 bg-slate-50 rounded-xl text-xs md:text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100"
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

        {/* 정렬 및 검색 그룹 */}
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full xl:w-auto">
          <select
            className="px-3 md:px-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-600 outline-none"
            value={sortBy}
            onChange={(e) => handleFilterChange(setSortBy, e.target.value as 'LATEST' | 'VIEWS')}
          >
            <option value="LATEST">최신순</option>
            <option value="VIEWS">조회순</option>
          </select>

          <div className="flex w-full sm:w-64 gap-2">
            <input
              type="text"
              placeholder="제목 + 내용 검색"
              className="flex-1 min-w-0 pl-4 pr-4 py-2.5 md:py-3 bg-slate-50 rounded-xl text-xs md:text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <button
              onClick={handleSearch}
              className="shrink-0 px-4 py-2.5 md:py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs md:text-sm hover:bg-indigo-100 transition-colors"
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 리스트 */}
      <div className="bg-white border border-slate-100 rounded-3xl md:rounded-[2rem] overflow-hidden shadow-sm">
        <TableHeader />
        <div className="flex flex-col md:divide-y md:divide-slate-50">
          {boardData.length > 0 ? (
            boardData.map((notice, idx) => (
              <NoticeRow key={notice.id} notice={notice} index={idx} />
            ))
          ) : (
            <div className="py-16 md:py-20 text-center text-slate-400 font-bold text-sm md:text-base">
              게시글이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5 md:gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl font-bold text-xs transition-all bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm border border-slate-100"
          >
            &lt;
          </button>

          {pageRange.map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-9 h-9 md:w-10 md:h-10 rounded-xl font-bold text-xs transition-all shadow-sm border border-slate-100
                ${currentPage === page
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl font-bold text-xs transition-all bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm border border-slate-100"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default Notices;
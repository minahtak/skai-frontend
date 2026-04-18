import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Notice, User, UserRole } from '../types';
import { api } from '../api';

interface NoticeDetailProps {
  user: User | null; // 사용자 정보 필요 (권한 체크용)
}

const NoticeDetail: React.FC<NoticeDetailProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 데이터 로딩
  useEffect(() => {
    const fetchDetail = async () => {
      if (id) {
        setIsLoading(true);
        try {
          const data = await api.getNoticeDetail(Number(id));
          setNotice(data);
        } catch (error) {
          console.error("Failed to load notice detail", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchDetail();
  }, [id]);

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!window.confirm("정말 이 공지사항을 삭제하시겠습니까? 삭제 시 복구는 불가능합니다")) return;
    
    if (id) {
      const success = await api.deleteNotice(Number(id)); // API 호출
      if (success) {
        alert("삭제되었습니다.");
        navigate('/notice');
      } else {
        alert("삭제 권한이 없거나 실패했습니다.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">불러오는 중...</p>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="py-32 text-center">
        <p className="font-bold text-slate-500 mb-4">공지사항을 찾을 수 없습니다.</p>
        <Link to="/notice" className="text-slate-900 font-bold underline">목록으로 돌아가기</Link>
      </div>
    );
  }

  // 권한 체크: 관리자, 임원, 또는 본인 글인 경우
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.STAFF || (user?.name === notice.writer);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pb-32">
      {/* 상단 네비게이션 */}
      <div className="mb-6 flex justify-between items-center">
        <Link to="/notice" className="text-[11px] font-black text-slate-400 hover:text-slate-900 inline-flex items-center gap-2 uppercase tracking-widest transition-colors">
          ← Back to List
        </Link>

        {/* 수정/삭제 버튼 */}
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/notice/edit/${notice.id}`)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 컨텐츠 카드 */}
      <article className="bg-white border border-slate-100 rounded-[3rem] shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        {/* 본문 */}
        <div className="p-10 md:p-16 space-y-10">
          <header className="space-y-6 pb-10 border-b border-slate-50">
            <div className="flex justify-between items-start">
              <div className="flex flex-wrap gap-2 items-center">
                {notice.pinned && (
                  <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    PINNED
                  </span>
                )}
                <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] ${notice.category === 'Official' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {notice.category}
                </span>
                {notice.targetSchool && (
                  <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {notice.targetSchool}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                {notice.viewCount} Views
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              {notice.title}
            </h1>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                {notice.writer?.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">{notice.writer}</span>
                <span className="text-[10px] font-bold text-slate-400">
                  {notice.regDate ? new Date(notice.regDate).toLocaleDateString() : ''}
                </span>
              </div>
            </div>
          </header>

          {/* HTML 콘텐츠 렌더링 */}
          <div
            className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-a:text-indigo-600"
            dangerouslySetInnerHTML={{ __html: notice.content }}
          ></div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center items-center">
          <button
            onClick={() => navigate('/notice')}
            className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300 transition-all text-xs tracking-widest uppercase shadow-sm"
          >
            목록으로 돌아가기
          </button>
        </div>
      </article>
    </div>
  );
};

export default NoticeDetail;
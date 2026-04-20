import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Notice, User, UserRole } from '../types';
import { api } from '../api';

// ★ Quill 에디터의 CSS를 불러와야 본문 스타일(들여쓰기, 색상 등)이 제대로 렌더링됩니다.
import 'react-quill-new/dist/quill.snow.css';

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
        <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">불러오는 중...</p>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="py-24 md:py-32 text-center">
        <p className="font-bold text-slate-500 mb-4 text-sm md:text-base">공지사항을 찾을 수 없습니다.</p>
        <Link to="/notice" className="text-slate-900 font-bold underline text-xs md:text-sm">목록으로 돌아가기</Link>
      </div>
    );
  }

  // 권한 체크: 관리자, 임원, 또는 본인 글인 경우
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.STAFF || (user?.name === notice.writer);

  // ★ 핵심: 백엔드에서 온 데이터 중 내용이 비어있는 <p></p>를 찾아서 <p><br></p>로 변경 (줄바꿈 유지)
  const formattedContent = notice.content.replace(/<p><\/p>/g, '<p><br></p>');

  return (
    <div className="max-w-4xl mx-auto py-6 md:py-12 px-4 pb-24 md:pb-32">
      {/* 상단 네비게이션 */}
      <div className="mb-4 md:mb-6 flex justify-between items-center">
        <Link to="/notice" className="text-[10px] md:text-[11px] font-black text-slate-400 hover:text-slate-900 inline-flex items-center gap-1.5 md:gap-2 uppercase tracking-widest transition-colors">
          ← Back to List
        </Link>

        {/* 수정/삭제 버튼 */}
        {canEdit && (
          <div className="flex gap-1.5 md:gap-2">
            <button
              onClick={() => navigate(`/notice/edit/${notice.id}`)}
              className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] md:text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              className="px-3 md:px-4 py-1.5 md:py-2 bg-red-50 text-red-500 rounded-xl text-[10px] md:text-xs font-bold hover:bg-red-100 transition-colors"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 컨텐츠 카드 */}
      <article className="bg-white border border-slate-100 rounded-3xl md:rounded-[3rem] shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        {/* 본문 */}
        <div className="p-6 sm:p-8 md:p-16 space-y-8 md:space-y-10">
          <header className="space-y-4 md:space-y-6 pb-6 md:pb-10 border-b border-slate-50">
            <div className="flex justify-between items-start">
              <div className="flex flex-wrap gap-2 items-center">
                {notice.pinned && (
                  <span className="px-2.5 py-1 md:px-3 md:py-1.5 bg-red-50 text-red-600 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                    PINNED
                  </span>
                )}
                <span className={`px-3 py-1 md:px-4 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] ${notice.category === 'Official' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {notice.category}
                </span>
                {notice.targetSchool && (
                  <span className="px-3 py-1 md:px-4 md:py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                    {notice.targetSchool}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 md:gap-1.5 text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest shrink-0">
                {notice.viewCount} Views
              </span>
            </div>

            {/* 노트북/PC에서도 너무 크지 않도록 text-2xl md:text-3xl 수준으로 축소 */}
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight md:leading-tight">
              {notice.title}
            </h1>

            <div className="flex items-center gap-2.5 md:gap-3">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] md:text-xs font-black text-slate-500">
                {notice.writer?.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] md:text-xs font-bold text-slate-900">{notice.writer}</span>
                <span className="text-[9px] md:text-[10px] font-bold text-slate-400">
                  {notice.regDate ? new Date(notice.regDate).toLocaleDateString() : ''}
                </span>
              </div>
            </div>
          </header>

          <div className="ql-snow">
            {/* 모바일 폰트 축소를 위해 prose-sm 추가, PC는 prose-base 수준으로 유지 */}
            <div
              className="ql-editor prose prose-slate prose-sm sm:prose-base max-w-none prose-headings:font-black prose-a:text-indigo-600 prose-ul:list-disc !p-0"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            ></div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex justify-center items-center">
          <button
            onClick={() => navigate('/notice')}
            className="w-full md:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300 transition-all text-[10px] md:text-xs tracking-widest uppercase shadow-sm"
          >
            목록으로 돌아가기
          </button>
        </div>
      </article>
    </div>
  );
};

export default NoticeDetail;
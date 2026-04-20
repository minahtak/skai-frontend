import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../api';
import CommentSection from '../components/CommentSection';
import { User, Info } from '../types';

// ★ Quill 에디터의 CSS를 불러와야 본문 스타일(들여쓰기, 색상 등)이 제대로 렌더링됩니다.
import 'react-quill-new/dist/quill.snow.css';

const InfoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [info, setInfo] = useState<Info | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const loadData = async () => {
    if (id) {
      try {
        const data = await api.getInfoDetail(id);
        setInfo(data);
      } catch (error) {
        console.error("Failed to load info detail", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
    api.checkAuth().then(setUser);
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("정말로 이 정보를 삭제하시겠습니까?")) {
      const success = await api.deleteInfo(id!);
      if (success) {
        alert("삭제되었습니다.");
        navigate('/info');
      } else {
        alert("삭제 권한이 없거나 실패했습니다.");
      }
    }
  };

  const isManager = user && (user.role === 'ADMIN' || user.role === 'STAFF');
  const isOwner = user && (user.username === info?.writer || isManager);

  const handleApprove = async () => {
    if (!window.confirm("이 게시글을 승인하시겠습니까?")) return;
    const success = await api.approveInfo(Number(id), 'APPROVED');
    if (success) {
      alert("승인되었습니다. 정보 목록에 공개됩니다.");
      loadData();
    } else {
      alert("처리 중 오류가 발생했습니다.");
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert("반려 사유를 반드시 입력해야 합니다.");
      return;
    }
    const success = await api.approveInfo(Number(id), 'REJECTED', rejectReason);
    if (success) {
      alert("반려 처리되었습니다.");
      setIsRejectModalOpen(false);
      loadData();
    } else {
      alert("처리 중 오류가 발생했습니다.");
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

  if (!info) {
    return (
      <div className="py-32 text-center">
        <p className="font-bold text-slate-500 mb-4">해당 정보를 찾을 수 없습니다.</p>
        <Link to="/info" className="text-slate-900 font-bold underline">목록으로 돌아가기</Link>
      </div>
    );
  }

  // SEO 및 Open Graph용 데이터 추출
  const plainTextDescription = info.content.replace(/<[^>]+>/g, '').substring(0, 100) + '...';
  const imgMatch = info.content.match(/<img[^>]+src="([^">]+)"/);
  const ogImage = imgMatch ? imgMatch[1] : 'https://skaisrael.com/logo3.png'; 
  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://skaisrael.com/info/${id}`;

  // ★ 핵심 1: 백엔드에서 온 데이터 중 내용이 비어있는 <p></p>를 찾아서 <p><br></p>로 변경 (줄바꿈 유지)
  const formattedContent = info.content.replace(/<p><\/p>/g, '<p><br></p>');

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pb-32">
      {/* 상단 네비게이션 */}
      <div className="mb-6 flex justify-between items-center">
        <Link to="/info" className="text-[11px] font-black text-slate-400 hover:text-slate-900 inline-flex items-center gap-2 uppercase tracking-widest transition-colors">
          ← Back to List
        </Link>

        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/info/edit/${id}`)}
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
        {/* 상태 표시 */}
        {info.status === 'PENDING' && (
          <div className="bg-yellow-50 text-yellow-700 text-xs font-bold text-center py-3 border-b border-yellow-100 rounded-t-2xl">
            [승인 대기] 관리자 승인 후 전체 공개됩니다.
          </div>
        )}
        {info.status === 'REJECTED' && (
          <div className="bg-red-50 p-6 border-b border-red-100 rounded-t-2xl">
            <h3 className="text-red-800 font-black text-sm mb-2">이 게시글은 반려되었습니다.</h3>
            <p className="text-red-600 text-xs leading-relaxed font-medium">
              사유: {info.rejectionReason || "상세 사유가 없습니다."}
            </p>
          </div>
        )}

        {/* 본문 */}
        <div className="p-10 md:p-16 space-y-10">
          <header className="space-y-6 pb-10 border-b border-slate-50">
            <div className="flex justify-between items-start">
              <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">
                {info.category}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                {info.viewCount} Views
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{info.title}</h1>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                {info.writer?.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">{info.writer}</span>
                <span className="text-[10px] font-bold text-slate-400">{info.regDate ? new Date(info.regDate).toLocaleDateString() : ''}</span>
              </div>
            </div>
          </header>

          {/* ★ 핵심 2: ql-snow와 ql-editor를 유지하면서 Tailwind의 prose 클래스를 조합해 디자인 복구 */}
          <div className="ql-snow">
            <div
              className="ql-editor prose prose-slate prose-lg max-w-none prose-headings:font-black prose-a:text-indigo-600 prose-ul:list-disc !p-0"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            ></div>
          </div>

          <div className="pt-10 flex gap-2">
            {info.schoolTag && <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[11px] font-bold">#{info.schoolTag}</span>}
            {info.targetTag && <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[11px] font-bold">#{info.targetTag}</span>}
          </div>
        </div>

        {/* 댓글 */}
        <div className="px-8 md:px-16 pb-16 bg-slate-50/50">
          <CommentSection
            comments={info.comments}
            targetId={info.id}
            type="info"
            onCommentUpdate={loadData}
            currentUser={user}
          />
        </div>
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center items-center">
          <button
            onClick={() => navigate('/info')}
            className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300 transition-all text-xs tracking-widest uppercase shadow-sm"
          >
            목록으로 돌아가기
          </button>
        </div>
      </article>

      {/* 관리자/임원 전용 Review 모드 */}
      {isManager && info.status !== 'APPROVED' && (
        <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 p-5 z-40 shadow-2xl">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Review Mode
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold tracking-wide shadow-lg hover:bg-indigo-500 hover:shadow-lg"
              >
                승인
              </button>
              {info.status !== 'REJECTED' && (
                <button
                  onClick={() => { setRejectReason(""); setIsRejectModalOpen(true); }}
                  className="px-6 py-3 border border-rose-200 text-rose-600 bg-white rounded-2xl text-xs font-bold tracking-wide hover:bg-rose-50 transition-all"
                >
                  반려
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 반려 사유 모달 */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-md"
            onClick={() => setIsRejectModalOpen(false)}
          ></div>
          <form
            onSubmit={handleRejectSubmit}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">
                콘텐츠 반려
              </h3>
              <p className="text-xs font-medium text-slate-400">
                작성자에게 전달될 반려 사유를 입력해주세요.
              </p>
            </div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="예: 욕설이 포함되어 있습니다. / 가이드라인에 맞지 않는 게시물입니다."
              className="w-full bg-slate-50 rounded-2xl px-5 py-4 text-sm font-medium h-32 resize-none outline-none focus:ring-2 ring-slate-900/20 transition-all border border-slate-100"
              required
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-2xl font-bold text-xs uppercase tracking-widest transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 bg-rose-600 text-white hover:bg-rose-700 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all"
              >
                반려 확정
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InfoDetail;
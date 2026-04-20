import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { GalleryItem, User } from '../types';
import { api } from '../api';

interface GalleryProps {
  user: User | null;
}

const GalleryList: React.FC<GalleryProps> = ({ user }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ★ 정렬 상태 관리 (기본값: 최신순)
  const [sortOption, setSortOption] = useState('regDate,desc');

  // 모달 관련 상태
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryItem | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // 댓글 관련 상태
  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<number | null>(null);

  // ★ 추가된 부분: 기존 R2 도메인을 새 CDN 도메인으로 자동 변환하는 함수
  const formatImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/300?text=No+Image';
    // 정규식을 사용해 https://pub-어쩌구.r2.dev 형태를 모두 찾아 변경
    return url.replace(/https:\/\/pub-[^/]+\.r2\.dev/g, 'https://cdn.skaisrael.com');
  };

  // 데이터 불러오기 (정렬 옵션이 바뀌면 다시 실행됨)
  const fetchGalleries = async () => {
    setLoading(true);
    const data = await api.getGalleries(0, 12, sortOption);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGalleries();
  }, [sortOption]);

  const toggleLike = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return alert("로그인이 필요합니다.");

    const success = await api.likeGallery(id);

    if (success) {
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          const wasLiked = item.isLiked;
          return {
            ...item,
            isLiked: !wasLiked,
            likes: (item.likes || 0) + (wasLiked ? -1 : 1)
          };
        }
        return item;
      }));

      if (selectedAlbum && selectedAlbum.id === id) {
        setSelectedAlbum(prev => {
          if (!prev) return null;
          const wasLiked = prev.isLiked;
          return {
            ...prev,
            isLiked: !wasLiked,
            likes: (prev.likes || 0) + (wasLiked ? -1 : 1)
          };
        });
      }
    } else {
      alert("오류가 발생했습니다.");
    }
  };

  const openAlbum = async (item: GalleryItem) => {
    setSelectedAlbum(item);
    setActiveImageIdx(0);
    setCommentText("");
    setReplyTarget(null);
    const detail = await api.getGalleryDetail(item.id);
    if (detail) setSelectedAlbum(detail);
  };

  const refreshDetail = async () => {
    if (!selectedAlbum) return;
    const detail = await api.getGalleryDetail(selectedAlbum.id);
    if (detail) {
      setSelectedAlbum(detail);
      setItems(prev => prev.map(p => p.id === detail.id ? detail : p));
    }
  };

  const handleDelete = async () => {
    if (!selectedAlbum) return;
    if (!window.confirm("정말로 삭제하시겠습니까?")) return;

    const success = await api.deleteGallery(selectedAlbum.id);
    if (success) {
      alert("삭제되었습니다.");
      setSelectedAlbum(null);
      fetchGalleries();
    } else {
      alert("삭제 실패");
    }
  };

  const handleEdit = () => {
    if (!selectedAlbum) return;
    navigate(`/gallery/edit/${selectedAlbum.id}`);
  };

  const isManager = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const isWriter = (writerName?: string) => user && user.username === writerName;

  const navigateImage = (dir: 'next' | 'prev') => {
    if (!selectedAlbum) return;
    if (dir === 'next') {
      setActiveImageIdx((prev) => (prev + 1) % selectedAlbum.images.length);
    } else {
      setActiveImageIdx((prev) => (prev - 1 + selectedAlbum.images.length) % selectedAlbum.images.length);
    }
  };

  // 댓글 작성
  const handlePostComment = async () => {
    if (!commentText.trim() || !user || !selectedAlbum) return;

    const payload = {
      galleryId: selectedAlbum.id,
      content: commentText,
      writer: user.username,
      parentId: replyTarget
    };

    const success = await api.writeComment(payload);
    if (success) {
      setCommentText("");
      setReplyTarget(null);
      await refreshDetail();
    } else {
      alert("댓글 작성에 실패했습니다.");
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    const success = await api.deleteComment(commentId);
    if (success) {
      await refreshDetail();
    } else {
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Gallery | SKAI 이스라엘 한인 학생회</title>
        <meta name="description" content="이스라엘 한인 학생회의 다양한 활동, 행사 및 이스라엘 유학 생활의 생생한 기록을 사진으로 만나보세요." />
        <meta name="keywords" content="이스라엘 유학 생활, 학생회 행사, SKAI 갤러리, 이스라엘 사진" />
        <meta property="og:title" content="SKAI 갤러리 | 이스라엘 한인 학생회" />
        <meta property="og:description" content="이스라엘 유학 생활의 생생한 기록과 학생회 활동 사진 모음" />
        <meta property="og:image" content="https://images.unsplash.com/photo-1544971587-b842c27f8e14?auto=format&fit=crop&q=80&w=1200" />
      </Helmet>

      <div className="space-y-12 pb-12">
        <header className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gallery</h1>
            <p className="text-slate-500 font-medium mt-2 ">이스라엘 한인 학생회의 다양한 활동과 기록입니다.</p>
          </div>

          {/* 필터 및 버튼 영역 */}
          <div className="flex items-center gap-3">
            {/* 정렬 필터 드롭다운 */}
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-700 py-3 pl-4 pr-10 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/10 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
              >
                <option value="regDate,desc">최신순</option>
                <option value="likes,desc">좋아요순</option>
                <option value="viewCount,desc">조회순</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>

            {isManager && (
              <Link to="/gallery/new" className="px-6 py-3 bg-slate-950 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
                <span>사진 업로드</span>
              </Link>
            )}
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold">사진을 불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => (
              <div
                key={item.id}
                className="relative aspect-square overflow-hidden cursor-pointer rounded-2xl border border-slate-100 group shadow-sm bg-white"
                onClick={() => openAlbum(item)}
              >
                {/* ★ 수정된 부분: 리스트 썸네일 */}
                <img
                  src={formatImageUrl(item.images?.[0])}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image'}
                />
                <div className="absolute top-4 right-4 bg-slate-950/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black text-white">
                  +{item.images?.length || 0}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 text-white">
                  <h4 className="font-black text-sm mb-2 line-clamp-1">{item.title}</h4>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold">
                      <svg className={`w-3.5 h-3.5 ${item.isLiked ? 'fill-red-500 text-red-500' : 'fill-current'}`} viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                      {item.likes || 0}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" /></svg>
                      {item.comments ? item.comments.length : 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedAlbum && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setSelectedAlbum(null)}></div>

            <div className="relative bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-[78vh] shadow-2xl">

              <div className="flex-grow bg-slate-100 flex items-center justify-center px-6 py-3 md:px-8 md:py-4 relative min-h-[400px]">
                {selectedAlbum.images && selectedAlbum.images.length > 1 && (
                  <>
                    <button onClick={() => navigateImage('prev')} className="absolute left-6 z-10 p-3 bg-white/20 hover:bg-white text-indigo-950 rounded-full transition-all backdrop-blur-sm shadow-xl group">
                      <svg className="w-8 h-8 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => navigateImage('next')} className="absolute right-6 z-10 p-3 bg-white/20 hover:bg-white text-indigo-950 rounded-full transition-all backdrop-blur-sm shadow-xl group">
                      <svg className="w-8 h-8 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </>
                )}
                <div className="w-full aspect-square md:w-[550px] md:h-[550px] md:aspect-auto max-w-[550px] overflow-hidden rounded-2xl shadow-2xl bg-white flex-shrink-0">
                  {/* ★ 수정된 부분: 모달 메인 이미지 */}
                  <img
                    src={formatImageUrl(selectedAlbum.images[activeImageIdx])}
                    className="w-full h-full object-cover animate-in fade-in duration-500"
                    alt="preview"
                  />
                </div>
                {selectedAlbum.images && selectedAlbum.images.length > 1 && (
                  <div className="absolute bottom-8 flex gap-2 overflow-x-auto max-w-[80%] p-2 scrollbar-hide">
                    {selectedAlbum.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-4 transition-all shrink-0 ${activeImageIdx === idx ? 'border-indigo-600 scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                      >
                        {/* ★ 수정된 부분: 하단 작은 썸네일 */}
                        <img src={formatImageUrl(img)} className="w-full h-full object-cover" alt={`thumbnail-${idx}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* 오른쪽: 정보 및 댓글 */}
              <div className="w-full md:w-[400px] flex flex-col h-full bg-white border-l border-slate-100">
                <div className="p-8 border-b flex justify-between items-start bg-slate-50 shrink-0">
                  <div>
                    <h3 className="font-black text-xl text-slate-900 leading-tight mb-2">{selectedAlbum.title}</h3>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {selectedAlbum.regDate?.substring(0, 10)} • {selectedAlbum.viewCount} Views
                      </p>
                      {(isManager || isWriter(selectedAlbum.writer)) && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={handleEdit} className="text-xs font-bold text-slate-400 hover:text-indigo-600 underline">수정</button>
                          <button onClick={handleDelete} className="text-xs font-bold text-slate-400 hover:text-red-600 underline">삭제</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedAlbum(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto p-8 custom-scrollbar space-y-10">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{selectedAlbum.content}</p>

                  <div className="pt-10 border-t border-slate-50 space-y-6">
                    {/* 좋아요 버튼 */}
                    <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                      <button onClick={(e) => toggleLike(selectedAlbum.id, e)} className={`flex items-center gap-2 transition-all ${selectedAlbum.isLiked ? 'text-red-500' : 'text-slate-300 hover:text-red-400'}`}>
                        <svg className={`w-8 h-8 ${selectedAlbum.isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" strokeWidth="2" />
                        </svg>
                        <span className="text-sm font-black text-slate-900">{selectedAlbum.likes || 0} Likes</span>
                      </button>
                    </div>

                    {/* 댓글 목록 */}
                    <div className="space-y-6">
                      {selectedAlbum.comments && selectedAlbum.comments.map((comment: any) => {
                        const canDelete = (isManager || isWriter(comment.writer));

                        return (
                          <div key={comment.id} className="space-y-4">
                            {/* 댓글 */}
                            <div className="group">
                              <div className="flex justify-between items-start mb-1.5">
                                <span className="text-[11px] font-black text-slate-800">{comment.writer}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold text-slate-300">{comment.regDate?.substring(0, 10)}</span>
                                  {canDelete && (
                                    <button onClick={() => handleDeleteComment(comment.id)} className="text-[9px] text-red-400 hover:text-red-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">삭제</button>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-2">{comment.content}</p>
                              {user && !replyTarget && (
                                <button onClick={() => setReplyTarget(comment.id)} className="text-[10px] font-black text-indigo-400 uppercase hover:text-indigo-600 transition-colors">Reply</button>
                              )}
                            </div>

                            {/* 대댓글들 */}
                            {comment.children && comment.children.map((reply: any) => {
                              const canDeleteReply = (isManager || isWriter(reply.writer));

                              return (
                                <div key={reply.id} className="ml-6 pl-4 border-l-2 border-slate-100 py-1 group">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-slate-700">{reply.writer}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[8px] font-bold text-slate-300">{reply.regDate?.substring(0, 10)}</span>
                                      {canDeleteReply && (
                                        <button onClick={() => handleDeleteComment(reply.id)} className="text-[8px] text-red-400 hover:text-red-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">삭제</button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-500 font-medium">{reply.content}</p>
                                </div>
                              );
                            })}

                            {/* 답글 작성 폼 */}
                            {replyTarget === comment.id && user && (
                              <div className="ml-6 pl-4 border-l-2 border-indigo-200">
                                <div className="flex gap-2 items-start">
                                  <input
                                    type="text"
                                    placeholder={`@${comment.writer}에게 답글...`}
                                    className="flex-grow text-xs border border-slate-200 bg-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                                  />
                                  <button onClick={handlePostComment} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 transition-all">Post</button>
                                  <button onClick={() => { setReplyTarget(null); setCommentText(""); }} className="px-3 py-2 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase transition-all">Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {(!selectedAlbum.comments || selectedAlbum.comments.length === 0) && (
                        <p className="text-center text-slate-400 text-xs font-bold py-8">첫 댓글을 남겨보세요</p>
                      )}
                    </div>

                    {/* 댓글 작성 폼 (메인) */}
                    {user && !replyTarget ? (
                      <div className="space-y-3 pt-6 border-t border-slate-50">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="댓글을 작성하세요..."
                            className="flex-grow text-xs border border-slate-200 bg-white rounded-xl p-4 outline-none focus:ring-4 focus:ring-indigo-100 font-medium"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                          />
                          <button onClick={handlePostComment} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase hover:bg-indigo-700 transition-all shadow-lg">Post</button>
                        </div>
                      </div>
                    ) : !user ? (
                      <p className="text-[10px] text-center text-slate-400 italic pt-6 border-t border-slate-50">로그인하여 댓글을 남겨보세요</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GalleryList;
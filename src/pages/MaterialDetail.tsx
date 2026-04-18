import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import CommentSection from '../components/CommentSection';

const MaterialDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [material, setMaterial] = useState<any>(null);
  const [user, setUser] = useState<any>(null); // 현재 로그인한 유저 정보
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // 에러 상태 (로그인 필요 / 권한 없음)

  // 데이터 불러오기 함수
  const loadData = async () => {
    try {
      if (id) {
        const data = await api.getMaterialDetail(id);
        // 백엔드가 403을 뱉거나 데이터가 없으면 에러 처리
        if (!data) throw new Error("Unauthorized or Not Found");
        setMaterial(data);
      }
    } catch (e) {
      setError("access_denied");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. 초기 실행 시: 유저 인증 먼저 체크
    const init = async () => {
      setIsLoading(true);
      const currentUser = await api.checkAuth();
      setUser(currentUser);

      if (!currentUser) {
        // 비로그인이면 즉시 에러 상태로 전환 (API 호출 안 함)
        setError("login_required");
        setIsLoading(false);
      } else {
        // 로그인 상태면 데이터 로드 시작
        loadData();
      }
    };
    init();
  }, [id]);

  // 삭제 핸들러
  const handleDelete = async () => {
    if (window.confirm('정말로 이 자료를 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.')) {
      const success = await api.deleteMaterial(Number(id));
      if (success) {
        alert('성공적으로 삭제되었습니다.');
        navigate('/material'); // 삭제 후 목록으로 이동
      } else {
        alert('삭제에 실패했습니다. 권한이 없거나 서버 오류입니다.');
      }
    }
  };

  // 수정 핸들러 (수정 페이지로 이동)
  const handleEdit = () => {
    // material 객체를 state로 넘겨주면 수정 페이지에서 API를 또 호출할 필요 없이 바로 폼에 채울 수 있음
    navigate(`/material/edit/${id}`, { state: { material } });
  };

  // ★ 관리자(임원) 권한 체크
  const isManager = user && (user.role === 'ADMIN' || user.role === 'STAFF');

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6 shadow-sm"></div>
        <p className="text-slate-400 font-black text-[11px] uppercase tracking-widest">자료를 불러오는 중...</p>
      </div>
    );
  }

  // 에러 발생 시 (로그인 필요 or 데이터 없음) 안내 화면
  if (error === "login_required" || error === "access_denied" || !material) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4">
        <div className="bg-white p-12 md:p-16 rounded-[3rem] border border-slate-100 shadow-xl text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner text-indigo-500">
            🔒
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight">
            {error === "login_required" ? "로그인이 필요한 서비스입니다" : "자료를 찾을 수 없거나 권한이 없습니다"}
          </h2>
          <p className="text-slate-500 mb-12 font-medium leading-relaxed">
            해당 자료의 상세 내용을 확인하시려면 로그인을 해주세요.<br />
            이스라엘 한인 학생회 회원이라면 누구나 볼 수 있습니다.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              로그인 하러가기
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-10 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 hover:-translate-y-0.5 transition-all"
            >
              뒤로가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 정상 렌더링
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">

      {/* ★ 상단 네비게이션: 뒤로가기 링크 및 수정/삭제 버튼 */}
      <div className="mb-2 flex justify-between items-center">
        <button
          onClick={() => navigate('/material')}
          className="text-[11px] font-black text-slate-400 hover:text-slate-900 inline-flex items-center gap-2 uppercase tracking-widest transition-colors"
        >
          ← Back to List
        </button>

        {/* 권한이 있는 경우에만 수정/삭제 버튼 노출 */}
        {isManager && (
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
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

      <article className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* 상단 헤더 영역 */}
        <div className="p-10 md:p-16 border-b border-slate-50 bg-slate-50/50 relative overflow-hidden">
          {/* 장식용 배경 요소 */}
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
            <svg className="w-64 h-64 fill-current" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45L20.14 19H3.86L12 5.45z" /></svg>
          </div>

          <div className="relative z-10">
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="px-3.5 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-sm">{material.school}</span>
              <span className="px-3.5 py-1.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-xl uppercase tracking-widest">{material.major}</span>
              <span className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-500 text-[10px] font-black rounded-xl uppercase tracking-widest shadow-sm">
                {material.category === 'Note' ? '필기 노트' :
                  material.category === 'Summary' ? '요약본' :
                    material.category === 'Exam' ? '기출문제' : '수업자료'}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-10 leading-tight tracking-tight">
              {material.title}
            </h1>

            {/* 주요 정보 그리드 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-6 bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm">
              <div>
                <span className="block text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Subject</span>
                <span className="font-bold text-slate-800 text-sm md:text-base">{material.subject}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Professor</span>
                <span className="font-bold text-slate-800 text-sm md:text-base">{material.professor || '-'}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Language</span>
                <span className="font-bold text-slate-800 text-sm md:text-base">{material.language}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Contributor</span>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-800 text-sm md:text-base">{material.writer || '익명'}</span>
                </div>
              </div>
              <div>
                <span className="block text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Date</span>
                <span className="font-bold text-slate-800 text-sm md:text-base">
                  {material.regDate ? material.regDate.substring(0, 10) : '-'}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Views</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 text-sm md:text-base ">
                  {material.viewCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 구글 드라이브 버튼 & 설명 영역 */}
        <div className="p-10 md:p-16 space-y-12">
          <a
            href={material.googleDriveLink}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-center gap-3 w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-lg md:text-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl "
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            자료 열람하기
          </a>

          {/* 본문 설명 영역 (내용이 있을 때만 렌더링) */}
          {material.content && material.content.trim() !== '' && (
            <div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                Description
              </h3>
              <div className="text-slate-600 font-medium leading-loose whitespace-pre-wrap bg-slate-50 p-8 md:p-10 rounded-[2rem] border border-slate-100 text-sm md:text-base min-h-[150px]">
                {material.content}
              </div>
            </div>
          )}
        </div>

        {/* 댓글 섹션 */}
        <div className="px-10 md:px-16 pb-16">
          <CommentSection
            comments={material.comments} // 백엔드 Material 엔티티에 comments 리스트가 포함됨
            targetId={material.id}
            type="material"
            onCommentUpdate={loadData} // 댓글 작성/삭제 후 데이터 새로고침
            currentUser={user}
          />
        </div>

        {/* 하단 네비게이션 */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center items-center">
          <button
            onClick={() => navigate('/material')}
            className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300 transition-all text-xs tracking-widest uppercase shadow-sm"
          >
            목록으로 돌아가기
          </button>
        </div>
      </article>
    </div>
  );
};

export default MaterialDetail;
import React, { useState, useEffect } from 'react';
import { User, Info, Executive, InfoStatus } from '../types';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // ★ 파일 업로드를 위해 추가

interface AdminDashboardProps {
   user: User | null;
   infos: Info[]; 
   setInfos?: React.Dispatch<React.SetStateAction<Info[]>>;
}

interface ExecutiveFormData {
   id?: number;
   memberId?: number;
   name: string;
   school: string;
   role: string;
   intro: string;
   imageUrl: string;
}

// 구글 드라이브 이미지 변환
const getImageUrl = (url: string, name: string) => {
   if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
   if (url.includes('drive.google.com')) {
      let id = '';
      const parts = url.split('/d/');
      if (parts.length > 1) id = parts[1].split('/')[0];
      else if (url.includes('id=')) {
         const match = url.match(/id=([a-zA-Z0-9_-]+)/);
         if (match) id = match[1];
      }
      if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
   }
   return url;
};

const formatDate = (dateString?: string | Date) => {
   if (!dateString) return '-';
   if (typeof dateString === 'string') return dateString.split('T')[0];
   return dateString.toISOString().split('T')[0];
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, infos, setInfos }) => {
   const [tab, setTab] = useState<'Content' | 'Users' | 'Executives'>('Content');
   const [users, setUsers] = useState<User[]>([]);
   const [executives, setExecutives] = useState<Executive[]>([]);

   const [pendingInfos, setPendingInfos] = useState<Info[]>([]);

   const navigate = useNavigate();

   const [stats, setStats] = useState({ totalMembers: 0, executives: 0, pendingWiki: 0, pendingMaterials: 0 });
   const [page, setPage] = useState(0);
   const [totalPages, setTotalPages] = useState(0);
   const [roleFilter, setRoleFilter] = useState('ALL');
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedUser, setSelectedUser] = useState<User | null>(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [modalMode, setModalMode] = useState<'PROMOTE' | 'EDIT'>('PROMOTE');
   const [formData, setFormData] = useState<ExecutiveFormData>({ role: '', name: '', school: '', intro: '', imageUrl: '' });

   // ★ 파일 업로드용 상태 추가
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);

   const fetchData = async (pageNum = 0, filter = roleFilter, search = searchTerm) => {
      try {
         const statsData = await api.admin.getStats();
         setStats(statsData);

         const memberData = await api.admin.getMembers(pageNum, 10, filter, search);
         setUsers(memberData.content || []);
         setTotalPages(memberData.totalPages || 0);
         setPage(pageNum);

         const execData = await api.admin.getExecutives();
         setExecutives(execData || []);

         const pendingData = await api.getInfos({ status: 'PENDING', size: 100 });
         setPendingInfos(pendingData || []);

      } catch (e: any) {
         console.error(e);
         if (e.response && e.response.status === 403) {
            alert("관리자 권한이 만료되었습니다. 다시 로그인해주세요.");
            window.location.href = '/login';
         }
      }
   };

   useEffect(() => { fetchData(0, 'ALL', ''); }, []);
   useEffect(() => { setPage(0); fetchData(0, roleFilter, searchTerm); }, [roleFilter]);

   const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') { setPage(0); fetchData(0, roleFilter, searchTerm); }
   };

   const isAuthorized = user?.role === 'ADMIN' || user?.role === 'STAFF' || user?.email === 'admin@admin.com';
   if (!isAuthorized) {
      return (
         <div className="py-24 text-center">
            <div className="text-5xl mb-6">🔒</div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">접근 제한</h2>
            <p className="text-slate-500 font-medium">관리자나 학생회 임원만 접근할 수 있는 페이지입니다.</p>
         </div>
      );
   }

   const getRoleBadge = (role: string) => {
      switch (role) {
         case 'ADMIN': return <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-950 text-white">ADMIN</span>;
         case 'STAFF': return <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-700 text-white">STAFF</span>;
         case 'WRITER': return <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-700">WRITER</span>;
         default: return <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-400">USER</span>;
      }
   };

   const handleChangeRole = async (u: User, newRole: string) => {
      if (!window.confirm(`${u.name}님의 권한을 ${newRole}(으)로 변경하시겠습니까?`)) return;
      const success = await api.admin.changeRole(u.id, newRole);
      if (success) { alert("변경되었습니다."); fetchData(page, roleFilter, searchTerm); }
   };

   const handleRevoke = async (u: User) => {
      if (!window.confirm(`[${u.name}] 님의 임원 권한을 해제하시겠습니까?`)) return;
      const success = await api.admin.revokeExecutive(u.id);
      if (success) { alert("해제되었습니다."); fetchData(page, roleFilter, searchTerm); }
   };

   const handleRemoveExecutive = async (e: Executive) => {
      const memberId = e.member?.id || e.memberId;
      if (!memberId) { alert("회원 정보를 찾을 수 없습니다."); return; }
      if (!window.confirm(`정말 ${e.name}님을 임원직에서 해제하시겠습니까?\n일반 유저로 권한이 변경됩니다.`)) return;

      const success = await api.admin.revokeExecutive(memberId);
      if (success) { alert("삭제되었습니다."); fetchData(page, roleFilter, searchTerm); }
   };

   const handleDelete = async (u: User) => {
      if (!window.confirm(`정말 ${u.name}님을 삭제하시겠습니까? 복구할 수 없습니다.`)) return;
      const success = await api.admin.deleteMember(u.id);
      if (success) { alert("삭제되었습니다."); fetchData(page, roleFilter, searchTerm); }
   };

   // ★ 모달 열 때 파일 관련 상태 초기화 추가
   const openPromoteModal = (u: User) => {
      setModalMode('PROMOTE');
      setFormData({ memberId: u.id, name: u.name || '', school: u.school || '', role: '', intro: '', imageUrl: '' });
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsModalOpen(true);
   };

   const openEditModal = (e: Executive) => {
      setModalMode('EDIT');
      setFormData({ id: e.id, memberId: e.member?.id || e.memberId, name: e.name, school: e.school, role: e.role, intro: e.intro, imageUrl: e.imageUrl });
      setSelectedFile(null);
      setPreviewUrl(e.imageUrl || null); // 기존 이미지가 있으면 미리보기에 세팅
      setIsModalOpen(true);
   };

   // ★ 파일 선택 시 미리보기 적용
   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         setSelectedFile(file);
         setPreviewUrl(URL.createObjectURL(file)); // 로컬 미리보기 URL 생성
      }
   };

   // ★ 폼 전송 (갤러리와 동일한 api.ts 로직 사용)
   const handleModalSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
         let finalImageUrl = formData.imageUrl;

         // 1. 선택된 새 파일이 있다면 갤러리 API를 통해 Cloudflare R2에 업로드
         if (selectedFile) {
            // (1) Presigned URL 발급 
            // 💡 api.ts의 getPresignedUrl 사용! (내부적으로 client를 써서 토큰이 포함되므로 403 에러 해결됨)
            const presignedData = await api.getPresignedUrl(selectedFile.name, selectedFile.type);
            
            if (!presignedData) throw new Error("업로드 URL 발급 실패");

            // (2) S3/R2로 직접 PUT 업로드 
            // 💡 api.ts의 uploadImageToR2 사용! (내부적으로 기본 axios를 써서 R2에 안전하게 올라감)
            const uploadSuccess = await api.uploadImageToR2(presignedData.uploadUrl, selectedFile);
            
            if (!uploadSuccess) throw new Error("이미지 업로드 실패");

            // (3) 최종 발급된 R2 이미지 URL로 덮어쓰기
            finalImageUrl = presignedData.fileUrl;
         }

         const submitData = { ...formData, imageUrl: finalImageUrl };
         let success = false;

         // 2. 백엔드로 DTO 전송 (이건 기존과 동일)
         if (modalMode === 'PROMOTE') {
            if (submitData.memberId) success = await api.admin.promoteMember(submitData);
         } else {
            if (submitData.id) success = await api.admin.updateExecutive(submitData.id, submitData);
         }

         if (success) {
            alert("완료되었습니다.");
            fetchData(page, roleFilter, searchTerm);
            setIsModalOpen(false);
         } else {
            alert("처리 실패했습니다.");
         }
      } catch (error) {
         console.error('Submit error:', error);
         alert('처리 중 오류가 발생했습니다.');
      } finally {
         setIsSubmitting(false);
      }
   };



   return (
      <div className="space-y-10">
         <header className="flex flex-col md:flex-row justify-between items-center gap-6 p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
            <div>
               <h1 className="text-2xl font-black text-slate-900 leading-tight">Control Center</h1>
               <p className="text-sm font-bold text-slate-400">학생회 운영 통합 대시보드</p>
            </div>
            <div className="flex flex-wrap gap-2 p-1 bg-slate-50 rounded-2xl">
               <button onClick={() => setTab('Content')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${tab === 'Content' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  콘텐츠 승인 ({pendingInfos.length})
               </button>
               <button onClick={() => setTab('Users')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${tab === 'Users' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  회원 관리
               </button>
               <button onClick={() => setTab('Executives')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${tab === 'Executives' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  임원진 관리
               </button>
            </div>
         </header>

         <main className="min-h-[500px]">
            {/* 회원 관리 탭 */}
            {tab === 'Users' && (
               <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-4">
                     <div>
                        <div className="flex items-center gap-3">
                           <h2 className="text-xl font-black text-slate-900">전체 회원 목록</h2>
                           <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg">
                              총 {stats.totalMembers}명
                           </span>
                        </div>
                        <p className="text-xs text-slate-400 font-bold mt-2">* 본인 계정은 목록에 노출되지 않습니다.</p>
                     </div>
                     <div className="flex gap-3 w-full md:w-auto">
                        <div className="flex w-64">
                           <input
                              type="text"
                              placeholder="이름, 학교 검색..."
                              className="flex-1 pl-4 py-2.5 
               bg-white 
               rounded-l-xl rounded-r-none
               text-xs font-bold 
               border border-slate-200 
               outline-none focus:ring-2 ring-slate-900/10"
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                              onKeyDown={handleSearchKey}
                           />

                           <button
                              onClick={() => fetchData(0, roleFilter, searchTerm)}
                              className="px-4 py-2.5 
               bg-slate-100 
               border border-l-0 border-slate-200
               rounded-r-xl rounded-l-none
               text-xs font-bold text-slate-600
               hover:bg-slate-200 transition"
                           >
                              검색
                           </button>
                        </div>
                        <select
                           className="px-4 py-2.5 bg-white rounded-xl text-xs font-bold border border-slate-200 outline-none cursor-pointer"
                           value={roleFilter}
                           onChange={(e) => setRoleFilter(e.target.value)}
                        >
                           <option value="ALL">전체 권한</option>
                           <option value="STAFF">임원</option>
                           <option value="WRITER">작성자</option>
                           <option value="USER">일반회원</option>
                        </select>
                     </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b">
                           <tr>
                              <th className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Profile</th>
                              <th className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact</th>
                              <th className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Role</th>
                              <th className="px-10 py-5 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Permissions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {users.map(u => (
                              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                 <td className="px-10 py-6">
                                    <button onClick={() => setSelectedUser(u)} className="text-left">
                                       <div className="font-black text-slate-900 group-hover:text-slate-600 transition-colors flex items-center gap-2">
                                          {u.name}
                                          <svg className="w-3 h-3 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                       </div>
                                       <div className="text-[10px] text-slate-400 font-bold">{u.school}</div>
                                    </button>
                                 </td>
                                 <td className="px-10 py-6">
                                    <div className="text-xs font-bold text-slate-700">{u.username}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{u.email}</div>
                                 </td>
                                 <td className="px-10 py-6">{getRoleBadge(u.role)}</td>
                                 <td className="px-10 py-6 text-right">
                                    <div className="flex items-center justify-end gap-4">
                                       {u.role !== 'ADMIN' && (
                                          <>
                                             {/* 논리적 버튼 노출 처리 */}
                                             {u.role !== 'STAFF' && (
                                                <button onClick={() => openPromoteModal(u)} className="text-[10px] font-black text-slate-900 hover:text-slate-600 uppercase tracking-widest">Set Staff</button>
                                             )}
                                             {u.role !== 'WRITER' && u.role !== 'STAFF' && (
                                                <button onClick={() => handleChangeRole(u, 'WRITER')} className="text-[10px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest">Set Writer</button>
                                             )}
                                             {u.role === 'STAFF' && (
                                                <button onClick={() => handleRevoke(u)} className="text-[10px] font-black text-orange-500 hover:text-orange-700 uppercase tracking-widest">Revoke</button>
                                             )}
                                             {u.role === 'WRITER' && (
                                                <button onClick={() => handleChangeRole(u, 'USER')} className="text-[10px] font-black text-orange-500 hover:text-orange-700 uppercase tracking-widest">Revoke</button>
                                             )}
                                             <button onClick={() => handleDelete(u)} className="text-[10px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest">Delete</button>
                                          </>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                     <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex justify-center items-center gap-6">
                        <button onClick={() => fetchData(page - 1, roleFilter, searchTerm)} disabled={page === 0} className="text-[10px] font-black uppercase tracking-widest text-slate-400 disabled:opacity-30">Prev</button>
                        <span className="text-xs font-black text-slate-900">{page + 1} <span className="text-slate-300 mx-1">/</span> {totalPages || 1}</span>
                        <button onClick={() => fetchData(page + 1, roleFilter, searchTerm)} disabled={page + 1 >= totalPages} className="text-[10px] font-black uppercase tracking-widest text-slate-400 disabled:opacity-30">Next</button>
                     </div>
                  </div>
               </div>
            )}

            {/* 임원진 관리 탭 */}
            {tab === 'Executives' && (
               <div className="space-y-6">
                  <h2 className="text-xl font-black text-slate-900 px-4">임원진 프로필 관리</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {executives.map(e => (
                        <div key={e.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group space-y-4 hover:shadow-md transition-all">
                           <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditModal(e)} className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg hover:bg-slate-800 transition-colors">EDIT</button>
                              <button onClick={() => handleRemoveExecutive(e)} className="px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 text-[10px] font-black rounded-lg transition-colors">DELETE</button>
                           </div>

                           <div className="flex items-center gap-6 mb-4">
                              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50 shrink-0">
                                 <img src={getImageUrl(e.imageUrl, e.name)} className="w-full h-full object-cover" alt={e.name} referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex-grow space-y-1">
                                 <input type="text" className="w-full bg-transparent border-none p-0 text-sm font-black outline-none" value={e.name} readOnly />
                                 <input type="text" className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-500 outline-none" value={e.role} readOnly />
                              </div>
                           </div>
                           <div className="space-y-3 pt-2">
                              <div className="bg-slate-50 p-4 rounded-2xl">
                                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Introduction</div>
                                 <p className="text-xs font-medium text-slate-600 leading-relaxed">{e.intro}</p>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* 콘텐츠 승인 탭 */}
            {tab === 'Content' && (
               <div className="space-y-6">
                  <h2 className="text-xl font-black text-slate-900 px-4">생활 정보 승인 대기 목록</h2>
                  {/* 카드가 너무 넓지 않게 그리드 분할 적용 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {pendingInfos.length > 0 ? pendingInfos.map(post => (
                        <div
                           key={post.id}
                           onClick={() => navigate(`/info/${post.id}`)}
                           className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        >
                           <div className="space-y-4 w-full">
                              <div className="flex flex-wrap items-center gap-2">
                                 <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-lg">{post.category || 'INFO'}</span>
                                 {post.schoolTag && <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded-lg">{post.schoolTag}</span>}
                              </div>
                              <h3 className="font-black text-slate-900 text-lg group-hover:text-slate-600 transition-colors line-clamp-1">{post.title}</h3>

                              <div className="bg-slate-50 rounded-2xl p-4">
                                 <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-medium">
                                    {post.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')}
                                 </p>
                              </div>

                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                 <span>BY <span className="text-slate-700">{post.writer || 'Unknown'}</span></span>
                                 <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                 <span>{formatDate(post.regDate)}</span>
                              </div>
                           </div>
                           <div className="flex w-full justify-end pt-4 border-t border-slate-50">
                              <span className="text-xs font-black text-slate-300 group-hover:text-slate-900 transition-colors flex items-center gap-2">
                                 심사하기 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                              </span>
                           </div>
                        </div>
                     )) : (
                        <div className="col-span-full py-24 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                           <div className="text-4xl mb-4">🎉</div>
                           <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No pending requests</p>
                           <p className="text-slate-300 text-xs mt-2 font-medium">모든 콘텐츠가 처리되었습니다.</p>
                        </div>
                     )}
                  </div>
               </div>
            )}
         </main>

         {/* ★ 모달: 임원 등록 및 수정 (파일 업로드 UI 적용) */}
         {isModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
               <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
               <form onSubmit={handleModalSubmit} className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                  <h3 className="text-xl font-black text-slate-900">{modalMode === 'PROMOTE' ? '🎓 임원 등록' : '✏️ 정보 수정'}</h3>
                  
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl"><div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Name</div><div className="font-bold text-sm">{formData.name}</div></div>
                        <div className="bg-slate-50 p-3 rounded-xl"><div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">School</div><div className="font-bold text-sm">{formData.school}</div></div>
                     </div>
                     
                     <input value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} placeholder="직책 (예: 회장)" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 ring-slate-900/20 transition-all" required />
                     
                     {/* 이미지 업로드 & 미리보기 영역 */}
                     <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="w-16 h-16 rounded-full border-2 border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center text-slate-300">
                           {previewUrl ? (
                              <img src={getImageUrl(previewUrl, formData.name)} alt="Preview" className="w-full h-full object-cover" />
                           ) : (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                           )}
                        </div>
                        <div className="flex-1">
                           <label className="block text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Profile Image</label>
                           <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleFileChange} 
                              className="w-full text-xs font-medium text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 transition-all cursor-pointer"
                           />
                        </div>
                     </div>

                     <textarea value={formData.intro} onChange={e => setFormData({ ...formData, intro: e.target.value })} placeholder="소개글" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-medium h-24 resize-none outline-none focus:ring-2 ring-slate-900/20 transition-all" required />
                  </div>

                  <div className="flex gap-3 mt-8">
                     <button type="button" disabled={isSubmitting} onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-50">취소</button>
                     <button type="submit" disabled={isSubmitting} className="flex-1 py-3.5 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all flex justify-center items-center gap-2">
                        {isSubmitting ? (
                           <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              업로드 중...
                           </>
                        ) : '저장'}
                     </button>
                  </div>
               </form>
            </div>
         )}

         {/* 회원 상세 조회 모달 */}
         {selectedUser && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
               <div
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                  onClick={() => setSelectedUser(null)}
               ></div>

               <div className="relative bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95 duration-200">

                  {/* 헤더 */}
                  <div className="flex justify-between items-start">
                     <div>
                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-2 block">
                           {selectedUser.role} Profile
                        </span>
                        <h3 className="text-3xl font-black text-slate-950">
                           {selectedUser.name}
                        </h3>
                     </div>

                     <button
                        onClick={() => setSelectedUser(null)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                     >
                        <svg
                           className="w-6 h-6"
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M6 18L18 6M6 6l12 12"
                           />
                        </svg>
                     </button>
                  </div>

                  {/* 상세 정보 */}
                  <div className="space-y-4 pt-6 border-t border-slate-50">

                     {/* 기본 정보들 */}
                     {[
                        { label: 'Username', value: selectedUser.username },
                        { label: 'Email', value: selectedUser.email },
                        { label: 'Birth Date', value: formatDate(selectedUser.birthDate) },
                        { label: 'School', value: selectedUser.school },
                        { label: 'Degree', value: selectedUser.degreeLevel || '-' },
                        { label: 'Joined', value: formatDate(selectedUser.joinDate) },
                     ].map((item, idx) => (
                        <div
                           key={idx}
                           className="flex justify-between py-2 border-b border-slate-50 last:border-0"
                        >
                           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                              {item.label}
                           </span>
                           <span className="text-sm font-bold text-slate-800 text-right max-w-[60%] break-words">
                              {item.value || '-'}
                           </span>
                        </div>
                     ))}

                     {/* 전공 Badge 스타일 */}
                     <div className="flex justify-between items-start py-2 border-b border-slate-50">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                           Major(s)
                        </span>

                        <div className="flex flex-wrap gap-2 justify-end max-w-[60%]">
                           {[selectedUser.major1, selectedUser.major2, selectedUser.major3]
                              .filter(Boolean)
                              .length > 0 ? (
                              [selectedUser.major1, selectedUser.major2, selectedUser.major3]
                                 .filter(Boolean)
                                 .map((major, i) => (
                                    <span
                                       key={i}
                                       className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold"
                                    >
                                       {major}
                                    </span>
                                 ))
                           ) : (
                              <span className="text-sm font-bold text-slate-400">-</span>
                           )}
                        </div>
                     </div>

                  </div>

                  {/* 닫기 버튼 */}
                  <button
                     onClick={() => setSelectedUser(null)}
                     className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-transform active:scale-95"
                  >
                     Close Profile
                  </button>
               </div>
            </div>
         )}
      </div>
   );
};

export default AdminDashboard;
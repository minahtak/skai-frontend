import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { api } from '../api';
import { User } from '../types';

interface InfoFormProps {
    user: User | null;
}

// ★ 공지사항과 동일하게 들여쓰기(indent) 등 툴바 옵션 추가
const modules = {
    toolbar: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['link', 'image'],
        [{ 'color': [] }, { 'background': [] }],
        ['clean']
    ],
};

// ★ Formats 배열 추가 (NoticeForm과 동일)
const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list',
    'indent',
    'link', 'image', 'color', 'background'
];

const InfoForm: React.FC<InfoFormProps> = ({ user }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState({
        title: '',
        category: 'LIFE',
        schoolTag: 'ALL',
        targetTag: '',
        content: ''
    });

    // 수정 시 데이터 로드
    useEffect(() => {
        if (isEditMode && id) {
            const fetchInfo = async () => {
                try {
                    const data = await api.getInfoDetail(id);

                    if (data) {
                        // ★ 이전 상태(prev)를 기반으로 확실하게 덮어씌워 줍니다.
                        setFormData(prev => ({
                            ...prev,
                            title: data.title || '',
                            category: data.category || 'LIFE',
                            schoolTag: data.schoolTag || 'ALL',
                            targetTag: data.targetTag || '',
                            content: data.content || ''
                        }));
                    }
                } catch (error) {
                    console.error("데이터를 불러오는 중 오류 발생:", error);
                }
            };
            fetchInfo();
        }
    }, [id, isEditMode]);

    const handleContentChange = (value: string) => {
        setFormData({ ...formData, content: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const plainText = formData.content.replace(/<[^>]+>/g, '').trim();

        if (!formData.title.trim()) return alert("제목을 입력해주세요.");
        if (plainText.length === 0) return alert("내용을 입력해주세요.");

        let success = false;
        try {
            if (isEditMode && id) {
                success = await api.updateInfo(id, formData);
                if (success) alert("수정되었습니다.");
            } else {
                success = await api.createInfo(formData);
                if (success) alert("등록되었습니다.");
            }

            if (success) navigate('/info');
            else alert("처리 중 오류가 발생했습니다.");

        } catch (error) {
            alert("서버 오류가 발생했습니다.");
        }
    };

    return (
        <>
            {/* ★ 봇 수집 거부 및 브라우저 탭 제목만 변경 */}
            <Helmet>
                <title>{isEditMode ? '정보 수정' : '정보 공유'} | SKAI</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="bg-white p-8 md:p-14 rounded-[3rem] border border-slate-100 shadow-xl space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center space-y-2 mb-8">
                        <h1 className="text-3xl font-black text-slate-900">
                            {isEditMode ? '정보 수정' : '정보 공유'}
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 설정 영역 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-[2rem]">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">카테고리</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-white px-4 py-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 appearance-none"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="LIFE">주거/생활 (Life)</option>
                                        <option value="FOOD">맛집/음식 (Food)</option>
                                        <option value="TRAVEL">여행 (Travel)</option>
                                        <option value="JOB">인턴/취업 (Jobs)</option>
                                        <option value="SCHOOL">학교별 정보 (School)</option>
                                        <option value="FAQ">FAQ/꿀팁</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">관련 학교</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-white px-4 py-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 appearance-none"
                                        value={formData.schoolTag}
                                        onChange={e => setFormData({ ...formData, schoolTag: e.target.value })}
                                    >
                                        <option value="ALL">전체 (All)</option>
                                        <option value="HebrewU">히브리대</option>
                                        <option value="TelAviv">텔아비브대</option>
                                        <option value="Technion">테크니온</option>
                                        <option value="BarIlan">바일란대</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">제목</label>
                            <input
                                type="text"
                                placeholder="제목을 입력하세요"
                                className="w-full bg-slate-50 px-6 py-4 rounded-2xl text-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">내용</label>
                            <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200">
                                {/* ★ formats 속성 추가 및 onChange 핸들러 분리 적용 */}
                                <ReactQuill
                                    theme="snow"
                                    value={formData.content}
                                    onChange={handleContentChange}
                                    modules={modules}
                                    formats={formats}
                                    style={{ height: '400px' }}
                                />
                            </div>
                            <div className="h-10 md:h-0"></div>
                        </div>

                        <div className="flex justify-end gap-3 pt-8 border-t border-slate-50">
                            <button
                                type="button"
                                onClick={() => navigate('/info')}
                                className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black text-xs hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                {isEditMode ? '수정 완료' : '정보 등록'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default InfoForm;
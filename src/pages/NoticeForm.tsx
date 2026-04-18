import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new'; // ★ 에디터 불러오기
import 'react-quill-new/dist/quill.snow.css'; // ★ 스타일 불러오기
import { api } from '../api';
import { User } from '../types';

interface NoticeFormProps {
    user: User | null;
}

// ★ 에디터 툴바 설정 (제목, 굵게, 색상, 링크, 이미지 등)
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

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list',
    'indent',
    'link', 'image', 'color', 'background'
];

const NoticeForm: React.FC<NoticeFormProps> = ({ user }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState({
        title: '',
        category: 'Official',
        customCategory: '', // 분류 직접 입력값
        targetSchool: 'All',
        customTargetSchool: '', // 학교 직접 입력값
        content: '',
        pinned: false
    });

    // 수정 시 데이터 불러오기
    useEffect(() => {
        if (isEditMode && id) {
            const fetchNotice = async () => {
                const data = await api.getNoticeDetail(Number(id));
                if (data) {
                    // ★ 기본 옵션 목록 정의
                    const defaultSchools = ['All', '히브리대', '텔아비브대', '테크니온', '바일란대'];
                    const defaultCategories = ['Official', 'Event', 'Visa'];

                    // ★ 백엔드 값이 기본 옵션에 없으면 '기타(Etc)'로 간주
                    const isCustomSchool = !defaultSchools.includes(data.targetSchool);
                    const isCustomCategory = !defaultCategories.includes(data.category);

                    setFormData({
                        title: data.title,
                        category: isCustomCategory ? 'Etc' : data.category,
                        customCategory: isCustomCategory ? data.category : '', // 직접 입력 칸에 기존 값 세팅
                        targetSchool: isCustomSchool ? '기타' : data.targetSchool,
                        customTargetSchool: isCustomSchool ? data.targetSchool : '', // 직접 입력 칸에 기존 값 세팅
                        content: data.content,
                        pinned: data.pinned || false
                    });
                }
            };
            fetchNotice();
        }
    }, [id, isEditMode]);

    // ★ 내용 변경 핸들러 (Quill용)
    const handleContentChange = (value: string) => {
        setFormData({ ...formData, content: value });
    };

    // 저장 함수
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사 (HTML 태그 제거하고 비어있는지 체크)
        const plainText = formData.content.replace(/<[^>]+>/g, '').trim();

        // ★ 최종적으로 보낼 값 결정
        const finalSchool = formData.targetSchool === '기타' ? formData.customTargetSchool.trim() : formData.targetSchool;
        const finalCategory = formData.category === 'Etc' ? formData.customCategory.trim() : formData.category;

        if (!formData.title.trim()) return alert("제목을 입력해주세요.");
        if (plainText.length === 0) return alert("내용을 입력해주세요.");
        if (formData.targetSchool === '기타' && !finalSchool) return alert("대상 학교를 직접 입력해주세요.");
        if (formData.category === 'Etc' && !finalCategory) return alert("분류를 직접 입력해주세요.");

        let success = false;
        try {
            // ★ 백엔드 DTO(NoticeFormDto) 형식에 맞게 데이터 변환  
            const payload = {
                title: formData.title,
                content: formData.content,
                category: finalCategory,      
                targetSchool: finalSchool,    
                isPinned: formData.pinned
            };

            if (isEditMode && id) {
                success = await api.updateNotice(Number(id), payload);
                if (success) alert("수정되었습니다.");
            } else {
                success = await api.createNotice(payload);
                if (success) alert("등록되었습니다.");
            }

            if (success) navigate('/notice');
            else alert("처리에 실패했습니다. (권한 확인)");

        } catch (error) {
            alert("서버 오류가 발생했습니다.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12">
            <div className="bg-white p-10 md:p-14 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">

                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-3xl font-black text-slate-900">
                        {isEditMode ? '공지사항 수정' : '공지사항 작성'}
                    </h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">

                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* 설정 영역 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-[2rem]">
                        {/* 설정 영역 내부 대상 학교 & 분류 부분 교체 */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">대상 학교</label>
                            <select
                                className="w-full bg-white px-4 py-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                value={formData.targetSchool}
                                onChange={e => setFormData({ ...formData, targetSchool: e.target.value })}
                            >
                                <option value="All">전체</option>
                                <option value="히브리대">히브리대</option>
                                <option value="텔아비브대">텔아비브대</option>
                                <option value="테크니온">테크니온</option>
                                <option value="바일란대">바일란대</option>
                                <option value="기타">기타 (직접 입력)</option>
                            </select>

                            {/* ★ 대상 학교 '기타' 선택 시 나타나는 입력창 */}
                            {formData.targetSchool === '기타' && (
                                <input
                                    type="text"
                                    placeholder="학교 이름을 입력하세요"
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 animate-in fade-in slide-in-from-top-2"
                                    value={formData.customTargetSchool}
                                    onChange={e => setFormData({ ...formData, customTargetSchool: e.target.value })}
                                />
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">분류</label>
                            <select
                                className="w-full bg-white px-4 py-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="공지">공지</option>
                                <option value="행사">행사</option>
                                <option value="비자">비자</option>
                                <option value="긴급">긴급</option>
                                <option value="Etc">기타 (직접 입력)</option>
                            </select>

                            {/* ★ 분류 'Etc' 선택 시 나타나는 입력창 */}
                            {formData.category === 'Etc' && (
                                <input
                                    type="text"
                                    placeholder="분류를 입력하세요"
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 animate-in fade-in slide-in-from-top-2"
                                    value={formData.customCategory}
                                    onChange={e => setFormData({ ...formData, customCategory: e.target.value })}
                                />
                            )}
                        </div>

                        <div className="flex items-center p-2 pt-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 accent-red-500 rounded cursor-pointer"
                                    checked={formData.pinned}
                                    onChange={e => setFormData({ ...formData, pinned: e.target.checked })}
                                />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-red-500 transition-colors">
                                    상단 고정
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* 제목 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">제목</label>
                        <input
                            type="text"
                            placeholder="제목을 입력하세요"
                            className="w-full bg-slate-50 px-6 py-4 rounded-2xl text-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* ★ React Quill 에디터 적용 영역 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">내용</label>
                        <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200">
                            <ReactQuill
                                theme="snow"
                                value={formData.content}
                                onChange={handleContentChange}
                                modules={modules}
                                formats={formats}
                                style={{ height: '400px' }} // 에디터 높이 설정
                            />
                        </div>
                        {/* 에디터 툴바 공간 때문에 약간의 여백 추가 */}
                        <div className="h-10 md:h-0"></div>
                    </div>

                    {/* 버튼 */}
                    <div className="flex justify-end gap-3 pt-8">
                        <button
                            type="button"
                            onClick={() => navigate('/notice')}
                            className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black text-xs hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            {isEditMode ? '수정 완료' : '공지 등록'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default NoticeForm;
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import imageCompression from 'browser-image-compression'; 
import { api } from '../api';
import { User } from '../types';

interface NoticeFormProps {
    user: User | null;
}

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
    
    // TypeScript 네임스페이스 에러 우회를 위해 any 타입 적용
    const quillRef = useRef<any>(null); 

    const [formData, setFormData] = useState({
        title: '',
        category: 'Official',
        customCategory: '',
        targetSchool: 'All',
        customTargetSchool: '',
        content: '',
        pinned: false
    });

    useEffect(() => {
        if (isEditMode && id) {
            const fetchNotice = async () => {
                const data = await api.getNoticeDetail(Number(id));
                if (data) {
                    const defaultSchools = ['All', '히브리대', '텔아비브대', '테크니온', '바일란대'];
                    const defaultCategories = ['Official', 'Event', 'Visa'];

                    const isCustomSchool = !defaultSchools.includes(data.targetSchool);
                    const isCustomCategory = !defaultCategories.includes(data.category);

                    setFormData({
                        title: data.title,
                        category: isCustomCategory ? 'Etc' : data.category,
                        customCategory: isCustomCategory ? data.category : '',
                        targetSchool: isCustomSchool ? '기타' : data.targetSchool,
                        customTargetSchool: isCustomSchool ? data.targetSchool : '',
                        content: data.content,
                        pinned: data.pinned || false
                    });
                }
            };
            fetchNotice();
        }
    }, [id, isEditMode]);

    // ★ modules와 imageHandler를 하나로 묶어 클로저 및 초기화 문제 완벽 해결
    const modules = useMemo(() => {
        const imageHandler = () => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();

            input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;

                const options = {
                    maxSizeMB: 0.2, 
                    maxWidthOrHeight: 1280,
                    useWebWorker: true,
                };
                
                let uploadFile = file;
                try {
                    uploadFile = await imageCompression(file, options);
                } catch (err) {
                    console.error("압축 실패, 원본 사용", err);
                }

                try {
                    const presignedData = await api.getPresignedUrl(uploadFile.name, uploadFile.type);
                    if (!presignedData) throw new Error("업로드 URL 발급 실패");

                    const success = await api.uploadImageToR2(presignedData.uploadUrl, uploadFile);
                    if (!success) throw new Error("이미지 업로드 실패");

                    const modifiedUrl = presignedData.fileUrl.replace(/https:\/\/pub-[^/]+\.r2\.dev/g, 'https://cdn.skaisrael.com');

                    const editor = quillRef.current?.getEditor();
                    if (editor) {
                        const range = editor.getSelection();
                        // 현재 커서 위치가 있으면 거기에 넣고, 없으면 본문 맨 끝에 삽입
                        const index = range ? range.index : editor.getLength();
                        editor.insertEmbed(index, 'image', modifiedUrl);
                        editor.setSelection(index + 1); 
                    }
                } catch (error) {
                    console.error("에디터 이미지 업로드 실패:", error);
                    alert("이미지 업로드 중 오류가 발생했습니다.");
                }
            };
        };

        return {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, false] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                    ['link', 'image'],
                    [{ 'color': [] }, { 'background': [] }],
                    ['clean']
                ],
                handlers: {
                    image: imageHandler 
                }
            }
        };
    }, []);

    const handleContentChange = (value: string) => {
        setFormData({ ...formData, content: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const plainText = formData.content.replace(/<[^>]+>/g, '').trim();
        const finalSchool = formData.targetSchool === '기타' ? formData.customTargetSchool.trim() : formData.targetSchool;
        const finalCategory = formData.category === 'Etc' ? formData.customCategory.trim() : formData.category;

        if (!formData.title.trim()) return alert("제목을 입력해주세요.");
        if (plainText.length === 0 && !formData.content.includes('<img')) return alert("내용을 입력해주세요."); 
        
        // ★ [핵심 추가] 실수로 복사/붙여넣기나 드래그로 Base64 데이터가 들어간 경우 서버 전송 전 차단
        if (formData.content.includes('data:image/')) {
            return alert("이미지가 서버에 정상 업로드되지 않고 본문에 거대하게 임시 삽입되었습니다. 이미지를 지우고 상단 툴바의 이미지 아이콘을 눌러 다시 추가해주세요. (드래그 앤 드롭이나 복사 붙여넣기는 지원하지 않습니다.)");
        }

        if (formData.targetSchool === '기타' && !finalSchool) return alert("대상 학교를 직접 입력해주세요.");
        if (formData.category === 'Etc' && !finalCategory) return alert("분류를 직접 입력해주세요.");

        let success = false;
        try {
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
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 설정 영역 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-[2rem]">
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

                            {formData.targetSchool === '기타' && (
                                <input
                                    type="text"
                                    placeholder="학교 이름을 입력하세요"
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
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

                            {formData.category === 'Etc' && (
                                <input
                                    type="text"
                                    placeholder="분류를 입력하세요"
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
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

                    {/* 제목 영역 */}
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

                    {/* 에디터 영역 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">내용</label>
                        <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200">
                            <ReactQuill
                                ref={quillRef} 
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

                    {/* 버튼 영역 */}
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
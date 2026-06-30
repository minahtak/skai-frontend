import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import imageCompression from 'browser-image-compression'; // ★ 이미지 압축 모듈 추가
import { api } from '../api';
import { User } from '../types';

interface InfoFormProps {
    user: User | null;
}

// Formats 배열
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
    
    // ★ 에디터 객체 접근용 Ref 추가 (타입 에러 방지용 any)
    const quillRef = useRef<any>(null); 

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

    // ★ 커스텀 이미지 핸들러와 모듈 설정을 하나로 묶어 적용
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

        if (!formData.title.trim()) return alert("제목을 입력해주세요.");
        // ★ 이미지만 있는 게시글도 허용하도록 조건 수정
        if (plainText.length === 0 && !formData.content.includes('<img')) return alert("내용을 입력해주세요.");

        // ★ Base64 데이터(드래그/복붙) 전송 원천 차단 로직 추가
        if (formData.content.includes('data:image/')) {
            return alert("이미지가 서버에 정상 업로드되지 않고 본문에 거대하게 임시 삽입되었습니다. 이미지를 지우고 상단 툴바의 이미지 아이콘을 눌러 다시 추가해주세요. (드래그 앤 드롭이나 복사 붙여넣기는 지원하지 않습니다.)");
        }

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
                                <ReactQuill
                                    ref={quillRef} // ★ 참조 연결
                                    theme="snow"
                                    value={formData.content}
                                    onChange={handleContentChange}
                                    modules={modules} // ★ 업데이트된 modules 연결
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
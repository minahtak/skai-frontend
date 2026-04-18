import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { api } from '../api';

const GalleryForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // URL에서 id 가져오기 (있으면 수정 모드)
    const isEditMode = !!id;    // id가 존재하면 true

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    
    // 기존에 업로드되어 있던 이미지 URL들 (수정 모드용)
    const [existingImages, setExistingImages] = useState<string[]>([]);
    
    // 새로 추가할 파일들
    const [newFiles, setNewFiles] = useState<File[]>([]);
    
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState('');

    // ★ 초기 데이터 로드 (수정 모드일 때만)
    useEffect(() => {
        if (isEditMode) {
            const loadData = async () => {
                const data = await api.getGalleryDetail(Number(id));
                if (data) {
                    setTitle(data.title);
                    setContent(data.content);
                    // 콤마로 된 문자열이거나 배열일 수 있음. 안전하게 배열로 변환
                    if (data.images && Array.isArray(data.images)) {
                        setExistingImages(data.images);
                    } else if (data.imageUrls) {
                        setExistingImages(data.imageUrls.split(','));
                    }
                } else {
                    alert("데이터를 불러올 수 없습니다.");
                    navigate('/gallery');
                }
            };
            loadData();
        }
    }, [id, isEditMode, navigate]);

    // 새 파일 선택 핸들러 (PNG, JPG 등 모든 이미지 허용으로 복구)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // 제한 없이 선택된 모든 이미지 파일 추가
            setNewFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
        }
    };

    // 기존 이미지 삭제 핸들러
    const removeExistingImage = (indexToRemove: number) => {
        setExistingImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    // 새 파일 선택 취소 핸들러
    const removeNewFile = (indexToRemove: number) => {
        setNewFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사: 제목 필수, 이미지는 (기존 거 + 새 거) 합쳐서 최소 1장
        if (!title.trim()) return alert("제목을 입력해주세요.");
        if (existingImages.length === 0 && newFiles.length === 0) {
            return alert("사진을 최소 1장 이상 등록해주세요.");
        }

        setIsUploading(true);
        
        try {
            const newUploadedUrls: string[] = [];
            let count = 1;

            // 1. 새 파일이 있다면 압축 후 R2 업로드
            if (newFiles.length > 0) {
                for (const file of newFiles) {
                    setProgress(`새 사진 ${count} / ${newFiles.length}장 업로드 중...`);

                    const options = {
                        maxSizeMB: 0.1, // 100KB
                        maxWidthOrHeight: 1280,
                        useWebWorker: true,
                        // fileType 옵션 제거: 원본 확장자(PNG, WEBP 등)를 그대로 유지합니다.
                    };
                    
                    let uploadFile = file;
                    try {
                        uploadFile = await imageCompression(file, options);
                    } catch (err) {
                        console.error("압축 실패, 원본 사용", err);
                    }

                    // 💡 핵심 변경: 백엔드로 파일 이름과 함께 파일 타입(MIME Type)도 전송!
                    const presignedData = await api.getPresignedUrl(uploadFile.name, uploadFile.type);
                    if (!presignedData) throw new Error("업로드 URL 발급 실패");

                    const success = await api.uploadImageToR2(presignedData.uploadUrl, uploadFile);
                    if (!success) throw new Error("이미지 업로드 실패");

                    newUploadedUrls.push(presignedData.fileUrl);
                    count++;
                }
            }

            setProgress('저장 중...');

            // 2. 최종 이미지 리스트 = (삭제 안 된 기존 이미지) + (새로 업로드된 이미지)
            const finalImageUrls = [...existingImages, ...newUploadedUrls];

            // 3. 백엔드 전송 데이터 구성
            const payload = {
                title,
                content,
                // 백엔드 DTO가 googleDriveLinks라는 이름으로 List<String>을 받음
                googleDriveLinks: finalImageUrls 
            };

            let result;
            if (isEditMode) {
                // 수정 API 호출
                result = await api.updateGallery(Number(id), payload);
            } else {
                // 생성 API 호출
                result = await api.createGallery(payload);
            }

            if (result) {
                alert(isEditMode ? "수정되었습니다!" : "업로드가 완료되었습니다!");
                navigate('/gallery');
            } else {
                alert("저장에 실패했습니다.");
            }

        } catch (error) {
            console.error(error);
            alert("처리 중 오류가 발생했습니다.");
        } finally {
            setIsUploading(false);
            setProgress('');
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-black text-slate-900 mb-8">
                {isEditMode ? '사진 수정' : '사진 업로드'}
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div>
                    {/* 제목 옆 빨간색 별표 유지 */}
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        제목 <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                        placeholder="제목을 입력하세요"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">설명</label>
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
                        placeholder="사진에 대한 설명을 입력하세요"
                    />
                </div>

                <div>
                    {/* 사진 관리 옆 빨간색 별표 유지 */}
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        사진 관리 <span className="text-red-500">*</span>
                    </label>
                    
                    {/* 기존 이미지 목록 (수정 모드일 때) */}
                    {existingImages.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs font-bold text-slate-500 mb-2">기존 사진 ({existingImages.length}장)</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {existingImages.map((url, idx) => (
                                    <div key={idx} className="relative w-20 h-20 flex-shrink-0">
                                        <img src={url} alt="existing" className="w-full h-full object-cover rounded-lg border border-slate-200" />
                                        <button 
                                            type="button"
                                            onClick={() => removeExistingImage(idx)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 모든 이미지 형식을 허용하도록 accept="image/*" 복구 */}
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                    />
                    
                    {/* 새 파일 미리보기 */}
                    {newFiles.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs font-bold text-indigo-500 mb-2">새로 추가할 사진 ({newFiles.length}장)</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {newFiles.map((f, i) => (
                                    <div key={i} className="relative w-20 h-20 flex-shrink-0">
                                        <img src={URL.createObjectURL(f)} alt="preview" className="w-full h-full object-cover rounded-lg border border-indigo-100" />
                                        <button 
                                            type="button"
                                            onClick={() => removeNewFile(i)}
                                            className="absolute -top-2 -right-2 bg-slate-500 text-white rounded-full p-1 shadow-md hover:bg-slate-600 transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* 업로드 가능 확장자 명시(JPG 전용 문구) 제거 */}
                    <p className="text-xs text-slate-400 mt-2">
                        ※ 새 이미지는 100KB 이하로 자동 압축됩니다.
                    </p>
                </div>

                <button 
                    type="submit" 
                    disabled={isUploading}
                    className={`w-full py-4 rounded-xl font-black text-white text-lg transition-all shadow-lg ${isUploading ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 hover:shadow-xl '}`}
                >
                    {isUploading ? progress : (isEditMode ? '수정 완료' : '등록하기')}
                </button>
            </form>
        </div>
    );
};

export default GalleryForm;
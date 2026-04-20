import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { api } from '../api';

const GalleryForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState('');

    // ★ 추가된 부분: 기존 이미지 URL 변환 (수정 모드 엑스박스 방지용)
    const formatImageUrl = (url?: string) => {
        if (!url) return '';
        return url.replace(/https:\/\/pub-[^/]+\.r2\.dev/g, 'https://cdn.skaisrael.com');
    };

    useEffect(() => {
        if (isEditMode) {
            const loadData = async () => {
                const data = await api.getGalleryDetail(Number(id));
                if (data) {
                    setTitle(data.title);
                    setContent(data.content);
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
        }
    };

    const removeExistingImage = (indexToRemove: number) => {
        setExistingImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const removeNewFile = (indexToRemove: number) => {
        setNewFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) return alert("제목을 입력해주세요.");
        if (existingImages.length === 0 && newFiles.length === 0) {
            return alert("사진을 최소 1장 이상 등록해주세요.");
        }

        setIsUploading(true);
        
        try {
            const newUploadedUrls: string[] = [];
            let count = 1;

            if (newFiles.length > 0) {
                for (const file of newFiles) {
                    setProgress(`새 사진 ${count} / ${newFiles.length}장 업로드 중...`);

                    const options = {
                        maxSizeMB: 0.1, 
                        maxWidthOrHeight: 1280,
                        useWebWorker: true,
                    };
                    
                    let uploadFile = file;
                    try {
                        uploadFile = await imageCompression(file, options);
                    } catch (err) {
                        console.error("압축 실패, 원본 사용", err);
                    }

                    const presignedData = await api.getPresignedUrl(uploadFile.name, uploadFile.type);
                    if (!presignedData) throw new Error("업로드 URL 발급 실패");

                    const success = await api.uploadImageToR2(presignedData.uploadUrl, uploadFile);
                    if (!success) throw new Error("이미지 업로드 실패");

                    // ★ 추가된 부분: 백엔드에서 받은 기본 R2 주소를 CDN 주소로 강제 치환해서 DB로 보냄
                    const modifiedUrl = presignedData.fileUrl.replace(/https:\/\/pub-[^/]+\.r2\.dev/g, 'https://cdn.skaisrael.com');
                    newUploadedUrls.push(modifiedUrl);
                    count++;
                }
            }

            setProgress('저장 중...');

            const finalImageUrls = [...existingImages, ...newUploadedUrls];

            const payload = {
                title,
                content,
                googleDriveLinks: finalImageUrls 
            };

            let result;
            if (isEditMode) {
                result = await api.updateGallery(Number(id), payload);
            } else {
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
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        사진 관리 <span className="text-red-500">*</span>
                    </label>
                    
                    {existingImages.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs font-bold text-slate-500 mb-2">기존 사진 ({existingImages.length}장)</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {existingImages.map((url, idx) => (
                                    <div key={idx} className="relative w-20 h-20 flex-shrink-0">
                                        {/* ★ 수정된 부분: 엑스박스 방지용 formatImageUrl 적용 */}
                                        <img src={formatImageUrl(url)} alt="existing" className="w-full h-full object-cover rounded-lg border border-slate-200" />
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

                    <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                    />
                    
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
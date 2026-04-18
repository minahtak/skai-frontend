import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api'; // 기존에 정의한 api 객체 사용

const MaterialForm: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // URL에서 ID 추출 (수정 모드 체크)
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    school: '히브리대',
    major: '국제관계학',
    subject: '',
    professor: '',
    category: '필기 노트',
    language: '한국어',
    content: '',
    writer: '',
    googleDriveLink: '', // 구글 폼의 '자료 파일' 항목을 대체
  });

  // '기타' 선택 시 직접 입력을 받기 위한 상태
  const [customInputs, setCustomInputs] = useState({
    school: '',
    major: '',
    category: ''
  });

  const [isLoading, setIsLoading] = useState(!!id);

  // 1. 수정 모드일 경우 기존 데이터 불러오기
  useEffect(() => {
    if (id) {
      api.getMaterialDetail(id).then(data => {
        if (data) {
          // 불러온 데이터가 기본 옵션에 없는 '기타' 값일 경우 처리
          const isCustomSchool = !['히브리대', '텔아비브대', '테크니온', '하이파', '공통'].includes(data.school);
          const isCustomMajor = !['국제관계학', '정치학', '중동학', '히브리어', '성서학', '고고학', '경영학', '경제학'].includes(data.major);
          const isCustomCategory = !['필기 노트', '요약본 (סיכום)', '기출문제', '수업 자료'].includes(data.category);

          setFormData({ 
            ...data,
            school: isCustomSchool ? '기타' : data.school,
            major: isCustomMajor ? '기타' : data.major,
            category: isCustomCategory ? '기타' : data.category,
            writer: data.writer === '익명' ? '' : data.writer // '익명'이면 입력창은 비워둠
          });

          setCustomInputs({
            school: isCustomSchool ? data.school : '',
            major: isCustomMajor ? data.major : '',
            category: isCustomCategory ? data.category : ''
          });
        }
        setIsLoading(false);
      });
    }
  }, [id]);

  // 2. 폼 제출 로직
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 최종 제출 데이터 조립 (기타 항목 및 익명 처리)
    const finalData = {
      ...formData,
      school: formData.school === '기타' ? customInputs.school : formData.school,
      major: formData.major === '기타' ? customInputs.major : formData.major,
      category: formData.category === '기타' ? customInputs.category : formData.category,
      writer: formData.writer.trim() === '' ? '익명' : formData.writer.trim(), // 비워두면 익명 처리
    };

    // 필수값 검증 (구글 폼 기준 별표(*) 항목들)
    if (!finalData.title || !finalData.school || !finalData.major || !finalData.subject || !finalData.category || !finalData.language || !finalData.googleDriveLink) {
      alert('필수 정보(*)를 모두 입력해주세요.');
      return;
    }

    try {
      let success;
      if (id) {
        success = await api.updateMaterial(Number(id), finalData);
      } else {
        success = await api.createMaterial(finalData);
      }

      if (success) {
        alert(id ? '자료가 수정되었습니다.' : '자료가 등록되었습니다.');
        navigate('/material');
      } else {
        alert('저장에 실패했습니다. 권한이 없거나 서버 오류입니다.');
      }
    } catch (err) {
      console.error(err);
      alert('통신 중 에러가 발생했습니다.');
    }
  };

  if (isLoading) {
    return <div className="p-20 text-center font-black text-slate-400">자료 정보를 불러오는 중...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-10 md:p-14">
        
        <div className="mb-10 border-b border-slate-100 pb-6">
          <h2 className="text-3xl font-black text-slate-900">
            {id ? '자료 수정' : '자료 등록'}
          </h2>
          <p className="text-slate-500 font-medium mt-2">수집된 구글 폼의 정보를 바탕으로 자료를 입력해주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. 자료 제목 */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">자료 제목 <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="예: 히브리대 거시경제 중간고사 요약"
              className="w-full p-3 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <hr className="border-slate-50" />

          {/* 2. 학교 & 전공 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-2">학교 <span className="text-red-500">*</span></label>
              <select 
                value={formData.school} 
                onChange={e => setFormData({...formData, school: e.target.value})}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="히브리대">히브리대</option>
                <option value="텔아비브대">텔아비브대</option>
                <option value="테크니온">테크니온</option>
                <option value="바일란대">바일란대</option>
                <option value="공통">공통</option>
                <option value="기타">기타 (직접 입력)</option>
              </select>
              {formData.school === '기타' && (
                <input 
                  type="text" 
                  required
                  value={customInputs.school}
                  onChange={e => setCustomInputs({...customInputs, school: e.target.value})}
                  placeholder="학교를 직접 입력하세요"
                  className="w-full mt-2 p-3 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-2">전공 <span className="text-red-500">*</span></label>
              <select 
                value={formData.major} 
                onChange={e => setFormData({...formData, major: e.target.value})}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="국제관계학">국제관계학</option>
                <option value="정치학">정치학</option>
                <option value="중동학">중동학</option>
                <option value="히브리어">히브리어</option>
                <option value="성서학">성서학</option>
                <option value="고고학">고고학</option>
                <option value="경영학">경영학</option>
                <option value="경제학">경제학</option>
                <option value="기타">기타 (직접 입력)</option>
              </select>
              {formData.major === '기타' && (
                <input 
                  type="text" 
                  required
                  value={customInputs.major}
                  onChange={e => setCustomInputs({...customInputs, major: e.target.value})}
                  placeholder="전공을 직접 입력하세요"
                  className="w-full mt-2 p-3 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              )}
            </div>
          </div>

          {/* 3. 과목명 & 교수님 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-2">과목명 <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                placeholder="예: Intro to CS"
                className="w-full p-3 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-2">교수님 성함</label>
              <input 
                type="text" 
                value={formData.professor}
                onChange={e => setFormData({...formData, professor: e.target.value})}
                placeholder="교수님 성함 입력"
                className="w-full p-3 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 4. 자료 유형 & 언어 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-2">자료 유형 <span className="text-red-500">*</span></label>
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="필기 노트">필기 노트</option>
                <option value="요약본 (סיכום)">요약본 (סיכום)</option>
                <option value="기출문제">기출문제</option>
                <option value="수업 자료">수업 자료</option>
                <option value="기타">기타 (직접 입력)</option>
              </select>
              {formData.category === '기타' && (
                <input 
                  type="text" 
                  required
                  value={customInputs.category}
                  onChange={e => setCustomInputs({...customInputs, category: e.target.value})}
                  placeholder="유형을 직접 입력하세요"
                  className="w-full mt-2 p-3 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-2">언어 <span className="text-red-500">*</span></label>
              <select 
                value={formData.language} 
                onChange={e => setFormData({...formData, language: e.target.value})}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="한국어">한국어</option>
                <option value="히브리어">히브리어</option>
                <option value="영어">영어</option>
              </select>
            </div>
          </div>

          {/* 5. 자료 설명 */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">자료 설명</label>
            <textarea 
              rows={4}
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              placeholder="후배들에게 도움이 될만한 팁이나 설명을 적어주세요."
              className="w-full p-3 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* 6. 작성자 이름 & 파일 링크 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-2">작성자 이름</label>
              <input 
                type="text" 
                value={formData.writer}
                onChange={e => setFormData({...formData, writer: e.target.value})}
                placeholder="비워두시면 '익명'으로 올라갑니다"
                className="w-full p-3 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-2">자료 링크 (파일) <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required
                value={formData.googleDriveLink}
                onChange={e => setFormData({...formData, googleDriveLink: e.target.value})}
                placeholder="https://drive.google.com/..."
                className="w-full p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1 pl-1">최대 10MB 파일을 지원하는 링크를 넣어주세요.</p>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">
              취소
            </button>
            <button type="submit" className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black text-sm hover:shadow-lg transition-all flex items-center gap-2">
              {id ? '수정 완료' : '자료 등록'}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default MaterialForm;
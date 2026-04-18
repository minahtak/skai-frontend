import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

const MemberForm: React.FC = () => {
  const navigate = useNavigate();

  // --- State ---
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    birthDate: '',
    school: '',
    degreeLevel: 'BACHELOR' // 기본값: 학사
  });

  const [majors, setMajors] = useState<string[]>(['']);
  const [manualSchool, setManualSchool] = useState('');
  const [schoolSelect, setSchoolSelect] = useState('');

  // 검증 메시지 State
  const [idMsg, setIdMsg] = useState({ text: '', color: '' });
  const [pwdMsg, setPwdMsg] = useState({ text: '', color: '' });
  const [emailMsg, setEmailMsg] = useState({ text: '', color: '' });
  
  const [isIdChecked, setIsIdChecked] = useState(false);

  // 이메일 인증 관련 State
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // --- Handlers ---

  // 1. 아이디 중복 확인
  const checkId = async () => {
    const username = form.username.trim();
    const regExp = /^[a-zA-Z0-9]+$/;

    if (username.length < 4) return alert("아이디는 4글자 이상이어야 합니다.");
    if (!regExp.test(username)) return alert("아이디는 영문과 숫자만 사용 가능합니다.");

    try {
      const isDuplicate = await api.checkUsername(username);
      if (isDuplicate) {
        setIdMsg({ text: "❌ 이미 사용 중인 아이디입니다.", color: "text-red-500" });
        setIsIdChecked(false);
      } else {
        setIdMsg({ text: "✅ 사용 가능한 아이디입니다.", color: "text-green-600" });
        setIsIdChecked(true);
      }
    } catch (err) {
      alert("중복 확인 중 오류가 발생했습니다.");
    }
  };

  // 2. 비밀번호 유효성 검사 (영문, 숫자 포함 8자 이상)
  const checkPassword = (password: string) => {
    const pwdRegExp = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!password) {
      setPwdMsg({ text: "", color: "" });
    } else if (!pwdRegExp.test(password)) {
      setPwdMsg({ text: "⚠️ 영문과 숫자를 포함하여 8자 이상 입력해주세요.", color: "text-red-500" });
    } else {
      setPwdMsg({ text: "✅ 안전한 비밀번호입니다.", color: "text-green-600" });
    }
  };

  // 3. 이메일 인증번호 발송
  const handleSendEmailCode = async () => {
    const email = form.email.trim();
    const regExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email) return alert("이메일을 입력해주세요.");
    if (!regExp.test(email)) {
      return setEmailMsg({ text: "⚠️ 올바른 이메일 형식이 아닙니다.", color: "text-red-500" });
    }

    try {
      setEmailMsg({ text: "⏳ 메일을 발송 중입니다...", color: "text-slate-500" });
      await api.sendEmailCode(email, 'JOIN');
      setIsEmailCodeSent(true);
      setEmailMsg({ text: "✅ 인증 코드가 발송되었습니다. 메일함을 확인해주세요.", color: "text-green-600" });
    } catch (err: any) {
      setEmailMsg({ text: "❌ 이미 가입된 이메일이거나 발송에 실패했습니다.", color: "text-red-500" });
    }
  };

  // 4. 이메일 인증번호 확인
  const handleVerifyCode = async () => {
    if (!verificationCode) return alert("인증번호를 입력해주세요.");
    
    try {
      const isValid = await api.verifyEmailCode(form.email, verificationCode);
      if (isValid) {
        setIsEmailVerified(true);
        setEmailMsg({ text: "🎉 이메일 인증이 완료되었습니다.", color: "text-indigo-600" });
      } else {
        alert("인증번호가 일치하지 않습니다.");
      }
    } catch (err) {
      alert("인증 확인 중 오류가 발생했습니다.");
    }
  };

  // 5. 전공 추가/삭제/변경 로직
  const handleMajorChange = (index: number, value: string) => {
    const newMajors = [...majors];
    newMajors[index] = value;
    setMajors(newMajors);
  };

  const addMajor = () => {
    if (majors.length < 3) setMajors([...majors, '']);
  };

  const removeMajor = (index: number) => {
    const newMajors = majors.filter((_, i) => i !== index);
    setMajors(newMajors);
  };

  // 6. 나이 계산 로직 (만 14세 미만 필터링)
  const calculateAge = (birthDateString: string) => {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    // 아직 생일이 안 지났다면 한 살 빼기
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // 7. 최종 회원가입 요청
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 기본 유효성 검사
    if (!isIdChecked) return alert("아이디 중복 확인을 해주세요.");
    if (form.name.trim() === "") return alert("이름을 입력해주세요.");
    
    // 비밀번호 검사
    const pwdRegExp = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!pwdRegExp.test(form.password)) {
      return alert("비밀번호는 영문, 숫자를 포함하여 8자 이상이어야 합니다.");
    }

    // 생일 검사 (필수 입력 및 14세 미만 차단)
    if (!form.birthDate) {
      return alert("생년월일을 입력해주세요.");
    }
    if (calculateAge(form.birthDate) < 14) {
      return alert("만 14세 미만은 가입할 수 없습니다.");
    }

    // 이메일 검사
    if (!isEmailVerified) return alert("이메일 인증을 완료해주세요.");

    // 학교 처리
    let finalSchool = schoolSelect;
    if (schoolSelect === "Other") {
      if (!manualSchool.trim()) return alert("학교 이름을 입력해주세요.");
      finalSchool = manualSchool;
    }
    if (!finalSchool) return alert("학교를 선택해주세요.");

    // 전공 처리 (빈 값 제거)
    const validMajors = majors.filter(m => m.trim() !== "");
    if (validMajors.length === 0) return alert("최소 1개의 전공을 입력해주세요.");

    const payload = {
      ...form,
      school: finalSchool,
      majors: validMajors
    };

    try {
      await api.signup(payload);
      alert("🎉 회원가입이 완료되었습니다! 로그인해주세요.");
      navigate('/login');
    } catch (err: any) {
      alert("회원가입 실패: " + err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-16 px-4">
      <div className="bg-white p-10 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900">Join</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 아이디 */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">아이디 <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="영문, 숫자 4자 이상"
                value={form.username}
                onChange={e => {
                  setForm({ ...form, username: e.target.value });
                  setIsIdChecked(false);
                  setIdMsg({ text: '', color: '' });
                }}
              />
              <button type="button" onClick={checkId} className="bg-slate-900 text-white px-4 rounded-xl text-xs font-bold hover:bg-slate-700">중복확인</button>
            </div>
            {idMsg.text && <p className={`text-[10px] font-bold mt-1 ${idMsg.color}`}>{idMsg.text}</p>}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">비밀번호 <span className="text-red-500">*</span></label>
            <input
              type="password"
              className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="영문, 숫자 포함 8자 이상"
              value={form.password}
              onChange={e => {
                setForm({ ...form, password: e.target.value });
                checkPassword(e.target.value);
              }}
            />
            {pwdMsg.text && <p className={`text-[10px] font-bold mt-1 ${pwdMsg.color}`}>{pwdMsg.text}</p>}
          </div>

          {/* 이름 & 생년월일 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">이름 <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">생년월일 <span className="text-red-500">*</span></label>
              <input
                type="date"
                className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                value={form.birthDate}
                onChange={e => setForm({ ...form, birthDate: e.target.value })}
              />
            </div>
          </div>

          {/* 이메일 및 인증 */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">이메일 <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input
                type="email"
                className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                placeholder="example@email.com"
                value={form.email}
                disabled={isEmailVerified}
                onChange={e => {
                  setForm({ ...form, email: e.target.value });
                  setIsEmailCodeSent(false);
                  setIsEmailVerified(false);
                  setEmailMsg({ text: '', color: '' });
                }}
              />
              <button 
                type="button" 
                onClick={handleSendEmailCode} 
                disabled={isEmailVerified}
                className="bg-slate-900 text-white px-4 rounded-xl text-xs font-bold hover:bg-slate-700 disabled:bg-slate-400"
              >
                {isEmailCodeSent ? "재발송" : "인증번호 받기"}
              </button>
            </div>
            {emailMsg.text && <p className={`text-[10px] font-bold mt-1 ${emailMsg.color}`}>{emailMsg.text}</p>}
          </div>

          {/* 인증번호 입력 폼 (이메일 발송 후 & 인증 전) */}
          {isEmailCodeSent && !isEmailVerified && (
            <div className="mt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="인증번호 6자리 입력"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={handleVerifyCode} 
                  className="bg-indigo-600 text-white px-4 rounded-xl text-xs font-bold hover:bg-indigo-500"
                >
                  인증하기
                </button>
              </div>
            </div>
          )}

          {/* 학교 & 학위 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">학교 <span className="text-red-500">*</span></label>
              <select
                className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                value={schoolSelect}
                onChange={e => setSchoolSelect(e.target.value)}
              >
                <option value="">선택해주세요</option>
                <option value="히브리대학교">히브리대학교</option>
                <option value="텔아비브대학교">텔아비브대학교</option>
                <option value="바일란대학교">바일란대학교</option>
                <option value="테크니온 공대">테크니온 공대</option>
                <option value="하이파대학교">하이파대학교</option>
                <option value="벤구리온대학교">벤구리온대학교</option>
                <option value="와이즈만 연구소">와이즈만 연구소</option>
                <option value="베잘렐 미대">베잘렐 미대</option>
                <option value="Other">기타 (직접 입력)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">과정 (학위) <span className="text-red-500">*</span></label>
              <select
                className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                value={form.degreeLevel}
                onChange={e => setForm({ ...form, degreeLevel: e.target.value })}
              >
                <option value="BACHELOR">학사</option>
                <option value="MASTER">석사</option>
                <option value="DOCTORATE">박사</option>
                <option value="MECHINA">메키나</option>
                <option value="LANGUAGE">어학연수 (Ulpan)</option>
                <option value="EXCHANGE">교환학생</option>
                <option value="OTHER">기타</option>
              </select>
            </div>
          </div>

          {/* 학교 직접 입력 */}
          {schoolSelect === "Other" && (
            <input
              type="text"
              className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="학교 이름을 입력해주세요"
              value={manualSchool}
              onChange={e => setManualSchool(e.target.value)}
            />
          )}

          {/* 전공 (복수전공 지원) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">전공 / 학과 <span className="text-red-500">*</span></label>
              {majors.length < 3 && (
                <button type="button" onClick={addMajor} className="text-[10px] font-bold text-indigo-600 hover:underline">+ 전공 추가 (복수전공)</button>
              )}
            </div>

            <div className="space-y-2">
              {majors.map((major, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder={index === 0 ? "주전공 입력" : `복수전공 ${index + 1}`}
                    value={major}
                    onChange={(e) => handleMajorChange(index, e.target.value)}
                  />
                  {majors.length > 1 && (
                    <button type="button" onClick={() => removeMajor(index)} className="px-3 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100">✕</button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">* 최대 3개까지 입력 가능합니다.</p>
          </div>

          <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-lg">
            회원가입 완료
          </button>

        </form>
        <p className="text-center text-xs font-bold text-slate-400">
          이미 계정이 있으신가요? <Link to="/login" className="text-indigo-600 hover:underline">로그인하기</Link>
        </p>
      </div>
    </div>
  );
};

export default MemberForm;
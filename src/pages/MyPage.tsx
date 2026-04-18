import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../api';

interface MyPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout?: () => void;
}

const MyPage: React.FC<MyPageProps> = ({ user, onUpdateUser, onLogout }) => {

  const defaultSchools = [
    "히브리대학교", "텔아비브대학교", "바일란대학교",
    "테크니온 공대", "하이파대학교", "벤구리온대학교",
    "와이즈만 연구소", "베잘렐 미대"
  ];

  const isDefaultSchool = defaultSchools.includes(user.school);

  // --- 기본 정보 State ---
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    birthDate: user.birthDate,
    // 대소문자 불일치로 인한 버그 방지 (무조건 대문자로 변환)
    degreeLevel: user.degreeLevel?.toUpperCase() || 'BACHELOR',
  });
  const [schoolSelect, setSchoolSelect] = useState(isDefaultSchool ? user.school : 'Other');
  const [manualSchool, setManualSchool] = useState(isDefaultSchool ? '' : user.school);
  const [majors, setMajors] = useState<string[]>(
    ([user.major1, user.major2, user.major3].filter(Boolean) as string[]).length > 0
      ? ([user.major1, user.major2, user.major3].filter(Boolean) as string[])
      : ['']
  );

  // --- 계정 정보 State ---
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    username: user.username,
    email: user.email,
  });
  const [isIdChecked, setIsIdChecked] = useState(true);
  const [idMsg, setIdMsg] = useState({ text: '', color: '' });
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [emailMsg, setEmailMsg] = useState({ text: '', color: '' });

  // --- 비밀번호 변경 State ---
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwdMsg, setPwdMsg] = useState({ text: '', color: '' });
  const [confirmMsg, setConfirmMsg] = useState({ text: '', color: '' });

  // --- 회원 탈퇴 State ---
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');

  // =====================
  // Handlers - 기본 정보
  // =====================

  const handleMajorChange = (index: number, value: string) => {
    const newMajors = [...majors];
    newMajors[index] = value;
    setMajors(newMajors);
  };

  const addMajor = () => {
    if (majors.length < 3) setMajors([...majors, '']);
  };

  const removeMajor = (index: number) => {
    setMajors(majors.filter((_, i) => i !== index));
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 생년월일 유효성 검사 (필수 입력 및 만 14세 이상 체크)
    if (!formData.birthDate) {
      return alert("생년월일을 입력해주세요.");
    }
    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 14) {
      return alert("만 14세 이상만 가입 및 이용이 가능합니다.");
    }

    // 2. 학교 정보 처리
    let finalSchool = schoolSelect;
    if (schoolSelect === "Other") {
      if (!manualSchool.trim()) return alert("학교 이름을 입력해주세요.");
      finalSchool = manualSchool;
    }

    // 3. 전공 정보 처리
    const validMajors = majors.filter(m => m.trim() !== "");
    if (validMajors.length === 0) return alert("최소 1개의 전공을 입력해주세요.");

    try {
      const updatedData = await api.updateMyInfo({
        name: formData.name,
        birthDate: formData.birthDate,
        degreeLevel: formData.degreeLevel,
        school: finalSchool,
        major1: validMajors[0] || null,
        major2: validMajors[1] || null,
        major3: validMajors[2] || null
      });

      onUpdateUser(updatedData);
      setIsEditingInfo(false);
      alert('정보가 성공적으로 수정되었습니다.');
    } catch (err: any) {
      alert("정보 수정에 실패했습니다: " + (err.response?.data || err.message));
    }
  };

  // =====================
  // Handlers - 계정 정보
  // =====================

  const handleUsernameChange = (value: string) => {
    setAccountForm({ ...accountForm, username: value });
    setIsIdChecked(value === user.username);
    setIdMsg({ text: '', color: '' });
  };

  const checkId = async () => {
    const username = accountForm.username.trim();
    const regExp = /^[a-zA-Z0-9]+$/;

    if (username === user.username) {
      setIdMsg({ text: '✅ 현재 사용 중인 아이디입니다.', color: 'text-green-600' });
      setIsIdChecked(true);
      return;
    }
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
    } catch {
      alert("중복 확인 중 오류가 발생했습니다.");
    }
  };

  const handleEmailChange = (value: string) => {
    setAccountForm({ ...accountForm, email: value });
    if (value === user.email) {
      setIsEmailVerified(true);
      setIsEmailCodeSent(false);
      setEmailMsg({ text: '', color: '' });
    } else {
      setIsEmailVerified(false);
      setIsEmailCodeSent(false);
      setEmailMsg({ text: '', color: '' });
    }
  };

  const handleSendEmailCode = async () => {
    const email = accountForm.email.trim();
    const regExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) return alert("이메일을 입력해주세요.");
    if (!regExp.test(email)) return setEmailMsg({ text: "⚠️ 올바른 이메일 형식이 아닙니다.", color: "text-red-500" });

    try {
      setEmailMsg({ text: "⏳ 메일을 발송 중입니다...", color: "text-slate-500" });
      await api.sendEmailCode(email, 'UPDATE');
      setIsEmailCodeSent(true);
      setEmailMsg({ text: "✅ 인증 코드가 발송되었습니다. 메일함을 확인해주세요.", color: "text-green-600" });
    } catch {
      setEmailMsg({ text: "❌ 발송에 실패했습니다. 이메일을 확인해주세요.", color: "text-red-500" });
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) return alert("인증번호를 입력해주세요.");
    try {
      const isValid = await api.verifyEmailCode(accountForm.email, verificationCode);
      if (isValid) {
        setIsEmailVerified(true);
        setEmailMsg({ text: "🎉 이메일 인증이 완료되었습니다.", color: "text-indigo-600" });
      } else {
        alert("인증번호가 일치하지 않습니다.");
      }
    } catch {
      alert("인증 확인 중 오류가 발생했습니다.");
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isIdChecked) return alert("아이디 중복 확인을 해주세요.");
    if (!isEmailVerified) return alert("이메일 인증을 완료해주세요.");

    // 아이디가 변경되었는지 확인
    const isIdChanged = accountForm.username !== user.username;

    try {
      const updatedData = await api.updateAccount({
        username: accountForm.username,
        email: accountForm.email
      });

      // 아이디가 변경되었다면 강제 로그아웃 및 로그인 페이지로 이동
      if (isIdChanged) {
        alert('아이디가 변경되었습니다. 다시 로그인해주세요.');
        onLogout?.();
        window.location.href = '/login'; 
        return;
      }

      onUpdateUser(updatedData);
      setIsEditingAccount(false);
      setIsEmailCodeSent(false);
      setVerificationCode('');
      setIdMsg({ text: '', color: '' });
      setEmailMsg({ text: '', color: '' });
      alert('계정 정보가 성공적으로 수정되었습니다.');
    } catch (err: any) {
      alert("계정 정보 수정 실패: " + (err.response?.data || err.message));
    }
  };

  // ========================
  // Handlers - 비밀번호 변경
  // ========================

  const checkNewPassword = (password: string) => {
    const pwdRegExp = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!password) setPwdMsg({ text: "", color: "" });
    else if (!pwdRegExp.test(password)) setPwdMsg({ text: "⚠️ 영문과 숫자를 포함하여 8자 이상 입력해주세요.", color: "text-red-500" });
    else setPwdMsg({ text: "✅ 안전한 비밀번호입니다.", color: "text-green-600" });
  };

  const checkConfirmPassword = (confirm: string, newPwd?: string) => {
    const target = newPwd ?? passwordForm.newPassword;
    if (!confirm) setConfirmMsg({ text: "", color: "" });
    else if (confirm !== target) setConfirmMsg({ text: "⚠️ 비밀번호가 일치하지 않습니다.", color: "text-red-500" });
    else setConfirmMsg({ text: "✅ 비밀번호가 일치합니다.", color: "text-green-600" });
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) return alert("현재 비밀번호를 입력해주세요.");
    const pwdRegExp = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!pwdRegExp.test(passwordForm.newPassword)) return alert("새 비밀번호는 영문, 숫자를 포함하여 8자 이상이어야 합니다.");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return alert("새 비밀번호가 일치하지 않습니다.");
    if (passwordForm.currentPassword === passwordForm.newPassword) return alert("현재 비밀번호와 동일한 비밀번호로 변경할 수 없습니다.");

    try {
      await api.changePassword({ 
        currentPassword: passwordForm.currentPassword, 
        newPassword: passwordForm.newPassword 
      });
      alert('비밀번호가 성공적으로 변경되었습니다.');
      setIsEditingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwdMsg({ text: '', color: '' });
      setConfirmMsg({ text: '', color: '' });
    } catch (err: any) {
      alert("비밀번호 변경 실패. " + (err.response?.data || "현재 비밀번호를 확인해주세요."));
    }
  };

  // =====================
  // Handlers - 회원 탈퇴
  // =====================

  const handleWithdraw = async () => {
    if (!withdrawPassword.trim()) return alert("비밀번호를 입력해주세요.");
    try {
      await api.withdraw({ password: withdrawPassword });
      alert("회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.");
      setShowWithdrawModal(false);
      
      // 탈퇴 성공 시 토큰 날리고 로그인 창으로 새로고침 이동
      onLogout?.();
      window.location.href = '/login'; 
    } catch (err: any) {
      alert(err.response?.data || "비밀번호가 올바르지 않거나 탈퇴 처리 중 오류가 발생했습니다.");
    }
  };

  const currentMajors = [user.major1, user.major2, user.major3].filter(Boolean) as string[];

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-10">

      {/* 헤더 섹션 */}
      <header className="flex flex-col md:flex-row items-center gap-8 bg-indigo-950 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <svg className="w-48 h-48 fill-current" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
        </div>
        <div className="relative z-10 w-24 h-24 bg-white text-indigo-950 rounded-[2.5rem] flex items-center justify-center text-4xl font-black shadow-xl">
          {user.name[0]}
        </div>
        <div className="relative z-10 text-center md:text-left space-y-3">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <h1 className="text-3xl font-black">{user.name}</h1>
            <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">{user.role}</span>
          </div>
          <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs">
            {user.school} • {user.degreeLevel}
            {currentMajors[0] && ` • ${currentMajors[0]}`}
          </p>
        </div>
      </header>

      {/* 섹션 1: 기본 정보 */}
      <section className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
        <div className="flex justify-between items-center pb-6 border-b border-slate-50">
          <h2 className="text-2xl font-black text-slate-900">기본 정보</h2>
          <button
            onClick={() => setIsEditingInfo(!isEditingInfo)}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${isEditingInfo ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
          >
            {isEditingInfo ? '취소' : '수정하기'}
          </button>
        </div>

        <form onSubmit={handleSaveInfo} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">이름</label>
              <input disabled={!isEditingInfo} type="text"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">생년월일</label>
              <input disabled={!isEditingInfo} type="date"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">학위 과정</label>
              <select disabled={!isEditingInfo}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 appearance-none disabled:opacity-50"
                value={formData.degreeLevel} onChange={e => setFormData({ ...formData, degreeLevel: e.target.value })}>
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

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">소속 대학교</label>
            <div className="flex flex-col gap-2">
              <select disabled={!isEditingInfo}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 appearance-none disabled:opacity-50"
                value={schoolSelect} onChange={e => setSchoolSelect(e.target.value)}>
                {defaultSchools.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="Other">기타 (직접 입력)</option>
              </select>
              {schoolSelect === "Other" && (
                <input disabled={!isEditingInfo} type="text" placeholder="학교 이름을 입력해주세요"
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                  value={manualSchool} onChange={e => setManualSchool(e.target.value)} />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">전공 / 학과</label>
              {isEditingInfo && majors.length < 3 && (
                <button type="button" onClick={addMajor} className="text-[10px] font-bold text-indigo-600 hover:underline">+ 전공 추가</button>
              )}
            </div>
            <div className="space-y-2">
              {majors.map((major, index) => (
                <div key={index} className="flex gap-2">
                  <input disabled={!isEditingInfo} type="text"
                    className="flex-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                    placeholder={index === 0 ? "주전공" : `복수전공 ${index + 1}`}
                    value={major} onChange={(e) => handleMajorChange(index, e.target.value)} />
                  {isEditingInfo && majors.length > 1 && (
                    <button type="button" onClick={() => removeMajor(index)} className="px-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isEditingInfo && (
            <div className="pt-4">
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                기본 정보 저장
              </button>
            </div>
          )}
        </form>
      </section>

      {/* 섹션 2: 계정 정보 */}
      <section className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
        <div className="flex justify-between items-center pb-6 border-b border-slate-50">
          <h2 className="text-2xl font-black text-slate-900">계정 정보</h2>
          <button
            onClick={() => {
              if (isEditingAccount) {
                setAccountForm({ username: user.username, email: user.email });
                setIsIdChecked(true); setIsEmailVerified(true); setIsEmailCodeSent(false);
                setVerificationCode(''); setIdMsg({ text: '', color: '' }); setEmailMsg({ text: '', color: '' });
              }
              setIsEditingAccount(!isEditingAccount);
            }}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${isEditingAccount ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
          >
            {isEditingAccount ? '취소' : '수정하기'}
          </button>
        </div>

        <form onSubmit={handleSaveAccount} className="space-y-8">
          {/* 아이디 */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">아이디</label>
            <div className="flex gap-2">
              <input disabled={!isEditingAccount} type="text"
                className="flex-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                value={accountForm.username} onChange={e => handleUsernameChange(e.target.value)} />
              {isEditingAccount && (
                <button type="button" onClick={checkId}
                  className="px-5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-700 whitespace-nowrap">
                  중복확인
                </button>
              )}
            </div>
            {idMsg.text && <p className={`text-[10px] font-bold mt-1 ${idMsg.color}`}>{idMsg.text}</p>}
          </div>

          {/* 이메일 */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">이메일</label>
            <div className="flex gap-2">
              <input
                disabled={!isEditingAccount || isEmailVerified}
                type="email"
                className="flex-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                value={accountForm.email} onChange={e => handleEmailChange(e.target.value)} />
              {isEditingAccount && !isEmailVerified && (
                <button type="button" onClick={handleSendEmailCode}
                  className="px-5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-700 whitespace-nowrap">
                  {isEmailCodeSent ? "재발송" : "인증번호 받기"}
                </button>
              )}
              {isEditingAccount && isEmailVerified && (
                <button type="button"
                  onClick={() => { setIsEmailVerified(false); setEmailMsg({ text: '', color: '' }); }}
                  className="px-5 bg-slate-100 text-slate-500 rounded-2xl text-xs font-bold hover:bg-slate-200 whitespace-nowrap">
                  변경
                </button>
              )}
            </div>
            {emailMsg.text && <p className={`text-[10px] font-bold mt-1 ${emailMsg.color}`}>{emailMsg.text}</p>}
            {isEditingAccount && isEmailCodeSent && !isEmailVerified && (
              <div className="flex gap-2 mt-2">
                <input type="text"
                  className="flex-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="인증번호 6자리 입력" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} />
                <button type="button" onClick={handleVerifyCode}
                  className="px-5 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-500 whitespace-nowrap">
                  인증하기
                </button>
              </div>
            )}
          </div>

          {isEditingAccount && (
            <div className="pt-4">
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                계정 정보 저장
              </button>
            </div>
          )}
        </form>
      </section>

      {/* 섹션 3: 비밀번호 변경 */}
      <section className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
        <div className="flex justify-between items-center pb-6 border-b border-slate-50">
          <h2 className="text-2xl font-black text-slate-900">비밀번호 변경</h2>
          <button
            onClick={() => {
              if (isEditingPassword) {
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPwdMsg({ text: '', color: '' }); setConfirmMsg({ text: '', color: '' });
              }
              setIsEditingPassword(!isEditingPassword);
            }}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${isEditingPassword ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
          >
            {isEditingPassword ? '취소' : '변경하기'}
          </button>
        </div>

        {!isEditingPassword ? (
          <p className="text-sm font-bold text-slate-400">보안을 위해 주기적으로 비밀번호를 변경해주세요.</p>
        ) : (
          <form onSubmit={handleSavePassword} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">현재 비밀번호</label>
              <input type="password"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="현재 비밀번호 입력"
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">새 비밀번호</label>
              <input type="password"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="영문, 숫자 포함 8자 이상"
                value={passwordForm.newPassword}
                onChange={e => {
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                  checkNewPassword(e.target.value);
                  checkConfirmPassword(passwordForm.confirmPassword, e.target.value);
                }} />
              {pwdMsg.text && <p className={`text-[10px] font-bold mt-1 ${pwdMsg.color}`}>{pwdMsg.text}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">새 비밀번호 확인</label>
              <input type="password"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="새 비밀번호 재입력"
                value={passwordForm.confirmPassword}
                onChange={e => {
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                  checkConfirmPassword(e.target.value);
                }} />
              {confirmMsg.text && <p className={`text-[10px] font-bold mt-1 ${confirmMsg.color}`}>{confirmMsg.text}</p>}
            </div>
            <div className="pt-4">
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                비밀번호 변경 완료
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 섹션 4: 회원 탈퇴 */}
      <section className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900">회원 탈퇴</h2>
            <p className="text-xs font-bold text-slate-400 mt-2">탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.</p>
          </div>
          <button onClick={() => setShowWithdrawModal(true)}
            className="px-6 py-2 rounded-xl text-xs font-black bg-red-50 text-red-500 hover:bg-red-100 transition-all">
            탈퇴하기
          </button>
        </div>
      </section>

      {/* 회원 탈퇴 확인 모달 */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">정말 탈퇴하시겠어요?</h3>
              <p className="text-sm font-bold text-slate-400">작성하신 모든 게시물과 데이터가 영구적으로 삭제됩니다.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">비밀번호 확인</label>
              <input type="password"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-red-100"
                placeholder="현재 비밀번호를 입력해주세요"
                value={withdrawPassword} onChange={e => setWithdrawPassword(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowWithdrawModal(false); setWithdrawPassword(''); }}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">
                취소
              </button>
              <button onClick={handleWithdraw}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-sm hover:bg-red-600 transition-all">
                탈퇴 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;
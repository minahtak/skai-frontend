import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: 정보 입력, 2: 인증 및 비번 변경

    const [form, setForm] = useState({ username: '', email: '' });
    const [resetData, setResetData] = useState({ code: '', newPassword: '', confirmPassword: '' });

    const [msg, setMsg] = useState({ text: '', color: '' }); // 1단계 메시지용
    const [step2Msg, setStep2Msg] = useState({ text: '', color: '' }); // 2단계 메시지용
    const [isLoading, setIsLoading] = useState(false);

    // 1단계: 유저 확인 및 메일 발송
    const handleVerifyInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMsg({ text: '', color: '' });

        try {
            await api.verifyForPasswordReset(form.username, form.email);
            setStep(2);
            // 성공하면 어차피 2단계 화면으로 넘어가므로 성공 메시지 렌더링은 생략합니다.
        } catch (err: any) {
            setMsg({ text: "❌ 일치하는 정보를 찾을 수 없습니다.", color: "text-red-500" });
        } finally {
            setIsLoading(false);
        }
    };

    // 2단계: 최종 변경
    const handleCompleteReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep2Msg({ text: '', color: '' });

        // 유효성 검사 (alert 대신 화면에 메시지로 출력)
        const pwdRegExp = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!pwdRegExp.test(resetData.newPassword)) {
            return setStep2Msg({ text: "⚠️ 비밀번호는 영문, 숫자를 포함하여 8자 이상이어야 합니다.", color: "text-red-500" });
        }
        if (resetData.newPassword !== resetData.confirmPassword) {
            return setStep2Msg({ text: "⚠️ 비밀번호가 일치하지 않습니다.", color: "text-red-500" });
        }

        try {
            await api.completePasswordReset(form.email, resetData.code, resetData.newPassword);
            alert("🎉 비밀번호가 변경되었습니다. 다시 로그인해 주세요."); // 최종 성공은 명확하게 alert 처리
            navigate('/login');
        } catch (err: any) {
            setStep2Msg({ text: "❌ 인증번호가 틀렸거나 만료되었습니다.", color: "text-red-500" });
        }
    };

    return (
        <div className="max-w-md mx-auto py-24 px-4">
            <div className="bg-white p-10 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-black text-slate-950 tracking-tight">Reset Password</h1>
                    <p className="text-xs font-bold text-slate-400">
                        {step === 1 ? "계정 정보를 입력해 주세요." : "새로운 비밀번호를 설정해 주세요."}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleVerifyInfo} className="space-y-5">
                        <input type="text" placeholder="아이디" required className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                            value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                        <input type="email" placeholder="이메일" required className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

                        {msg.text && <p className={`text-[10px] font-bold text-center ${msg.color}`}>{msg.text}</p>}

                        <button type="submit" disabled={isLoading} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50">
                            {isLoading ? "확인 중..." : "인증번호 받기"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleCompleteReset} className="space-y-5">
                        <div className="bg-indigo-50 p-4 rounded-xl text-center mb-4">
                            <p className="text-[10px] font-bold text-indigo-400">{form.email}로 코드가 전송되었습니다.</p>
                        </div>
                        <input type="text" placeholder="인증번호 6자리" required className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                            value={resetData.code} onChange={e => setResetData({ ...resetData, code: e.target.value })} />
                        <input type="password" placeholder="새 비밀번호 (영문+숫자 8자 이상)" required className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                            value={resetData.newPassword} onChange={e => setResetData({ ...resetData, newPassword: e.target.value })} />
                        <input type="password" placeholder="새 비밀번호 확인" required className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                            value={resetData.confirmPassword} onChange={e => setResetData({ ...resetData, confirmPassword: e.target.value })} />

                        {step2Msg.text && <p className={`text-[10px] font-bold text-center ${step2Msg.color}`}>{step2Msg.text}</p>}

                        <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-indigo-500 transition-all">
                            비밀번호 변경 완료
                        </button>
                    </form>
                )}

                <div className="text-center pt-6 border-t border-slate-50">
                    <button type="button" onClick={() => navigate('/login')} className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors">
                        로그인 화면으로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
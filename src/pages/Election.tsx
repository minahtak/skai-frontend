import React, { useState, useEffect } from 'react';
import { Candidate } from '../types';
import { api } from '../api';

const Election: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [hasVoted, setHasVoted] = useState<boolean>(false);
    const [votedCandidateName, setVotedCandidateName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal & Step State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState<'EMAIL_VERIFY' | 'SELECT_CANDIDATE' | 'CONFIRM'>('EMAIL_VERIFY');

    // Form State
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [emailMsg, setEmailMsg] = useState({ text: '', color: '' });
    const [isSendingCode, setIsSendingCode] = useState(false);

    // Selected Candidate
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | number>('');

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const data = await api.getCandidates();
                setCandidates(data);
            } catch (err) {
                console.error("Failed to fetch candidates", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCandidates();
    }, []);

    // 이메일 유효성 검사 (@mail.huji.ac.il 전용)
    const isHujiEmail = (inputEmail: string) => {
        const hujiRegex = /^[a-zA-Z0-9._%+-]+@mail\.huji\.ac\.il$/i;
        return hujiRegex.test(inputEmail.trim());
    };

    const openVoteModal = () => {
        if (hasVoted) {
            alert("이미 투표를 완료하셨습니다. 소중한 한 표 감사합니다!");
            return;
        }
        setIsModalOpen(true);
        setStep('EMAIL_VERIFY');
    };

    const closeModal = () => {
        setIsModalOpen(false);
        // 완료되지 않은 상태에서 닫을 경우 초기화
        if (!hasVoted) {
            setEmailMsg({ text: '', color: '' });
        }
    };

    // 1. 인증번호 발송 요청
    const handleSendCode = async () => {
        const cleanEmail = email.trim();
        if (!cleanEmail) {
            return setEmailMsg({ text: "⚠️ 이메일을 입력해주세요.", color: "text-red-500" });
        }
        if (!isHujiEmail(cleanEmail)) {
            return setEmailMsg({
                text: "❌ 히브리대학교 공식 이메일(@mail.huji.ac.il)만 유효합니다.",
                color: "text-red-500"
            });
        }

        try {
            setIsSendingCode(true);
            setEmailMsg({ text: "⏳ 인증 코드를 발송 중입니다...", color: "text-slate-500" });

            // 투표용 인증번호 발송 API 호출 (서버에서 이미 투표한 메일인지 1차 검증)
            await api.sendVoteEmailCode(cleanEmail);

            setIsEmailCodeSent(true);
            setEmailMsg({ text: "✅ 인증번호가 발송되었습니다. 웹메일함을 확인해주세요.", color: "text-green-600" });
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || "이미 투표에 참여한 이메일이거나 발송에 실패했습니다.";
            setEmailMsg({ text: `❌ ${errorMsg}`, color: "text-red-500" });
        } finally {
            setIsSendingCode(false);
        }
    };

    // 2. 인증번호 확인
    const handleVerifyCode = async () => {
        if (!verificationCode.trim()) {
            return alert("인증번호 6자리를 입력해주세요.");
        }

        try {
            const result = await api.verifyVoteEmailCode(email.trim(), verificationCode.trim());
            if (result) {
                setIsEmailVerified(true);
                setEmailMsg({ text: "🎉 인증이 완료되었습니다! 후보를 선택해주세요.", color: "text-indigo-600" });
                // 인증 완료 후 바로 후보자 선택 단계로 전환
                setTimeout(() => {
                    setStep('SELECT_CANDIDATE');
                }, 600);
            } else {
                alert("인증번호가 일치하지 않거나 만료되었습니다.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "인증 확인 중 오류가 발생했습니다.");
        }
    };

    // 3. 최종 투표 제출
    const handleVoteSubmit = async () => {
        if (!selectedCandidateId) {
            alert("후보를 선택해주세요.");
            return;
        }

        const selected = candidates.find(c => c.id === selectedCandidateId);

        if (window.confirm(`[기호 ${selected?.candidateNumber}번 ${selected?.name}] 후보에게 투표하시겠습니까?\n제출 후에는 수정 및 재투표가 불가능합니다.`)) {
            try {
                await api.submitVote({
                    email: email.trim(),
                    code: verificationCode.trim(),
                    candidateId: selectedCandidateId
                });

                setHasVoted(true);
                setVotedCandidateName(selected?.name || '');

                // 화면 상태 업데이트
                setCandidates(prev =>
                    prev.map(c => c.id === selectedCandidateId ? { ...c, votes: c.votes + 1 } : c)
                );

                setIsModalOpen(false);
                alert("🎉 투표가 성공적으로 완료되었습니다! 참여해주셔서 감사합니다.");
            } catch (err: any) {
                alert(err.response?.data?.message || "투표 처리 중 오류가 발생했습니다.");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);

    return (
        <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in duration-700 pb-20">

            {/* Hero Section */}
            <section className="text-center space-y-8 bg-white border border-slate-100 rounded-[3rem] p-10 md:p-16 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 font-black uppercase tracking-widest text-[10px] rounded-full border border-indigo-100">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                        HUJI KOREAN ELECTION 2026
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                        히브리대 한인학생회장 선거
                    </h1>

                    <p className="text-sm md:text-base text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                        여러분의 소중한 한 표가 히브리대 한인학생회의 내일을 만듭니다.<br />
                        히브리대 웹메일(<span className="font-bold text-indigo-600">@mail.huji.ac.il</span>) 인증을 통해 누구나 간편하게 참여할 수 있습니다.
                    </p>

                    <div className="pt-4">
                        {!hasVoted ? (
                            <button
                                onClick={openVoteModal}
                                className="px-8 md:px-12 py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-lg md:text-xl transition-all shadow-xl hover:-translate-y-1"
                            >
                                투표하기 (히브리대 메일 인증) →
                            </button>
                        ) : (
                            <div className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-base md:text-lg border border-emerald-100 shadow-sm">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                </svg>
                                투표를 완료하셨습니다 {votedCandidateName && `(${votedCandidateName} 후보)`}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 실시간 득표율 현황 (투표 완료자에게 노출) */}
            {hasVoted && (
                <section className="bg-white border border-indigo-100 rounded-[3rem] p-8 md:p-12 shadow-sm space-y-8 animate-in slide-in-from-bottom-8">
                    <div className="text-center space-y-2">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Live Stats</span>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900">실시간 투표 현황</h2>
                        <p className="text-xs md:text-sm font-medium text-slate-500">투표에 참여해주신 분들께 제공되는 실시간 집계 현황입니다.</p>
                    </div>

                    <div className="space-y-6 max-w-3xl mx-auto pt-4">
                        {candidates.map(candidate => {
                            const percentage = totalVotes === 0 ? 0 : Math.round((candidate.votes / totalVotes) * 100);
                            const isSelected = votedCandidateName === candidate.name;

                            return (
                                <div key={`result-${candidate.id}`} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-black text-slate-600">기호 {candidate.candidateNumber}번</span>
                                            {candidate.name}
                                            {isSelected && <span className="text-indigo-600 text-xs font-black bg-indigo-50 px-2 py-0.5 rounded-full">나의 선택</span>}
                                        </span>
                                        <span className="font-black text-base md:text-lg text-slate-900">
                                            {percentage}% <span className="text-xs font-bold text-slate-400">({candidate.votes}표)</span>
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${isSelected ? 'bg-indigo-600' : 'bg-slate-400'}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                        <p className="text-right text-[11px] font-bold text-slate-400">총 투표수: {totalVotes}표</p>
                    </div>
                </section>
            )}

            {/* 후보자 카드 및 공약 목록 */}
            <section className="space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-slate-900">후보자 및 주요 공약</h2>
                    <p className="text-sm font-medium text-slate-500">후보자의 공약과 비전을 꼼꼼히 확인해보세요.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {candidates.map((candidate) => (
                        <div
                            key={candidate.id}
                            className="bg-white border border-slate-200 rounded-[3rem] p-8 md:p-10 flex flex-col justify-between hover:shadow-xl hover:border-indigo-300 transition-all duration-300 relative overflow-hidden group"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-xs font-black">
                                        기호 {candidate.candidateNumber}번
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">{candidate.school}</span>
                                </div>

                                <div className="flex flex-col items-center mb-8 text-center">
                                    <div className="w-32 h-32 rounded-full overflow-hidden mb-5 shadow-lg border-4 border-slate-50">
                                        <img
                                            src={candidate.imageUrl || "https://i.namu.wiki/i/Q6BIqhZWqyhBAFmeZoOWIFO2Ttw1X0xOimLTY0WyohXIadIRIoxaAWc6yoggyEKohkI3aDCoKXsBlp6rvL-MFg.webp"}
                                            alt={candidate.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-1">{candidate.name}</h3>
                                    <p className="text-xs font-bold text-indigo-600">{candidate.major || candidate.school}</p>
                                </div>

                                <div className="bg-slate-50 rounded-3xl p-6 space-y-4 mb-6">
                                    <h4 className="text-sm font-black text-indigo-600 text-center italic">
                                        "{candidate.slogan}"
                                    </h4>

                                    <div className="space-y-3 pt-2">
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Pledges (핵심 공약)</h5>
                                        <ul className="space-y-2.5">
                                            {candidate.pledges.map((pledge, idx) => (
                                                <li key={idx} className="flex items-start gap-2.5">
                                                    <span className="text-indigo-600 font-black text-sm">✓</span>
                                                    <span className="text-xs font-bold text-slate-700 leading-relaxed">{pledge}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {!hasVoted && (
                                <button
                                    onClick={() => {
                                        setSelectedCandidateId(candidate.id);
                                        openVoteModal();
                                    }}
                                    className="w-full py-3.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-800 rounded-2xl font-black text-xs transition-all"
                                >
                                    기호 {candidate.candidateNumber}번 {candidate.name} 선택하여 투표하기
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 선거 유의사항 */}
            <section className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 space-y-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>📌</span> 투표 유의사항
                </h3>
                <ul className="text-slate-500 font-medium space-y-2 text-xs md:text-sm list-disc list-inside leading-relaxed">
                    <li>투표는 <strong className="text-slate-800">히브리대학교 웹메일(@mail.huji.ac.il)</strong> 인증을 완료한 유권자에 한해 1인 1표로 진행됩니다.</li>
                    <li>투표 제출 완료 후에는 어떠한 경우에도 선택을 수정하거나 재투표할 수 없습니다.</li>
                    <li>이메일 인증 기록과 실제 표 데이터는 완벽히 분리되어 <strong className="text-slate-800">철저한 비밀 투표(익명)</strong>가 보장됩니다.</li>
                </ul>
            </section>

            {/* ========================================================================= */}
            {/* 이메일 인증 & 투표 모달 (Step-by-Step) */}
            {/* ========================================================================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={closeModal}></div>

                    <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <button
                            onClick={closeModal}
                            className="absolute top-6 right-6 w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                        >
                            ✕
                        </button>

                        {/* STEP 1: 이메일 인증 */}
                        {step === 'EMAIL_VERIFY' && (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center font-black text-2xl">
                                        ✉️
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900">유권자 본인 인증</h2>
                                    <p className="text-xs font-medium text-slate-500">
                                        히브리대 웹메일(<span className="font-bold text-indigo-600">@mail.huji.ac.il</span>)을 입력해주세요.
                                    </p>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                            히브리대 이메일 <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="email"
                                                disabled={isEmailVerified}
                                                placeholder="username@mail.huji.ac.il"
                                                value={email}
                                                onChange={e => {
                                                    setEmail(e.target.value);
                                                    setIsEmailCodeSent(false);
                                                    setEmailMsg({ text: '', color: '' });
                                                }}
                                                className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-xs md:text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSendCode}
                                                disabled={isSendingCode || isEmailVerified}
                                                className="bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                                            >
                                                {isSendingCode ? "발송중..." : isEmailCodeSent ? "재발송" : "인증번호 받기"}
                                            </button>
                                        </div>
                                        {emailMsg.text && (
                                            <p className={`text-[11px] font-bold mt-2 ${emailMsg.color}`}>
                                                {emailMsg.text}
                                            </p>
                                        )}
                                    </div>

                                    {/* 인증코드 입력칸 */}
                                    {isEmailCodeSent && !isEmailVerified && (
                                        <div className="space-y-2 pt-2 animate-in fade-in">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                                인증번호 6자리
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    placeholder="인증번호 6자리"
                                                    value={verificationCode}
                                                    onChange={e => setVerificationCode(e.target.value)}
                                                    className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold tracking-widest outline-none focus:ring-2 focus:ring-indigo-100"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleVerifyCode}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl text-xs font-bold transition-all"
                                                >
                                                    인증확인
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: 후보자 선택 */}
                        {step === 'SELECT_CANDIDATE' && (
                            <div className="space-y-6">
                                <div className="text-center space-y-1">
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                        인증 완료: {email}
                                    </span>
                                    <h2 className="text-2xl font-black text-slate-900 pt-2">후보자 선택</h2>
                                    <p className="text-xs font-medium text-slate-500">지지하는 회장 후보를 1명 선택해주세요.</p>
                                </div>

                                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                    {candidates.map((candidate) => {
                                        const isSelected = selectedCandidateId === candidate.id;
                                        return (
                                            <label
                                                key={`modal-${candidate.id}`}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected
                                                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                                                        : 'border-slate-100 hover:border-indigo-200 bg-white'
                                                    }`}
                                                onClick={() => setSelectedCandidateId(candidate.id)}
                                            >
                                                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-indigo-600 flex-shrink-0">
                                                    {isSelected && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                                                </div>
                                                <img
                                                    src={candidate.imageUrl || "https://i.namu.wiki/i/izVXkClWRy9-s5DAkC_lGo3za4Zy9seGH1V6AM0qZJzsckE9eWe6-Hp-1OvJm_DkVv7BL7U0Ar7QB89ApaklkQ.webp"}
                                                    alt={candidate.name}
                                                    className="w-11 h-11 rounded-full object-cover border"
                                                />
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">기호 {candidate.candidateNumber}번</span>
                                                        <h4 className="font-black text-slate-900 text-sm">{candidate.name}</h4>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-slate-400">{candidate.school}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={handleVoteSubmit}
                                        disabled={!selectedCandidateId}
                                        className={`w-full py-4 rounded-2xl font-black text-sm md:text-base transition-all ${selectedCandidateId
                                                ? 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-700'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        소중한 한 표 제출하기 →
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}

        </div>
    );
};

export default Election;
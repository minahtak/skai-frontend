import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Candidate } from '../types';
import { api } from '../api';

// ==========================================
// 1. 단일 후보 정보 (직접 수정 가능)
// ==========================================
const SINGLE_CANDIDATE: Candidate = {
    id: 1,
    candidateNumber: 1,
    name: "하세윤",
    school: "The Hebrew University of Jerusalem",
    major: "? & Business Administration",
    slogan: "입학부터 졸업까지 버팀목이 되는 학생회를 만들겠습니다",
    imageUrl: "https://cdn.skaisrael.com/3a8405a6-cef0-46ab-88f2-0072f0b582b6_%ED%95%98%EC%84%B8%EC%9C%A4.jpg",
    pledges: [
        "학업·어학 관련 정보 및 지원 확대",
        "학교 생활·학사 행정 가이드북 및 이스라엘 정착 팁 웹 아카이브 구축",
        "선후배 네트워크를 통한 학업·생활 지원",
        "유학생활에 필요한 체류·행정·주거 지원 강화"
    ],
    votes: 0
};

type VoteChoice = 'APPROVE' | 'REJECT';

interface VoteStats {
    approve: number;
    reject: number;
}

const Election: React.FC = () => {
    // 투표 및 결과 상태
    const [hasVoted, setHasVoted] = useState<boolean>(false);
    const [myVote, setMyVote] = useState<VoteChoice | null>(null);
    const [voteStats, setVoteStats] = useState<VoteStats>({ approve: 0, reject: 0 });
    const [loading, setLoading] = useState<boolean>(true);

    // 모달 및 인증 단계 ('EMAIL_VERIFY' -> 'VOTE')
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState<'EMAIL_VERIFY' | 'VOTE'>('EMAIL_VERIFY');

    // 폼 입력 상태
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [emailMsg, setEmailMsg] = useState({ text: '', color: '' });
    const [isSendingCode, setIsSendingCode] = useState(false);

    // 선택된 찬반 상태
    const [selectedChoice, setSelectedChoice] = useState<VoteChoice | null>(null);

    // 실시간 찬/반 집계 로드 & 기존 투표 이력 확인
    const fetchVoteStats = async () => {
        try {
            const stats = await api.getVoteStats();
            if (stats) setVoteStats(stats);
        } catch (err) {
            console.error("투표 집계 조회 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 이 브라우저에서 이미 투표했는지 확인 (새로고침 시 상태 유지)
        const savedVoted = localStorage.getItem('huji_election_voted');
        const savedChoice = localStorage.getItem('huji_election_choice') as VoteChoice | null;

        if (savedVoted === 'true' && savedChoice) {
            setHasVoted(true);
            setMyVote(savedChoice);
        }

        fetchVoteStats();
    }, []);

    // @mail.huji.ac.il 전용 유효성 검사
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
        if (!hasVoted) {
            setEmailMsg({ text: '', color: '' });
            setSelectedChoice(null);
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
            await api.sendVoteEmailCode(cleanEmail);
            setIsEmailCodeSent(true);
            setEmailMsg({ text: "인증번호가 발송되었습니다. 웹메일함을 확인해주세요.", color: "text-emerald-600" });
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || "이미 투표에 참여한 이메일이거나 발송에 실패했습니다.";
            setEmailMsg({ text: errorMsg, color: "text-red-500" });
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
                setEmailMsg({ text: "🎉 인증이 완료되었습니다.", color: "text-indigo-600" });
                setTimeout(() => setStep('VOTE'), 400);
            } else {
                alert("인증번호가 일치하지 않거나 만료되었습니다.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "인증 확인 중 오류가 발생했습니다.");
        }
    };

    // 3. 찬/반 투표 최종 제출
    const handleVoteSubmit = async () => {
        if (!selectedChoice) {
            return alert("찬성 또는 반대를 선택해주세요.");
        }

        const choiceLabel = selectedChoice === 'APPROVE' ? '찬성' : '반대';
        if (window.confirm(`[${SINGLE_CANDIDATE.name} 후보에게 "${choiceLabel}"]으로 투표하시겠습니까?\n제출 후에는 수정 및 재투표가 불가능합니다.`)) {
            try {
                await api.submitVote({
                    email: email.trim(),
                    code: verificationCode.trim(),
                    candidateId: SINGLE_CANDIDATE.id,
                    choice: selectedChoice // 'APPROVE' | 'REJECT'
                });

                // 브라우저 로컬 저장 (새로고침 방어)
                localStorage.setItem('huji_election_voted', 'true');
                localStorage.setItem('huji_election_choice', selectedChoice);

                setHasVoted(true);
                setMyVote(selectedChoice);

                // 서버의 최신 집계 다시 동기화
                await fetchVoteStats();

                setIsModalOpen(false);
                alert("🎉 투표가 성공적으로 완료되었습니다! 소중한 참여 감사드립니다.");
            } catch (err: any) {
                alert(err.response?.data?.message || "투표 처리 중 오류가 발생했습니다.");
            }
        }
    };

    const totalVotes = voteStats.approve + voteStats.reject;
    const approveRate = totalVotes === 0 ? 0 : Math.round((voteStats.approve / totalVotes) * 100);
    const rejectRate = totalVotes === 0 ? 0 : 100 - approveRate;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-12 md:space-y-16 pb-12">
            {/* SEO & Helmet */}
            <Helmet>
                <title>학생회장 선거 | SKAI 이스라엘 한인 학생회</title>
                <meta name="description" content="히브리대학교 한인학생회장 단일 후보 찬반 투표. 재학생 여러분의 소중한 한 표를 행사해주세요." />
                <meta property="og:title" content="SKAI 학생회장 선거 | 단일 후보 찬반 투표" />
                <meta property="og:description" content="히브리대 한인학생회장 단일 후보 찬반 투표 진행 중" />
                <meta property="og:url" content="https://skaisrael.com/election" />
            </Helmet>

            {/* Hero Section */}
            <section className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-slate-900 text-white min-h-[340px] sm:min-h-[400px] md:min-h-[460px] flex items-center shadow-2xl mx-4 sm:mx-0">
                <div className="absolute inset-0 opacity-25 bg-[url('https://images.unsplash.com/photo-1544971587-b842c27f8e14?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-slate-950/90 md:from-slate-950 md:via-slate-950/70 to-transparent"></div>

                <div className="relative z-10 px-6 sm:px-8 md:px-16 w-full py-12 md:py-0">
                    <div className="max-w-2xl">
                        <span className="inline-block px-3 py-1.5 md:px-4 bg-indigo-600 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-3 md:mb-4">
                            HUJI Korean Election 2026
                        </span>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-4 md:mb-6 leading-tight tracking-tight">
                            학생회장 선거<br />
                            <span className="text-indigo-400">단일 후보</span> 찬반 투표
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-slate-300 font-medium leading-relaxed mb-6 md:mb-8 max-w-xl">
                            여러분의 소중한 한 표가 히브리대 한인학생회의 내일을 만듭니다.<br className="hidden sm:inline" />
                            히브리대 공식 웹메일(<span className="text-indigo-400 font-bold">@mail.huji.ac.il</span>) 인증을 통해 간편하게 투표에 참여하세요.
                        </p>

                        <div>
                            {!hasVoted ? (
                                <button
                                    onClick={openVoteModal}
                                    className="px-6 md:px-8 py-3.5 md:py-4 bg-white text-slate-950 rounded-2xl font-black text-center text-sm hover:bg-white/95 hover:shadow-xl hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
                                >
                                    찬반 투표 참여하기 <span>→</span>
                                </button>
                            ) : (
                                <div className="inline-flex items-center gap-3 px-6 md:px-8 py-3.5 md:py-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 rounded-2xl font-black text-sm">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                    투표 완료 ({myVote === 'APPROVE' ? '찬성' : '반대'})
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 2-Card Row: 후보자 프로필 & 주요 공약 */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 px-4 sm:px-0">
                {/* 후보자 기본 정보 카드 */}
                <div className="lg:col-span-5 p-6 md:p-8 bg-white border border-slate-100 rounded-3xl md:rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-4 right-6 text-slate-100 font-black text-4xl pointer-events-none">CANDIDATE</div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                단일 후보
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">{SINGLE_CANDIDATE.school}</span>
                        </div>

                        <div className="flex flex-col items-center text-center pt-2">
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden shadow-lg border-4 border-slate-50 mb-4">
                                <img
                                    src={SINGLE_CANDIDATE.imageUrl}
                                    alt={SINGLE_CANDIDATE.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-1">{SINGLE_CANDIDATE.name}</h2>
                            <p className="text-xs font-bold text-indigo-600">{SINGLE_CANDIDATE.major}</p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 md:p-5 text-center">
                            <p className="text-xs md:text-sm font-bold text-slate-700 leading-relaxed italic">
                                "{SINGLE_CANDIDATE.slogan}"
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 relative z-10">
                        {!hasVoted && (
                            <button
                                onClick={openVoteModal}
                                className="w-full py-3.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md"
                            >
                                이 후보에게 투표하기
                            </button>
                        )}
                    </div>
                </div>

                {/* 주요 공약 카드 */}
                <div className="lg:col-span-7 p-6 md:p-8 bg-white border border-slate-100 rounded-3xl md:rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-4 right-6 text-slate-100 font-black text-4xl pointer-events-none">PLEDGES</div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-slate-900">핵심 공약 안내</h3>
                                <p className="text-xs text-slate-400 font-medium">유권자를 위한 주요 실천 계획입니다.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {SINGLE_CANDIDATE.pledges.map((pledge, idx) => (
                                <div key={idx} className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-100/50">
                                    <span className="w-5 h-5 rounded-lg bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                        {idx + 1}
                                    </span>
                                    <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
                                        {pledge}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-[11px] font-medium text-slate-400 mt-6 pt-4 border-t border-slate-100 relative z-10">
                        공약 관련 질의사항은 한인회 공식 메일 또는 학생회 임원진에게 문의하실 수 있습니다.
                    </p>
                </div>
            </section>

            {/* 실시간 득표율 현황 (투표 완료자에게 노출) */}
            {hasVoted && (
                <section className="p-6 md:p-8 bg-white border border-indigo-100 rounded-3xl md:rounded-[2.5rem] shadow-sm relative overflow-hidden mx-4 sm:mx-0 animate-in slide-in-from-bottom-6 duration-500">
                    <div className="absolute top-4 right-6 text-slate-50 font-black text-4xl pointer-events-none">STATS</div>

                    <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                        <div className="text-center space-y-1">
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] bg-indigo-50 px-3 py-1 rounded-full">
                                Live Turnout
                            </span>
                            <h3 className="text-xl md:text-2xl font-black text-slate-900">실시간 찬반 집계 현황</h3>
                            <p className="text-xs font-medium text-slate-500">투표에 참여해주신 분들께 제공되는 실시간 집계 데이터입니다.</p>
                        </div>

                        <div className="space-y-4 pt-2">
                            {/* 찬성 바 */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs sm:text-sm font-black">
                                    <span className="text-indigo-600 flex items-center gap-1.5">
                                        <span>👍 찬성</span>
                                        {myVote === 'APPROVE' && <span className="text-[9px] bg-indigo-50 px-2 py-0.5 rounded-md font-bold">내 투표</span>}
                                    </span>
                                    <span className="text-slate-900">{approveRate}% <span className="text-slate-400 font-medium">({voteStats.approve}표)</span></span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                                    <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${approveRate}%` }}></div>
                                </div>
                            </div>

                            {/* 반대 바 */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs sm:text-sm font-black">
                                    <span className="text-rose-500 flex items-center gap-1.5">
                                        <span>👎 반대</span>
                                        {myVote === 'REJECT' && <span className="text-[9px] bg-rose-50 px-2 py-0.5 rounded-md font-bold">내 투표</span>}
                                    </span>
                                    <span className="text-slate-900">{rejectRate}% <span className="text-slate-400 font-medium">({voteStats.reject}표)</span></span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                                    <div className="h-full bg-rose-400 transition-all duration-1000" style={{ width: `${rejectRate}%` }}></div>
                                </div>
                            </div>

                            <div className="text-right text-[11px] font-bold text-slate-400 pt-1">
                                총 투표수: {totalVotes}표
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* 하단 투표 유의사항 카드 */}
            <section className="p-6 md:p-8 bg-white border border-slate-100 rounded-3xl md:rounded-[2.5rem] shadow-sm relative overflow-hidden mx-4 sm:mx-0">
                <div className="absolute top-4 right-6 text-slate-50 font-black text-4xl pointer-events-none">INFO</div>
                <div className="relative z-10 space-y-3">
                    <h4 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
                        <span>📌</span> 선거 유의사항
                    </h4>
                    <ul className="text-slate-500 font-medium space-y-2 text-xs md:text-sm list-disc list-inside leading-relaxed">
                        <li>본 투표는 <strong className="text-slate-800">히브리대학교 웹메일(@mail.huji.ac.il)</strong> 인증을 완료한 유권자에 한해 1인 1표로 진행됩니다.</li>
                        <li>투표 제출 완료 후에는 어떠한 경우에도 선택을 변경하거나 재투표할 수 없습니다.</li>
                        <li>이메일 인증 기록과 실제 투표 데이터는 분리되어 <strong className="text-slate-800">철저한 비밀 투표(익명)</strong>가 보장됩니다.</li>
                    </ul>
                </div>
            </section>

            {/* 이메일 인증 & 투표 모달 */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={closeModal}></div>

                    <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 sm:p-8 md:p-10 w-full max-w-md relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <button
                            onClick={closeModal}
                            className="absolute top-6 right-6 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                        >
                            ✕
                        </button>

                        {/* STEP 1: 히브리대 이메일 인증 */}
                        {step === 'EMAIL_VERIFY' && (
                            <div className="space-y-6">
                                <div className="text-center space-y-1.5">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center font-black text-xl mb-1">
                                        ✉️
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">유권자 본인 인증</h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        히브리대 웹메일(<span className="text-indigo-600 font-bold">@mail.huji.ac.il</span>)로 인증합니다.
                                    </p>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            placeholder="username@mail.huji.ac.il"
                                            value={email}
                                            disabled={isEmailVerified}
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
                                            className="bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                                        >
                                            {isSendingCode ? "발송중..." : isEmailCodeSent ? "재발송" : "인증번호"}
                                        </button>
                                    </div>

                                    {emailMsg.text && (
                                        <p className={`text-xs font-bold ${emailMsg.color}`}>{emailMsg.text}</p>
                                    )}

                                    {isEmailCodeSent && !isEmailVerified && (
                                        <div className="flex gap-2 pt-2 animate-in fade-in">
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
                                                확인
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: 찬성 / 반대 선택 및 제출 */}
                        {step === 'VOTE' && (
                            <div className="space-y-6">
                                <div className="text-center space-y-1">
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                        인증 완료: {email}
                                    </span>
                                    <h3 className="text-xl font-black text-slate-900 pt-2">찬반 투표</h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        <strong className="text-slate-800">{SINGLE_CANDIDATE.name}</strong> 후보의 회장 당선에 대해 투표해주세요.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedChoice('APPROVE')}
                                        className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${selectedChoice === 'APPROVE'
                                                ? 'border-indigo-600 bg-indigo-50/60 shadow-md text-indigo-700'
                                                : 'border-slate-100 bg-slate-50/50 hover:border-slate-300 text-slate-700'
                                            }`}
                                    >
                                        <span className="text-3xl">👍</span>
                                        <span className="font-black text-base">찬성</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedChoice('REJECT')}
                                        className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${selectedChoice === 'REJECT'
                                                ? 'border-rose-500 bg-rose-50/60 shadow-md text-rose-600'
                                                : 'border-slate-100 bg-slate-50/50 hover:border-slate-300 text-slate-700'
                                            }`}
                                    >
                                        <span className="text-3xl">👎</span>
                                        <span className="font-black text-base">반대</span>
                                    </button>
                                </div>

                                <button
                                    onClick={handleVoteSubmit}
                                    disabled={!selectedChoice}
                                    className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${selectedChoice
                                            ? 'bg-slate-900 hover:bg-indigo-600 text-white shadow-lg'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    투표 제출하기 →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Election;
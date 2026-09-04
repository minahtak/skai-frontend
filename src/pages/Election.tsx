import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Candidate } from '../types';
import { api } from '../api';

// ==========================================
// 1. 단일 후보 정보
// ==========================================
const SINGLE_CANDIDATE: Candidate = {
    id: 1,
    candidateNumber: 1,
    name: "하세윤",
    school: "The Hebrew University of Jerusalem",
    major: "국제관계학 & 경영학",
    slogan: "입학부터 졸업까지 버팀목이 되는 학생회를 만들겠습니다",
    imageUrl: "https://cdn.skaisrael.com/3a8405a6-cef0-46ab-88f2-0072f0b582b6_%ED%95%98%EC%84%B8%EC%9C%A4.jpg",
    pledges: [
        "학업·어학 관련 정보 및 지원 확대",
        "학교 생활·학사 행정 가이드북 및 이스라엘 정착 팁 사이트 구축",
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

    // 폼 입력 상태
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [emailMsg, setEmailMsg] = useState({ text: '', color: '' });
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        const savedVoted = localStorage.getItem('huji_election_voted');
        const savedChoice = localStorage.getItem('huji_election_choice') as VoteChoice | null;

        if (savedVoted === 'true') {
            setHasVoted(true);
            if (savedChoice) setMyVote(savedChoice);
        }

        fetchVoteStats();
    }, []);

    // @mail.huji.ac.il 전용 유효성 검사
    const isHujiEmail = (inputEmail: string) => {
        const hujiRegex = /^[a-zA-Z0-9._%+-]+@mail\.huji\.ac\.il$/i;
        return hujiRegex.test(inputEmail.trim());
    };

    // 1. 인증번호 발송 요청
    const handleSendCode = async () => {
        const cleanEmail = email.trim();
        if (!cleanEmail) {
            return setEmailMsg({ text: "이메일을 입력해주세요.", color: "text-red-500" });
        }
        if (!isHujiEmail(cleanEmail)) {
            return setEmailMsg({
                text: "히브리대학교 공식 이메일만 유효합니다.",
                color: "text-red-500"
            });
        }

        try {
            setIsSendingCode(true);
            setEmailMsg({ text: "인증 코드를 발송 중입니다...", color: "text-slate-500" });
            await api.sendVoteEmailCode(cleanEmail);
            setIsEmailCodeSent(true);
            setEmailMsg({ text: "인증번호가 발송되었습니다. 메일함을 확인해주세요.", color: "text-emerald-600" });
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || "";

            // 이미 투표한 이메일이면 즉시 개표 현황 노출
            if (errorMsg.includes("이미") || errorMsg.includes("완료")) {
                setHasVoted(true);
                localStorage.setItem('huji_election_voted', 'true');
                await fetchVoteStats();
                return;
            }

            setEmailMsg({ text: errorMsg || "인증 코드 발송에 실패했습니다.", color: "text-red-500" });
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
            setIsVerifying(true);
            const result = await api.verifyVoteEmailCode(email.trim(), verificationCode.trim());
            if (result) {
                setIsEmailVerified(true);
                setEmailMsg({ text: "본인 인증 완료! 아래에서 찬성 또는 반대를 선택해주세요.", color: "text-indigo-600" });
            } else {
                alert("인증번호가 일치하지 않거나 만료되었습니다.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "인증 확인 중 오류가 발생했습니다.");
        } finally {
            setIsVerifying(false);
        }
    };

    // 3. 찬/반 투표 최종 제출
    const handleVoteSubmit = async () => {
        if (!selectedChoice) {
            return alert("찬성 또는 반대를 선택해주세요.");
        }

        const choiceLabel = selectedChoice === 'APPROVE' ? '찬성' : '반대';
        if (window.confirm(`[${SINGLE_CANDIDATE.name} 후보에게 "${choiceLabel}"]으로 투표하시겠습니까?\n투표 후에는 수정 및 재투표가 불가능합니다.`)) {
            try {
                setIsSubmitting(true);
                await api.submitVote({
                    email: email.trim(),
                    code: verificationCode.trim(),
                    candidateId: SINGLE_CANDIDATE.id,
                    choice: selectedChoice
                });

                localStorage.setItem('huji_election_voted', 'true');
                localStorage.setItem('huji_election_choice', selectedChoice);

                setHasVoted(true);
                setMyVote(selectedChoice);
                await fetchVoteStats();

                alert("투표가 성공적으로 완료되었습니다! 참여해주셔서 감사합니다.");
            } catch (err: any) {
                alert(err.response?.data?.message || "투표 처리 중 오류가 발생했습니다.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const totalVotes = voteStats.approve + voteStats.reject;
    const approveRate = totalVotes === 0 ? 0 : Math.round((voteStats.approve / totalVotes) * 100);
    const rejectRate = totalVotes === 0 ? 0 : 100 - approveRate;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 pb-20 px-3.5 sm:px-6 animate-in fade-in duration-300">
            <Helmet>
                <title>SKAI ｜ 학생회장 선거</title>
                <meta name="description" content="히브리대학교 한인학생회장 단일 후보 찬반 투표" />
            </Helmet>

            {/* 1. 모바일 맞춤 헤더 */}
            <header className="text-center pt-2 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    2026 HUJI ELECTION
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    히브리대 한인학생회장 선거
                </h1>

                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed px-2">
                    학교 메일(<span className="text-indigo-600 font-bold">@mail.huji.ac.il</span>) 인증 후 소중한 한 표를 행사해주세요.
                </p>
            </header>

            {/* 2. 메인 투표함 카드 */}
            <section className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-lg shadow-slate-100">
                {/* 상황 A: 이미 투표를 마친 경우 (간결한 안내 문구 + 실시간 개표율) */}
                {hasVoted ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                이미 투표를 완료하셨습니다.
                            </div>
                            {myVote && (
                                <span className="text-xs font-medium text-slate-400">
                                    내 선택: <strong className="text-slate-700 font-bold">{myVote === 'APPROVE' ? '찬성' : '반대'}</strong>
                                </span>
                            )}
                        </div>

                        {/* 실시간 찬반 개표 현황 */}
                        <div className="space-y-3.5 pt-1">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                    <span>📊</span> 실시간 개표 현황
                                </h3>
                                <span className="text-[11px] font-bold text-slate-400">총 {totalVotes}표 참여</span>
                            </div>

                            <div className="space-y-2.5">
                                {/* 찬성 바 */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-indigo-600 flex items-center gap-1">
                                            <span>찬성</span>
                                            {myVote === 'APPROVE' && <span className="text-[10px] bg-indigo-50 px-1 py-0.2 rounded font-black text-indigo-600">내 선택</span>}
                                        </span>
                                        <span className="text-slate-800 font-black">{approveRate}% <span className="text-slate-400 font-normal">({voteStats.approve}표)</span></span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                        <div className="bg-indigo-600 h-full transition-all duration-700" style={{ width: `${approveRate}%` }}></div>
                                    </div>
                                </div>

                                {/* 반대 바 */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-rose-500 flex items-center gap-1">
                                            <span>반대</span>
                                            {myVote === 'REJECT' && <span className="text-[10px] bg-rose-50 px-1 py-0.2 rounded font-black text-rose-600">내 선택</span>}
                                        </span>
                                        <span className="text-slate-800 font-black">{rejectRate}% <span className="text-slate-400 font-normal">({voteStats.reject}표)</span></span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                        <div className="bg-rose-400 h-full transition-all duration-700" style={{ width: `${rejectRate}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 상황 B: 투표 진행 중인 경우 */
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                                <span>🗳️</span> 투표하기
                            </h2>
                            <span className="text-[11px] font-bold text-slate-400">1인 1표 &bull; 비밀투표</span>
                        </div>

                        {/* 1단계: 웹메일 인증 */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-slate-600 block">
                                히브리대 이메일 인증
                            </label>

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
                                    className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                                />
                                <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={isSendingCode || isEmailVerified}
                                    className="px-3.5 sm:px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shrink-0 transition-all"
                                >
                                    {isSendingCode ? "발송 중" : isEmailCodeSent ? "재발송" : "인증번호 받기"}
                                </button>
                            </div>

                            {/* 6자리 코드 입력 */}
                            {isEmailCodeSent && !isEmailVerified && (
                                <div className="flex gap-2 pt-1 animate-in fade-in duration-200">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="인증번호 6자리 입력"
                                        value={verificationCode}
                                        onChange={e => setVerificationCode(e.target.value)}
                                        className="flex-1 min-w-0 bg-slate-50 border border-indigo-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold tracking-widest text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVerifyCode}
                                        disabled={isVerifying}
                                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shrink-0 transition-all"
                                    >
                                        {isVerifying ? "확인 중" : "인증 확인"}
                                    </button>
                                </div>
                            )}

                            {emailMsg.text && (
                                <p className={`text-[11px] font-bold ${emailMsg.color}`}>{emailMsg.text}</p>
                            )}
                        </div>

                        {/* 2단계: 찬성 / 반대 기표 영역 */}
                        {isEmailVerified ? (
                            <div className="space-y-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-3 duration-300">
                                <p className="text-xs text-center font-bold text-slate-700">
                                    <strong className="text-indigo-600">{SINGLE_CANDIDATE.name}</strong> 후보 당선에 투표해주세요
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedChoice('APPROVE')}
                                        className={`py-4 px-2 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                                            selectedChoice === 'APPROVE'
                                                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span className="text-2xl">👍</span>
                                        <span className="text-base font-black">찬성</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedChoice('REJECT')}
                                        className={`py-4 px-2 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                                            selectedChoice === 'REJECT'
                                                ? 'border-rose-500 bg-rose-50/70 text-rose-900 ring-2 ring-rose-200 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span className="text-2xl">👎</span>
                                        <span className="text-base font-black">반대</span>
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleVoteSubmit}
                                    disabled={!selectedChoice || isSubmitting}
                                    className={`w-full py-3.5 rounded-xl font-black text-xs sm:text-sm transition-all shadow-md ${
                                        selectedChoice
                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    }`}
                                >
                                    {isSubmitting ? "투표 처리 중..." : selectedChoice ? `[${selectedChoice === 'APPROVE' ? '찬성' : '반대'}] 투표 제출하기 →` : "찬성 또는 반대를 선택해주세요"}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-[11px] font-bold text-slate-400">
                                    이메일 인증을 완료하시면 찬/반 투표 버튼이 나타납니다.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* 3. 후보자 프로필 및 주요 공약 섹션 (모바일 최적화 & 공약 1열 종대 배치) */}
            <section className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
                {/* 후보자 기본 프로필 */}
                <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                        <img
                            src={SINGLE_CANDIDATE.imageUrl}
                            alt={SINGLE_CANDIDATE.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                        <span className="inline-block px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-black">
                            기호 1번 단일 후보
                        </span>
                        <h2 className="text-xl font-black text-slate-900 truncate">{SINGLE_CANDIDATE.name}</h2>
                        <p className="text-xs font-bold text-indigo-600">{SINGLE_CANDIDATE.major}</p>
                        <p className="text-[11px] text-slate-400 font-medium truncate">{SINGLE_CANDIDATE.school}</p>
                    </div>
                </div>

                {/* 슬로건 */}
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs font-bold text-slate-700 italic">
                        "{SINGLE_CANDIDATE.slogan}"
                    </p>
                </div>

                {/* 핵심 공약 (2열 그리드 제거 ➔ 하나씩 쫙 내려가는 1열 종대 레이아웃) */}
                <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>📌</span> 주요 공약
                    </h3>

                    <div className="space-y-2.5">
                        {SINGLE_CANDIDATE.pledges.map((pledge, idx) => (
                            <div 
                                key={idx} 
                                className="p-3.5 bg-slate-50/90 border border-slate-100 rounded-2xl flex items-start gap-3 hover:bg-slate-50 transition-colors"
                            >
                                <span className="w-5 h-5 rounded-lg bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                </span>
                                <p className="text-xs sm:text-sm font-bold text-slate-700 leading-snug">
                                    {pledge}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. 유의사항 */}
            <footer className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-700">선거 유의사항</p>
                <ul className="text-slate-500 font-medium space-y-1 text-[11px] list-disc list-inside leading-relaxed">
                    <li>투표는 <strong className="text-slate-700">@mail.huji.ac.il</strong> 인증을 거쳐 1인 1표로 진행됩니다.</li>
                    <li>제출 후에는 수정이 불가능하며, 익명이 완벽히 보장됩니다.</li>
                </ul>
            </footer>
        </div>
    );
};

export default Election;
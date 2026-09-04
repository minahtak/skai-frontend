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
    major: "Business Administration",
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

    // 폼 입력 상태 (모달 없이 인라인 관리)
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
            setIsVerifying(true);
            const result = await api.verifyVoteEmailCode(email.trim(), verificationCode.trim());
            if (result) {
                setIsEmailVerified(true);
                setEmailMsg({ text: "🎉 본인 인증 완료! 아래에서 찬성 또는 반대를 선택해주세요.", color: "text-indigo-600" });
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
        if (window.confirm(`[${SINGLE_CANDIDATE.name} 후보에게 "${choiceLabel}"]으로 투표하시겠습니까?\n제출 후에는 수정 및 재투표가 불가능합니다.`)) {
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

                alert("🎉 투표가 성공적으로 완료되었습니다! 참여해주셔서 감사합니다.");
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
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 pb-24 px-4 sm:px-6 animate-in fade-in duration-500">
            {/* SEO 설정 */}
            <Helmet>
                <title>학생회장 선거 | SKAI 이스라엘 한인 학생회</title>
                <meta name="description" content="히브리대학교 한인학생회장 단일 후보 찬반 투표" />
            </Helmet>

            {/* 1. 선거 헤더 (홈 화면 배너 탈피, 공식 투표소 스타일) */}
            <header className="text-center pt-4 pb-2 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-bold shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    2026 HUJI ELECTION &bull; 온라인 투표 진행 중
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                    제대 학생회장 선거 찬반 투표
                </h1>

                <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
                    히브리대학교 한인 유학생을 위한 공식 선거 투표소입니다.<br className="hidden sm:inline" />
                    웹메일(<span className="text-indigo-600 font-bold">@mail.huji.ac.il</span>) 인증 후 소중한 한 표를 행사해주세요.
                </p>
            </header>

            {/* 2. 메인 투표함 섹션 (인라인 기표소) */}
            <section className="bg-white border-2 border-indigo-100/80 rounded-[2.5rem] p-6 sm:p-10 shadow-xl shadow-indigo-50/50 relative overflow-hidden">
                {/* 상단 탭/스텝 안내 */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-8">
                    <div className="flex items-center gap-2.5">
                        <span className="text-2xl">🗳️</span>
                        <div>
                            <h2 className="text-lg md:text-xl font-black text-slate-900">온라인 투표함</h2>
                            <p className="text-xs text-slate-400 font-medium">1인 1표 &bull; 철저한 비밀투표 보장</p>
                        </div>
                    </div>

                    {/* 진행 단계 배지 */}
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <span className={`px-2.5 py-1 rounded-lg transition-colors ${
                            isEmailVerified ? 'bg-emerald-50 text-emerald-600 font-black' : 'bg-indigo-600 text-white font-black'
                        }`}>
                            1. 본인인증 {isEmailVerified && '✓'}
                        </span>
                        <span className="text-slate-300">→</span>
                        <span className={`px-2.5 py-1 rounded-lg transition-colors ${
                            hasVoted ? 'bg-emerald-50 text-emerald-600 font-black' : isEmailVerified ? 'bg-indigo-600 text-white font-black' : 'bg-slate-100 text-slate-400'
                        }`}>
                            2. 찬/반 표결
                        </span>
                    </div>
                </div>

                {/* 상황 A: 이미 투표를 마친 경우 */}
                {hasVoted ? (
                    <div className="text-center py-6 space-y-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 text-3xl shadow-sm mb-2">
                            ✓
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-2xl font-black text-slate-900">투표가 정상적으로 완료되었습니다</h3>
                            <p className="text-sm font-medium text-slate-500">
                                유권자님의 선택: <span className="font-black text-indigo-600">{myVote === 'APPROVE' ? '👍 찬성' : '👎 반대'}</span>
                            </p>
                            <p className="text-xs text-slate-400 pt-1">
                                인증 기록과 실제 투표 데이터는 분리되어 익명성이 철저히 보장되었습니다.
                            </p>
                        </div>

                        {/* 실시간 찬반 개표 현황 */}
                        <div className="max-w-xl mx-auto pt-6 border-t border-slate-100 space-y-4 text-left">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Live Turnout (실시간 개표율)</span>
                                <span className="text-xs font-bold text-slate-400">총 {totalVotes}명 참여</span>
                            </div>

                            <div className="space-y-3">
                                {/* 찬성 */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-indigo-600 font-black flex items-center gap-1.5">
                                            <span>찬성</span>
                                            {myVote === 'APPROVE' && <span className="text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700">내 투표</span>}
                                        </span>
                                        <span className="text-slate-800 font-black">{approveRate}% ({voteStats.approve}표)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                        <div className="bg-indigo-600 h-full transition-all duration-700" style={{ width: `${approveRate}%` }}></div>
                                    </div>
                                </div>

                                {/* 반대 */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-rose-500 font-black flex items-center gap-1.5">
                                            <span>반대</span>
                                            {myVote === 'REJECT' && <span className="text-[10px] bg-rose-50 px-1.5 py-0.5 rounded text-rose-600">내 투표</span>}
                                        </span>
                                        <span className="text-slate-800 font-black">{rejectRate}% ({voteStats.reject}표)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                        <div className="bg-rose-400 h-full transition-all duration-700" style={{ width: `${rejectRate}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 상황 B: 투표 진행 중인 경우 (1단계 인증 -> 2단계 찬반 선택) */
                    <div className="space-y-8">
                        {/* 1단계: 웹메일 인증 영역 */}
                        <div className="bg-slate-50/80 rounded-2xl p-5 md:p-6 border border-slate-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                                    <span>✉️</span> 히브리대 웹메일 본인 인증
                                </label>
                                {isEmailVerified && (
                                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                        ✓ 인증 완료
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2.5">
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
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100 disabled:text-slate-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={isSendingCode || isEmailVerified}
                                    className="px-5 py-3 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-black whitespace-nowrap transition-all shadow-sm"
                                >
                                    {isSendingCode ? "발송 중..." : isEmailCodeSent ? "인증번호 재발송" : "인증번호 받기"}
                                </button>
                            </div>

                            {/* 인증번호 입력창 (발송 후 & 아직 미인증 시 노출) */}
                            {isEmailCodeSent && !isEmailVerified && (
                                <div className="pt-2 flex flex-col sm:flex-row gap-2.5 animate-in fade-in duration-300">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="메일로 전송된 6자리 번호 입력"
                                        value={verificationCode}
                                        onChange={e => setVerificationCode(e.target.value)}
                                        className="flex-1 bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold tracking-widest text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVerifyCode}
                                        disabled={isVerifying}
                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black whitespace-nowrap transition-all shadow-sm"
                                    >
                                        {isVerifying ? "확인 중..." : "인증 확인"}
                                    </button>
                                </div>
                            )}

                            {emailMsg.text && (
                                <p className={`text-xs font-bold pt-1 ${emailMsg.color}`}>{emailMsg.text}</p>
                            )}
                        </div>

                        {/* 2단계: 찬성 / 반대 기표 영역 (인증 완료 시 화면에 즉시 노출) */}
                        {isEmailVerified ? (
                            <div className="space-y-6 animate-in slide-in-from-top-4 duration-500 pt-2 border-t border-slate-100">
                                <div className="text-center space-y-1">
                                    <span className="text-[11px] font-black uppercase text-indigo-600 tracking-wider">Ballot Choice</span>
                                    <h3 className="text-xl font-black text-slate-900">
                                        기호 1번 <span className="text-indigo-600">{SINGLE_CANDIDATE.name}</span> 후보에 대한 찬반을 선택해주세요
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium">원하시는 선택지를 누른 후 하단의 [투표 제출하기] 버튼을 눌러주세요.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                                    {/* 찬성 버튼 */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedChoice('APPROVE')}
                                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2.5 transition-all ${
                                            selectedChoice === 'APPROVE'
                                                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-md ring-4 ring-indigo-50'
                                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span className="text-4xl">👍</span>
                                        <span className="text-lg font-black tracking-tight">찬성</span>
                                        <span className="text-[11px] font-bold text-slate-400">후보의 당선에 동의합니다</span>
                                    </button>

                                    {/* 반대 버튼 */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedChoice('REJECT')}
                                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2.5 transition-all ${
                                            selectedChoice === 'REJECT'
                                                ? 'border-rose-500 bg-rose-50/70 text-rose-900 shadow-md ring-4 ring-rose-50'
                                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span className="text-4xl">👎</span>
                                        <span className="text-lg font-black tracking-tight">반대</span>
                                        <span className="text-[11px] font-bold text-slate-400">후보의 당선에 반대합니다</span>
                                    </button>
                                </div>

                                {/* 최종 제출 버튼 */}
                                <div className="max-w-lg mx-auto pt-2">
                                    <button
                                        type="button"
                                        onClick={handleVoteSubmit}
                                        disabled={!selectedChoice || isSubmitting}
                                        className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg ${
                                            selectedChoice
                                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 hover:-translate-y-0.5'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                        }`}
                                    >
                                        {isSubmitting ? "투표 제출 중..." : selectedChoice ? `[${selectedChoice === 'APPROVE' ? '찬성' : '반대'}] 투표 제출하기 →` : "찬성 또는 반대를 먼저 선택해주세요"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* 미인증 상태일 때 친절한 안내 */
                            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                <p className="text-xs md:text-sm font-bold text-slate-400">
                                    위 입력창에서 <strong className="text-slate-600">히브리대 웹메일 인증</strong>을 완료하시면 찬/반 기표 버튼이 활성화됩니다.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* 3. 후보자 프로필 및 주요 공약 섹션 */}
            <section className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-10 shadow-sm space-y-8">
                <div className="border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Candidate Information</span>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1">후보자 소개 및 핵심 공약</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    {/* 왼쪽: 후보자 기본 프로필 */}
                    <div className="md:col-span-4 flex flex-col items-center text-center p-6 bg-slate-50/80 rounded-3xl border border-slate-100">
                        <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden shadow-md border-4 border-white mb-4 bg-slate-200">
                            <img
                                src={SINGLE_CANDIDATE.imageUrl}
                                alt={SINGLE_CANDIDATE.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black mb-2">
                            기호 1번 단일 후보
                        </span>
                        <h3 className="text-2xl font-black text-slate-900">{SINGLE_CANDIDATE.name}</h3>
                        <p className="text-xs font-bold text-indigo-600 mt-0.5">{SINGLE_CANDIDATE.major}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-1">{SINGLE_CANDIDATE.school}</p>

                        <div className="mt-4 pt-4 border-t border-slate-200/60 w-full text-center">
                            <p className="text-xs font-bold text-slate-700 italic leading-snug">
                                "{SINGLE_CANDIDATE.slogan}"
                            </p>
                        </div>
                    </div>

                    {/* 오른쪽: 핵심 공약 목록 */}
                    <div className="md:col-span-8 space-y-4">
                        <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <span>📌</span> 유권자를 위한 주요 실천 공약
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {SINGLE_CANDIDATE.pledges.map((pledge, idx) => (
                                <div key={idx} className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-start gap-3">
                                    <span className="w-5 h-5 rounded-lg bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                        {idx + 1}
                                    </span>
                                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                        {pledge}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 mt-4">
                            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                                후보자의 비전과 공약에 공감하신다면 위의 온라인 투표함에서 본인 인증 후 소중한 한 표를 행사해주시기 바랍니다.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. 하단 선거 유의사항 */}
            <footer className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 sm:p-8 space-y-3">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span>⚖️</span> 선거 및 투표 유의사항
                </h4>
                <ul className="text-slate-500 font-medium space-y-1.5 text-xs list-disc list-inside leading-relaxed">
                    <li>투표는 <strong className="text-slate-700">히브리대학교 공식 웹메일(@mail.huji.ac.il)</strong> 인증을 완료한 유권자에 한해 1인 1표로 진행됩니다.</li>
                    <li>투표 제출 완료 후에는 어떠한 경우에도 선택을 변경하거나 재투표할 수 없습니다.</li>
                    <li>본 선거는 웹메일 인증 정보와 투표 결과가 완벽히 분리되어 <strong className="text-slate-700">철저한 비밀 투표</strong>가 보장됩니다.</li>
                </ul>
            </footer>
        </div>
    );
};

export default Election;
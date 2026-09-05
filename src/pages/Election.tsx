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
                setEmailMsg({ text: "본인 인증이 완료되었습니다. 아래에서 찬성 또는 반대를 선택해주세요.", color: "text-indigo-600" });
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

                alert("투표가 성공적으로 완료되었습니다.");
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
                <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 pb-20 px-4 sm:px-6 animate-in fade-in duration-300">
            <Helmet>
                <title>SKAI ｜ 학생회장 선거</title>
                <meta name="description" content="히브리대학교 한인학생회장 단일 후보 찬반 투표" />
            </Helmet>

            {/* 1. 선거 헤더 */}
            <header className="text-center pt-2 sm:pt-4 pb-1 space-y-2.5 sm:space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    2026 HUJI ELECTION
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight break-keep">
                    히브리대 한인학생회장 선거
                </h1>

                <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-md mx-auto leading-relaxed break-keep">
                    히브리대학교 한인 학생회 공식 투표 페이지입니다.<br className="hidden sm:inline" />
                    학교 이메일(<span className="text-indigo-600 font-medium">@mail.huji.ac.il</span>) 인증 후 투표해 주세요.
                </p>
            </header>
            
            {/* 2. 메인 투표함 섹션 */}
            <section className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-sm relative">

                {/* 헤더 부분: 모바일 대응 및 글자 쪼개짐 방지 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 border-b border-slate-100 pb-4 mb-6">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">투표하기</h2>
                        <p className="text-[11px] sm:text-xs text-slate-400 whitespace-nowrap">1인 1표 · 비밀투표 보장</p>
                    </div>

                    {/* 우측 상태 인디케이터 */}
                    {hasVoted ? (
                        <div className="self-start sm:self-auto">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                투표 완료
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold whitespace-nowrap self-start sm:self-auto shrink-0">
                            <span className={`px-2.5 py-1 rounded-md transition-colors ${isEmailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-600 text-white'
                                }`}>
                                1. 본인인증
                            </span>
                            <span className="text-slate-300 text-xs">→</span>
                            <span className={`px-2.5 py-1 rounded-md transition-colors ${isEmailVerified ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                2. 찬/반 표결
                            </span>
                        </div>
                    )}
                </div>

                {/* 상황 A: 이미 투표를 완료한 경우 (개표율 삭제 및 마감 후 발표 안내) */}
                {hasVoted ? (
                    <div className="py-6 sm:py-8 text-center space-y-4 animate-in fade-in duration-300">
                        {/* 간결한 완료 심볼 */}
                        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold shadow-sm">
                            ✓
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 break-keep">
                                소중한 한 표가 정상적으로 등록되었습니다
                            </h3>
                            <p className="text-xs text-slate-500 break-keep">
                                히브리대학교 한인학생회장 선거에 참여해 주셔서 감사합니다.
                            </p>
                        </div>

                        {/* 개표 결과 안내 카드 */}
                        <div className="max-w-md mx-auto mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                                개표 결과 안내
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed break-keep">
                                선거의 공정성을 위해 <strong>실시간 개표율은 비공개</strong>로 진행되며, 최종 찬반 집계 결과는 <strong>투표 기간 종료 후 학생회 공식 공지</strong>를 통해 발표됩니다.
                            </p>
                            <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-400 break-keep">
                                ※ 웹메일 인증 기록과 실제 투표 데이터는 분리되어 익명성과 비밀투표가 철저히 보장됩니다.
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 상황 B: 투표 진행 중인 경우 */
                    <div className="space-y-6">
                        {/* 1단계: 웹메일 인증 영역 */}
                        <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-100 space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-700">
                                    히브리대 웹메일 인증
                                </label>
                                {isEmailVerified && (
                                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                        인증 완료
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
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
                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={isSendingCode || isEmailVerified}
                                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
                                >
                                    {isSendingCode ? "발송 중..." : isEmailCodeSent ? "인증번호 재발송" : "인증번호 받기"}
                                </button>
                            </div>

                            {isEmailCodeSent && !isEmailVerified && (
                                <div className="pt-1 flex flex-col sm:flex-row gap-2 animate-in fade-in duration-200">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="인증번호 6자리"
                                        value={verificationCode}
                                        onChange={e => setVerificationCode(e.target.value)}
                                        className="flex-1 bg-white border border-indigo-200 rounded-lg px-3.5 py-2.5 text-sm font-medium tracking-wider text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVerifyCode}
                                        disabled={isVerifying}
                                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
                                    >
                                        {isVerifying ? "확인 중..." : "인증 확인"}
                                    </button>
                                </div>
                            )}

                            {emailMsg.text && (
                                <p className={`text-xs font-medium pt-0.5 ${emailMsg.color}`}>{emailMsg.text}</p>
                            )}
                        </div>

                        {/* 2단계: 찬성 / 반대 기표 영역 */}
                        {isEmailVerified ? (
                            <div className="space-y-5 pt-2 border-t border-slate-100 animate-in fade-in duration-300">
                                <div className="text-center space-y-1">
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 break-keep">
                                        기호 1번 <span className="text-indigo-600">{SINGLE_CANDIDATE.name}</span> 후보 찬반 투표
                                    </h3>
                                    <p className="text-xs text-slate-400 break-keep">원하시는 선택지를 누른 후 투표 제출 버튼을 눌러주세요.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedChoice('APPROVE')}
                                        className={`p-4 sm:p-5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${selectedChoice === 'APPROVE'
                                                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm'
                                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                            }`}
                                    >
                                        <span className="text-base sm:text-lg font-bold">찬성</span>
                                        <span className="text-[11px] text-slate-400 font-medium">당선 동의</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedChoice('REJECT')}
                                        className={`p-4 sm:p-5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${selectedChoice === 'REJECT'
                                                ? 'border-slate-800 bg-slate-100 text-slate-950 shadow-sm'
                                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                            }`}
                                    >
                                        <span className="text-base sm:text-lg font-bold">반대</span>
                                        <span className="text-[11px] text-slate-400 font-medium">당선 반대</span>
                                    </button>
                                </div>

                                <div className="max-w-md mx-auto pt-1">
                                    <button
                                        type="button"
                                        onClick={handleVoteSubmit}
                                        disabled={!selectedChoice || isSubmitting}
                                        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${selectedChoice
                                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {isSubmitting
                                            ? "투표 제출 중..."
                                            : selectedChoice
                                                ? `[${selectedChoice === 'APPROVE' ? '찬성' : '반대'}] 투표 제출하기`
                                                : "찬성 또는 반대를 선택해주세요"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-5 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <p className="text-xs text-slate-400 font-medium break-keep">
                                    이메일 인증을 완료하시면 찬/반 선택 버튼이 활성화됩니다.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* 3. 후보자 프로필 및 주요 공약 섹션 */}
            <section className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                    <span className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider">Candidate Information</span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">후보자 소개 및 공약</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
                    {/* 프로필 카드 */}
                    <div className="md:col-span-4 flex flex-col items-center text-center p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden shadow-sm border-2 border-white mb-3 bg-slate-200">
                            <img
                                src={SINGLE_CANDIDATE.imageUrl}
                                alt={SINGLE_CANDIDATE.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{SINGLE_CANDIDATE.name}</h3>
                        <p className="text-xs font-semibold text-indigo-600 mt-0.5">{SINGLE_CANDIDATE.major}</p>
                        <p className="text-[11px] text-slate-400 font-normal mt-1">{SINGLE_CANDIDATE.school}</p>
                    </div>

                    {/* 공약 리스트 (1열 세로 배치) */}
                    <div className="md:col-span-8 space-y-2.5 sm:space-y-3">
                        <div className="flex flex-col gap-2.5">
                            {SINGLE_CANDIDATE.pledges.map((pledge, idx) => (
                                <div key={idx} className="p-3.5 sm:p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
                                    <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                        {idx + 1}
                                    </span>
                                    <p className="text-xs sm:text-sm font-medium text-slate-700 leading-snug pt-0.5 break-keep">
                                        {pledge}
                                    </p>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </section>

            {/* 4. 하단 선거 유의사항 */}
            <footer className="bg-slate-50 border border-slate-200/70 rounded-2xl p-5 sm:p-6 space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    선거 및 투표 유의사항
                </h4>
                <ul className="text-slate-500 font-normal space-y-1 text-xs list-disc list-inside leading-relaxed break-keep">
                    <li>투표는 <strong className="text-slate-700 font-medium">히브리대학교 공식 이메일(@mail.huji.ac.il)</strong> 인증을 완료한 유권자에 한해 1인 1표로 진행됩니다.</li>
                    <li>투표 제출 완료 후에는 선택을 변경하거나 재투표할 수 없습니다.</li>
                    <li>웹메일 인증 정보와 투표 결과 데이터는 분리 처리되어 <strong className="text-slate-700 font-medium">비밀 투표</strong>가 보장됩니다.</li>
                </ul>
            </footer>
        </div>
    );
};

export default Election;
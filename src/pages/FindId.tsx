import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const FindId: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const [foundId, setFoundId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const resultId = await api.findId(name, email);
            setFoundId(resultId); // 성공 시 아이디 저장 -> 결과 화면으로 전환됨
        } catch (err: any) {
            setError(err.message || "정보를 다시 확인해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-24 px-4">
            <div className="bg-white p-10 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-black text-slate-950 tracking-tight">Find ID</h1>
                    <p className="text-xs font-bold text-slate-400">가입 시 등록한 이름과 이메일을 입력해주세요.</p>
                </div>

                {/* 아이디를 찾기 전: 입력 폼 보여주기 */}
                {!foundId ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Name</label>
                            <input
                                type="text"
                                required
                                className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-xs"
                                placeholder="이름 입력"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-xs"
                                placeholder="example@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {error && <p className="text-[10px] font-bold text-red-500 text-center">{error}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                            {isLoading ? "찾는 중..." : "아이디 찾기"}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-8 py-4">
                        <div className="bg-indigo-50 p-6 rounded-2xl text-center border border-indigo-100">
                            <p className="text-xs font-bold text-indigo-400 mb-2">회원님의 아이디는</p>
                            <p className="text-2xl font-black text-indigo-600 tracking-wider">{foundId}</p>
                            <p className="text-xs font-bold text-indigo-400 mt-2">입니다.</p>
                        </div>

                        <Link
                            to="/login"
                            className="block w-full py-5 text-center bg-slate-950 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-slate-800 transition-all"
                        >
                            로그인하러 가기
                        </Link>
                    </div>
                )}

                <div className="text-center pt-6 border-t border-slate-50">
                    <Link to="/login" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors">
                        로그인 화면으로 돌아가기
                    </Link>
                </div>
            </div>
        </div >
    );
};

export default FindId;
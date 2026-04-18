import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { api } from '../api'; // api 가져오기

interface LoginProps {
  onLogin: (u: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();

  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  
  // 로그인 유지 체크박스 상태
  const [isKeepLogin, setIsKeepLogin] = useState(false);
  
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // 1. 로그인 요청 (실패 시 여기서 에러 발생 -> catch로 점프)
      const user = await api.login(username, password, isKeepLogin);

      // 2. 이중 안전장치 (혹시라도 에러 안나고 빈 값이 오면 에러 발생시키기)
      if (!user) {
        throw new Error("로그인 실패");
      }

      alert("로그인 되었습니다.");
      onLogin(user);
      
      navigate('/'); 

    } catch (err) {
      console.error(err);
      setError("아이디 또는 비밀번호를 확인해주세요.");
    }
  };

  return (
    <div className="max-w-md mx-auto py-24">
      <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">Sign In</h1>  
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 아이디 입력 */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Username (ID)</label>
            <input 
              type="text" 
              required 
              className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-xs" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Password</label>
            <input 
              type="password" 
              required 
              className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-xs" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>

          {/* 하단 옵션: 로그인 유지 & 아이디 찾기 / 비밀번호 변경 */}
          <div className="flex items-center justify-between px-1">
            {/* 왼쪽: 로그인 유지 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="keepLogin"
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer accent-slate-900"
                checked={isKeepLogin}
                onChange={(e) => setIsKeepLogin(e.target.checked)}
              />
              <label htmlFor="keepLogin" className="text-xs font-bold text-slate-500 cursor-pointer select-none">
                로그인 유지
              </label>
            </div>

            {/* 오른쪽: 아이디 찾기 / 비밀번호 변경 */}
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <Link to="/find-id" className="hover:text-indigo-600 transition-colors">아이디 찾기</Link>
              <span className="text-slate-200">|</span>
              <Link to="/reset-password" className="hover:text-indigo-600 transition-colors">비밀번호 변경</Link>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && <p className="text-[10px] font-bold text-red-500 text-center">{error}</p>}

          {/* 로그인 버튼 */}
          <button type="submit" className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-slate-800 transition-all">
            Continue
          </button>
        </form>

        <div className="text-center pt-6 border-t border-slate-50">
          <p className="text-[11px] font-bold text-slate-400">
            SKAI에 처음 오셨나요? <Link to="/join" className="text-indigo-600 hover:underline">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
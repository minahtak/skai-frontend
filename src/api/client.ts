/// <reference types="vite/client" />
import axios from 'axios';

// 백엔드 주소 (본인 환경에 맞게 수정)
// const BASE_URL = 'http://localhost:8080/api';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // CORS 쿠키 전송 필요 시 사용
});

// ★ 요청 인터셉터 (Request Interceptor)
// 요청을 보내기 직전에 "잠깐! 토큰 있나?" 확인해서 헤더에 끼워넣음
client.interceptors.request.use((config) => {
    // 1. 로컬 스토리지 확인 (로그인 유지 체크한 경우)
    let token = localStorage.getItem('accessToken');

    // 2. 없으면 세션 스토리지 확인 (체크 안 한 경우)
    if (!token) {
        token = sessionStorage.getItem('accessToken');
    }

    // 3. 토큰이 있으면 헤더에 'Bearer 토큰' 추가
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// ★ 응답 인터셉터 (Response Interceptor)
// 토큰이 만료되어 401 에러가 뜨면 자동으로 로그아웃 처리
client.interceptors.response.use(
    (response) => response,
    (error) => {
        // 에러가 났는데, 그 에러가 401(인증 실패)인 경우
        if (error.response && error.response.status === 401) {
            
            // ★ [핵심 수정] 요청했던 주소(url)가 'login'이 아닌 경우에만 튕겨내야 합니다.
            // 로그인 시도 중에 401이 뜨는 건 "비번 틀림"이므로 튕기면 안 됩니다.
            const requestUrl = error.config.url;
            
            // requestUrl에 '/login'이 포함되어 있지 않을 때만 실행
            if (!requestUrl.includes('/login')) {
                // 토큰 삭제 및 로그인 페이지로 이동
                localStorage.removeItem('accessToken');
                sessionStorage.removeItem('accessToken');
                window.location.href = '/login';
                
                return Promise.reject(error);
            }
        }
        
        // 로그인 시도 중인 401 에러는 여기서 그냥 통과되어
        // Login.tsx의 catch 블록으로 들어갑니다.
        return Promise.reject(error);
    }
);

export default client;
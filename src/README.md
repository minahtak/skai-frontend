<div align="center">
  <img width="800" alt="SKAI Banner" src="https://via.placeholder.com/800x250/1e293b/ffffff?text=SKAI" />
</div>

# 🇮🇱 SKAI | 이스라엘 한인 학생회 공식 웹사이트

이스라엘 내 한국인 유학생들의 학술적 성장과 안정적인 정착을 지원하는 자치 기구, **SKAI(Student Korean Association in Israel)**의 공식 웹 플랫폼입니다. 공지사항, 생활 가이드, 활동 갤러리, 학술 자료실 등 유학생들에게 필요한 핵심 정보를 제공합니다.

## 🛠 Tech Stack (기술 스택)
- **Frontend:** React, TypeScript, Tailwind CSS 
- **Backend:** Java, Spring Boot, Spring Data JPA, Spring Security
- **Database:** MySQL / H2
- **Storage:** Cloudflare R2

## 🚀 Getting Started (로컬 실행 방법)

이 프로젝트를 로컬 환경에서 실행하려면 프론트엔드와 백엔드 서버가 모두 실행되어야 합니다.

### Prerequisites (사전 준비)
- Node.js (v18 이상 권장)
- Java 17 이상 (백엔드 서버 구동용)

### Frontend Setup (프론트엔드 설정)

1. 패키지 설치:
   ```bash
   npm install

2. 환경 변수 설정:
프로젝트 루트 디렉토리에 .env 파일을 생성하고 백엔드 API 주소를 설정합니다.

VITE_API_BASE_URL=http://localhost:8080/api

3. 앱 실행:
npm run dev


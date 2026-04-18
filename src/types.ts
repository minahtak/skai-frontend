// src/types.ts

// 1. 공통으로 사용할 댓글 구조 (Backend: Comment Entity)
export interface Comment {
  id: number;
  writer: string;         // 백엔드: writer
  content: string;        // 백엔드: content
  regDate: string;        // 백엔드: regDate (String으로 옴)
  children?: Comment[];   // 백엔드: children (대댓글 리스트)
  
  // 필요한 경우 부모 ID (UI 로직용, 백엔드에서는 parent 객체로 관리되지만 DTO나 직렬화시 ID만 필요할 수 있음)
  parentId?: number; 
}

// 2. 사용자 역할 (Backend: Role Enum)
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  WRITER = 'WRITER',
  USER = 'USER'
}

// 3. 사용자 정보 (Backend: Member Entity)
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  school: string;
  birthDate: string;
  role: UserRole;
  joinDate: string;
  postCount?: number;
  
  // ★ 추가됨
  degreeLevel?: string; // BACHELOR, MASTER...
  major1?: string;
  major2?: string;
  major3?: string;
}

// 페이징 응답 공통 타입 (백엔드 Page 객체 구조)
export interface PageResponse<T> {
  content: T[];          // 실제 데이터 리스트
  totalPages: number;    // 전체 페이지 수
  totalElements: number; // 전체 데이터 개수
  number: number;        // 현재 페이지 번호 (0부터 시작)
  size: number;          // 페이지당 데이터 수
  first: boolean;
  last: boolean;
}

// 4. 공지사항 (Backend: Notice Entity)
export interface Notice {
  id: number;
  title: string;
  content: string;
  category: string;     // Official, Event ...
  targetSchool: string; // 히브리대, All ...
  writer: string;
  regDate: string;      // LocalDateTime -> String
  viewCount: number;
  pinned: boolean;      // isPinned -> pinned (JSON 변환 시 is가 빠짐)
}

// 5. 생활 정보 (Backend: Info Entity)
export type InfoCategory = 'Life' | 'Food' | 'Travel' | 'Jobs' | 'School' | 'FAQ' | 'Career';
export type InfoStatus = 'PENDING' | 'APPROVED' | 'REJECTED'; // 상태 타입 명시

export interface Info {
  id: number;
  title: string;
  content: string;
  writer: string;
  category: InfoCategory;
  
  // ★ 수정됨: 배열(tags) 대신 백엔드와 컴포넌트가 사용하는 개별 필드로 변경
  schoolTag?: string; 
  targetTag?: string;
  
  status: InfoStatus; // 백엔드에서 null이 아니라고 가정 (기본값 설정됨)
  rejectionReason?: string; // 반려 시 사유
  
  regDate: string;
  viewCount: number;
  
  comments?: any[]; // Comment 타입이 있다면 교체
}

// 6. 학술 자료 (Backend: Material Entity)
export interface Material {
  id: number;
  title: string;
  content: string;
  subject: string;
  professor?: string;
  school: string;
  major: string;
  category: string;
  language: string;
  translationType: 'Original' | 'AI' | 'Human';
  writer: string;
  googleDriveLink: string;
  viewCount: number;
  regDate: string;
  
  comments?: Comment[];
}

// 7. 갤러리 (Backend: Gallery Entity)
export interface GalleryItem {
  id: number;
  title: string;
  content: string;
  writer?: string; 

  regDate: string;
  images: string[];
  viewCount: number;

  comments?: Comment[];
  likes?: number;
  isLiked?: boolean; // 현재 로그인한 유저가 좋아요를 눌렀는지 여부
}

// 8. 임원진 (Backend: Executive Entity)
export interface Executive {
  id: number;
  
  // ★ [수정됨] 백엔드 JPA가 @OneToOne 관계인 Member 객체를 통째로 담아 보냅니다.
  // 따라서 memberId 숫자 하나만 있는 게 아니라, User(Member) 객체가 들어옵니다.
  // 프론트에서 member.id로 접근해서 사용하면 됩니다.
  member?: User; 
  
  // 만약 폼 전송용으로 id만 따로 관리한다면 아래 필드도 유지 가능 (선택사항)
  memberId?: number;

  role: string;    // 직책 (예: "Chairman")
  name: string;    // 표시 이름
  school: string;  // 표시 학교
  intro: string;
  imageUrl: string;
}
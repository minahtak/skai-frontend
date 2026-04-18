import client from './client'; // axios 인스턴스
import axios from 'axios'; // ★ R2 직접 업로드용 

export const api = {
    // ==========================================
    // 1. 공용 API (Notices)
    // ==========================================

    // 공지사항 목록 (페이징 정보 포함해서 리턴)
    getNotices: async (params?: {
        page?: number;      // 페이지 번호 (0부터 시작)
        school?: string;
        category?: string;
        keyword?: string;
        sort?: string;      // 정렬 기준 (LATEST, VIEWS)
    }) => {
        try {
            const query = new URLSearchParams();
            
            // 파라미터가 있을 때만 쿼리스트링에 추가
            if (params) {
                if (params.page !== undefined) query.append('page', String(params.page));
                if (params.school && params.school !== 'ALL') query.append('school', params.school);
                if (params.category && params.category !== 'ALL') query.append('category', params.category);
                if (params.keyword) query.append('keyword', params.keyword);
                if (params.sort) query.append('sort', params.sort);
            }

            // client.get 사용
            const response = await client.get(`/notices?${query.toString()}`);

            // ★ [핵심 수정] response.data 전체(PageResponse 객체)를 반환해야 함!
            return response.data; 

        } catch (e) {
            console.error("공지사항 로드 실패:", e);
            // 에러 시 빈 PageResponse 구조를 리턴해서 프론트가 안 깨지게 함
            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                number: 0,
                size: 10,
                first: true,
                last: true
            };
        }
    },

    // 공지사항 상세
    getNoticeDetail: async (id: number) => {
        try {
            const response = await client.get(`/notices/${id}`);
            return response.data;
        } catch (error) {
            console.error("❌ 공지사항 상세 에러:", error);
            return null;
        }
    },

    // 공지사항 작성 (Create)
    createNotice: async (data: any) => {
        try {
            await client.post('/notices', data);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    // 공지사항 수정 (Update)
    updateNotice: async (id: number, data: any) => {
        try {
            await client.put(`/notices/${id}`, data);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    // 공지사항 삭제 (Delete)
    deleteNotice: async (id: number) => {
        try {
            await client.delete(`/notices/${id}`);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    // 임원 목록 (About 페이지용)
    getExecutives: async () => {
        try {
            const response = await client.get('/executives');
            return response.data;
        } catch (error) {
            console.error("❌ 임원 목록 에러:", error);
            return [];
        }
    },

    // ==========================================
    // 2. 인증 (Auth) 
    // ==========================================

    login: async (username, password, isKeepLogin) => {
        try {
            const response = await client.post('/auth/login', { username, password });
            const { token, member } = response.data || {};

            if (!token) {
                throw new Error("로그인 실패: 토큰이 발급되지 않았습니다.");
            }

            if (isKeepLogin) {
                localStorage.setItem('accessToken', token);
                sessionStorage.removeItem('accessToken');
            } else {
                sessionStorage.setItem('accessToken', token);
                localStorage.removeItem('accessToken');
            }

            return member;

        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        }
    },

    signup: async (formData) => {
        try {
            const response = await client.post('/auth/join', formData);
            return response.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    logout: async () => {
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('accessToken');
        try {
            await client.post('/auth/logout');
        } catch (e) { }
    },

    checkAuth: async () => {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (!token) return null;

        try {
            const response = await client.get('/auth/me');
            return response.data;
        } catch (error) {
            localStorage.removeItem('accessToken');
            sessionStorage.removeItem('accessToken');
            return null;
        }
    },

    checkUsername: async (username: string) => {
        const response = await client.get(`/check-username?username=${username}`);
        return response.data;
    },

    checkEmail: async (email: string) => {
        const response = await client.get(`/check-email?email=${email}`);
        return response.data;
    },

    // 이메일 인증번호 발송 API
    sendEmailCode: async (email: string, type: string = 'JOIN') => {
        const response = await client.post(`/email/send-code?email=${encodeURIComponent(email)}&type=${type}`);
        return response.data;
    },

    // 이메일 인증번호 검증 API
    verifyEmailCode: async (email: string, code: string) => {
        const response = await client.post(`/email/verify-code?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
        return response.data; // true 또는 false 반환
    },

    // 아이디 찾기
    findId: async (name: string, email: string) => {
        try {
            const response = await client.post('/auth/find-id', { name, email });
            return response.data; // 찾은 아이디 반환
        } catch (error) {
            throw new Error("일치하는 회원 정보가 없습니다.");
        }
    },

    // 비밀번호 재설정 1단계: 정보 확인 및 메일 발송
    verifyForPasswordReset: async (username: string, email: string) => {
        const response = await client.post('/auth/reset-password/verify', { name, username, email });
        return response.data;
    },

    // 비밀번호 재설정 2단계: 코드 확인 및 변경 완료
    completePasswordReset: async (email: string, code: string, newPassword: string) => {
        const response = await client.post('/auth/reset-password/complete', { email, code, newPassword });
        return response.data;
    },

    // ==========================================
    // 3. 관리자 전용 API
    // ==========================================
    admin: {
        getStats: async () => {
            try {
                const response = await client.get('/admin/stats');
                return response.data;
            } catch (error) {
                return { totalMembers: 0, executives: 0, pendingWiki: 0, pendingMaterials: 0 };
            }
        },

        getMembers: async (page = 0, size = 10, role = 'ALL', search = '') => {
            try {
                const query = `page=${page}&size=${size}&role=${role}&search=${encodeURIComponent(search)}`;
                const response = await client.get(`/admin/members?${query}`);
                return response.data;
            } catch (error) {
                return { content: [], totalPages: 0 };
            }
        },

        getExecutives: async () => {
            try {
                const response = await client.get('/admin/executives');
                return response.data;
            } catch (error) {
                return [];
            }
        },

        changeRole: async (id: number, role: string) => {
            try {
                await client.post(`/admin/members/${id}/role?role=${role}`);
                return true;
            } catch (error) {
                return false;
            }
        },

        promoteMember: async (formData: any) => {
            try {
                await client.post('/admin/promote', formData);
                return true;
            } catch (error) {
                console.error(error);
                return false;
            }
        },

        updateExecutive: async (id: number, formData: any) => {
            try {
                await client.put(`/admin/executives/${id}`, formData);
                return true;
            } catch (error) {
                console.error(error);
                return false;
            }
        },

        deleteMember: async (memberId: number) => {
            try {
                await client.delete(`/admin/members/${memberId}`);
                return true;
            } catch (error) {
                return false;
            }
        },

        revokeExecutive: async (memberId: number) => {
            try {
                await client.delete(`/admin/revoke/${memberId}`);
                return true;
            } catch (error) {
                return false;
            }
        }
    },

    // ==========================================
    // 4. 학술 자료실 (Materials) API
    // ==========================================

    getMaterials: async (params: any = {}) => {
        try {
            const cleanParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== 'All' && value !== '') {
                    cleanParams.append(key, String(value));
                }
            });

            const response = await client.get(`/materials?${cleanParams.toString()}`);
            return response.data.content || [];
        } catch (error) {
            console.error("❌ Materials 목록 에러:", error);
            return [];
        }
    },

    getMaterialDetail: async (id: string | number) => {
        try {
            const response = await client.get(`/materials/${id}`);
            return response.data;
        } catch (error) {
            console.error("❌ Material 상세 에러:", error);
            return null;
        }
    },

    createMaterial: async (data: any) => {
        try {
            await client.post('/materials', data);
            return true;
        } catch (error) {
            console.error("❌ Material 등록 에러:", error);
            return false;
        }
    },

    updateMaterial: async (id: number, data: any) => {
        try {
            await client.post(`/materials/${id}/edit`, data);
            return true;
        } catch (error) {
            console.error("❌ Material 수정 에러:", error);
            return false;
        }
    },

    deleteMaterial: async (id: number) => {
        try {
            await client.delete(`/materials/${id}`);
            return true;
        } catch (error) {
            console.error("❌ Material 삭제 에러:", error);
            return false;
        }
    },

    // ==========================================
    // 5. 댓글 (Comments) API
    // ==========================================

    getComments: async (type, targetId) => {
        try {
            const response = await client.get(`/comments?type=${type}&targetId=${targetId}`);
            return response.data; 
        } catch (error) {
            console.error("❌ Comment 조회 에러:", error);
            return [];
        }
    },

    writeComment: async (data) => {
        try {
            await client.post('/comments', data);
            return true;
        } catch (error) {
            console.error("❌ Comment 작성 에러:", error);
            return false;
        }
    },

    deleteComment: async (id) => {
        try {
            await client.delete(`/comments/${id}`);
            return true;
        } catch (error) {
            console.error("❌ Comment 삭제 에러:", error);
            return false;
        }
    },

    // ==========================================
    // 6. Info (생활정보) API
    // ==========================================

    getInfos: async (params?: { category?: string; page?: number; size?: number; sort?: string; status?: string}) => {
        try {
            const query = new URLSearchParams();
            
            if (params?.category && params.category !== 'All') {
                query.append('category', params.category);
            }
            
            if (params?.page !== undefined) {
                query.append('page', String(params.page));
            }
            
            if (params?.size !== undefined) {
                query.append('size', String(params.size));
            }
            
            if (params?.sort) {
                query.append('sort', params.sort);
            }

            if (params?.status) query.append('status', params.status);

            const response = await client.get(`/infos?${query.toString()}`);
            return response.data.content || [];
        } catch (error) {
            console.error("❌ Info 목록 에러:", error);
            return [];
        }
    },

    getInfoDetail: async (id: number | string) => {
        try {
            const response = await client.get(`/infos/${id}`);
            return response.data;
        } catch (error) {
            console.error("❌ Info 상세 에러:", error);
            return null;
        }
    },

    createInfo: async (data: any) => {
        try {
            await client.post('/infos', data);
            return true;
        } catch (error) {
            console.error("❌ Info 등록 에러:", error);
            return false;
        }
    },

    updateInfo: async (id: number | string, data: any) => {
        try {
            await client.put(`/infos/${id}`, data);
            return true;
        } catch (error) {
            console.error("❌ Info 수정 에러:", error);
            return false;
        }
    },

    deleteInfo: async (id: number | string) => {
        try {
            await client.delete(`/infos/${id}`);
            return true;
        } catch (error) {
            console.error("❌ Info 삭제 에러:", error);
            return false;
        }
    },

    approveInfo: async (id: number | string, status: string, reason?: string) => {
        try {
            const query = new URLSearchParams();
            query.append('status', status); 

            if (reason) {
                query.append('reason', reason);
            }

            await client.post(`/infos/${id}/approve?${query.toString()}`);
            return true;
        } catch (error) {
            console.error("❌ Info 승인/반려 에러:", error);
            return false;
        }
    },

    // ==========================================
    // 7. 갤러리 (Gallery) - R2 업로드 적용
    // ==========================================

    getGalleries: async (page = 0, size = 12, sort = 'regDate,desc') => {
        try {
            const response = await client.get(`/gallery?page=${page}&size=${size}&sort=${sort}`);
            const data = response.data;

            const content = data.content || [];
            return content.map((item: any) => ({
                ...item,
                images: item.imageUrls ? item.imageUrls.split(',') : []
            }));
        } catch (error) {
            console.error("❌ Gallery 목록 로드 실패:", error);
            return [];
        }
    },

    getGalleryDetail: async (id: number) => {
        try {
            const response = await client.get(`/gallery/${id}`);
            const data = response.data;

            return {
                ...data,
                images: data.imageUrls ? data.imageUrls.split(',') : []
            };
        } catch (error) {
            console.error("❌ Gallery 상세 로드 실패:", error);
            return null;
        }
    },

    getPresignedUrl: async (fileName: string, contentType: string) => { 
        try {
            const response = await client.post('/gallery/presigned-url', { 
                fileName, 
                contentType 
            });
            return response.data; 
        } catch (error) {
            console.error("❌ Pre-signed URL 발급 실패:", error);
            return null;
        }
    },

    uploadImageToR2: async (uploadUrl: string, file: File) => {
        try {
            await axios.put(uploadUrl, file, {
                headers: {
                    'Content-Type': file.type 
                }
            });
            return true;
        } catch (error) {
            console.error("❌ R2 업로드 실패:", error);
            return false;
        }
    },

    createGallery: async (data: any) => {
        try {
            await client.post('/gallery', data);
            return true;
        } catch (error) {
            console.error("❌ Gallery 등록 실패:", error);
            return false;
        }
    },

    updateGallery: async (id: number, data: any) => {
        try {
            await client.put(`/gallery/${id}`, data);
            return true;
        } catch (error) {
            console.error("❌ Gallery 수정 실패:", error);
            return false;
        }
    },

    deleteGallery: async (id: number) => {
        try {
            await client.delete(`/gallery/${id}`);
            return true;
        } catch (error) {
            console.error("❌ Gallery 삭제 실패:", error);
            return false;
        }
    },

    likeGallery: async (id: number) => {
        try {
            await client.post(`/gallery/${id}/like`);
            return true;
        } catch (error) {
            console.error("❌ Gallery 좋아요 실패:", error);
            return false;
        }
    },

    // ==========================================
    // 마이페이지 (MyPage) API
    // ==========================================

    updateMyInfo: async (infoData: any) => {
        const response = await client.put('/mypage/info', infoData);
        return response.data;
    },

    updateAccount: async (accountData: any) => {
        const response = await client.put('/mypage/account', accountData);
        return response.data;
    },

    changePassword: async (passwordData: any) => {
        const response = await client.put('/mypage/password', passwordData);
        return response.data;
    },

    withdraw: async (passwordData: any) => {
        // DELETE 요청은 body 데이터를 보낼 때 { data: ... } 형태로 감싸야 합니다.
        const response = await client.delete('/mypage/withdraw', { data: passwordData });
        return response.data;
    }

};
import React, { useState } from 'react';
import { api } from '../api';
import { Comment } from '../types';

interface CommentSectionProps {
    comments?: Comment[];
    targetId: number;
    type: 'material' | 'info' | 'gallery';
    onCommentUpdate: () => void;
    currentUser?: any;
}

// [리팩토링] 댓글 입력 폼을 별도 컴포넌트로 분리 (재사용 목적)
const CommentForm = ({ 
    targetId, 
    type, 
    currentUser, 
    onCommentUpdate, 
    parentId = null, 
    placeholder, 
    onCancel 
}: any) => {
    const [content, setContent] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return alert('내용을 입력해주세요.');

        const payload = {
            [`${type}Id`]: targetId,
            content,
            writer: currentUser.username,
            parentId: parentId // 부모 ID가 있으면 대댓글
        };

        const success = await api.writeComment(payload);
        if (success) {
            setContent('');
            alert('댓글이 등록되었습니다.');
            onCommentUpdate();
            if (onCancel) onCancel(); // 대댓글 작성 완료 후 폼 닫기
        } else {
            alert('댓글 등록에 실패했습니다.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`relative ${parentId ? 'mt-4 ml-2' : 'mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100'}`}>
            <div className="mb-4">
                <textarea
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white font-medium text-slate-700"
                    rows={parentId ? 2 : 3} // 대댓글이면 높이를 좀 작게
                    placeholder={placeholder}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    autoFocus={!!parentId} // 대댓글 창 열리면 바로 포커스
                />
            </div>

            <div className="flex justify-end items-center gap-2">
                {/* 대댓글일 경우 취소 버튼 표시 */}
                {parentId && (
                    <button 
                        type="button" 
                        onClick={onCancel}
                        className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold text-sm"
                    >
                        취소
                    </button>
                )}
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md hover:shadow-lg ">
                    등록
                </button>
            </div>
        </form>
    );
};

const CommentSection: React.FC<CommentSectionProps> = ({ comments = [], targetId, type, onCommentUpdate, currentUser }) => {
    // 이제 replyTo는 '어떤 댓글에 답글을 달고 있는지' ID만 관리합니다.
    const [replyToId, setReplyToId] = useState<number | null>(null);

    const handleDelete = async (commentId: number) => {
    if (window.confirm('댓글을 삭제하시겠습니까?')) {
        const success = await api.deleteComment(commentId); // 👈 deleteComment가 '삭제'입니다.
        if (success) {
            alert('댓글이 삭제되었습니다.'); // ✅ 여기에 넣어야 '삭제' 후 알림이 뜹니다!
            onCommentUpdate();
        } else {
            alert('댓글 삭제에 실패했습니다.');
        }
    }
};

    const renderComment = (comment: any, isReply = false) => {
        const canDelete =
            (currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF') ||
            (currentUser && currentUser.username === comment.writer);

        // 현재 이 댓글에 답글 작성 중인지 확인
        const isReplyingToThis = replyToId === comment.id;

        return (
            <div key={comment.id} className={`flex flex-col ${isReply ? 'ml-12 mt-4' : ''}`}>
                <div className="flex gap-4 group">
                    {/* 프로필 아이콘 */}
                    <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0 text-sm">
                        {comment.writer?.charAt(0)}
                    </div>

                    <div className="flex-grow">
                        {/* 헤더 */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900 text-sm">{comment.writer}</span>
                            <span className="text-xs text-slate-400 font-medium">
                                {comment.regDate ? new Date(comment.regDate).toLocaleDateString() : ''}
                            </span>
                            {canDelete && (
                                <button onClick={() => handleDelete(comment.id)} className="text-xs text-red-300 hover:text-red-500 font-bold ml-2 opacity-0 group-hover:opacity-100 transition-opacity">삭제</button>
                            )}
                        </div>

                        {/* 내용 */}
                        <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                            {comment.content}
                        </p>

                        {/* 답글 버튼 (로그인 시 & 대댓글이 아닐 때 & 이미 작성창이 열려있지 않을 때) */}
                        {currentUser && !isReply && !isReplyingToThis && (
                            <button
                                onClick={() => setReplyToId(comment.id)}
                                className="text-xs font-bold text-indigo-400 hover:text-indigo-600 mt-2"
                            >
                                답글 달기
                            </button>
                        )}
                    </div>
                </div>

                {/* --- [UX 개선] 답글 입력 폼이 해당 댓글 바로 아래에 렌더링 됨 --- */}
                {isReplyingToThis && (
                    <div className="pl-14"> {/* 들여쓰기로 시각적 계층 구분 */}
                        <CommentForm 
                            targetId={targetId}
                            type={type}
                            currentUser={currentUser}
                            onCommentUpdate={onCommentUpdate}
                            parentId={comment.id} // 부모 ID 전달
                            placeholder={`@${comment.writer} 님에게 답글 작성...`}
                            onCancel={() => setReplyToId(null)} // 취소 핸들러
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mt-12 border-t border-slate-100 pt-10">
            <h3 className="text-xl font-black text-slate-900 mb-6">Comments ({comments.length})</h3>

            {/* --- 메인 댓글 작성 폼 (상단) --- */}
            {currentUser ? (
                <CommentForm 
                    targetId={targetId}
                    type={type}
                    currentUser={currentUser}
                    onCommentUpdate={onCommentUpdate}
                    placeholder={`${currentUser.name}님, 소중한 의견을 남겨주세요.`}
                />
            ) : (
                <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                    <p className="text-slate-500 text-sm font-bold">댓글을 작성하려면 로그인이 필요합니다.</p>
                </div>
            )}

            {/* --- 댓글 목록 렌더링 --- */}
            <div className="space-y-8">
                {comments.map((comment: any) => (
                    <div key={comment.id}>
                        {/* 부모 댓글 */}
                        {renderComment(comment)}

                        {/* 자식 댓글들 (대댓글) */}
                        {comment.children && comment.children.length > 0 && (
                            <div className="border-l-2 border-slate-100 ml-5 pl-0">
                                {comment.children.map((child: any) => renderComment(child, true))}
                            </div>
                        )}
                    </div>
                ))}

                {comments.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-slate-400 text-sm font-bold">아직 작성된 댓글이 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
/**
 * Post Component
 * Displays a single post with interactions
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Post as PostType, Comment } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
  Edit,
  Trash2,
  Bookmark,
  Flag,
  Copy
} from 'lucide-react';

interface Props {
  post: PostType;
  onDelete?: () => void;
}

const Post: React.FC<Props> = ({ post, onDelete }) => {
  const { userData, currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [loading, setLoading] = useState(false);

  const isLiked = currentUser && post.likes.includes(currentUser.uid);
  const isOwner = currentUser && post.authorId === currentUser.uid;

  // Handle like/unlike
  const handleLike = async () => {
    if (!currentUser) return;
    const postRef = doc(db, 'posts', post.id);

    if (isLiked) {
      await updateDoc(postRef, {
        likes: arrayRemove(currentUser.uid)
      });
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion(currentUser.uid)
      });

      // Send notification to post owner
      if (post.authorId !== currentUser.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: post.authorId,
          type: 'like',
          fromUserId: currentUser.uid,
          fromUserName: userData?.displayName,
          fromUserPhoto: userData?.photoURL,
          postId: post.id,
          message: `${userData?.displayName} liked your post`,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    }
  };

  // Handle comment
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser || !userData) return;

    setLoading(true);
    const postRef = doc(db, 'posts', post.id);
    
    const newComment: Comment = {
      id: Date.now().toString(),
      authorId: currentUser.uid,
      authorName: userData.displayName,
      authorPhoto: userData.photoURL,
      content: commentText.trim(),
      createdAt: new Date()
    };

    await updateDoc(postRef, {
      comments: arrayUnion({
        ...newComment,
        createdAt: new Date().toISOString()
      })
    });

    // Send notification
    if (post.authorId !== currentUser.uid) {
      await addDoc(collection(db, 'notifications'), {
        userId: post.authorId,
        type: 'comment',
        fromUserId: currentUser.uid,
        fromUserName: userData.displayName,
        fromUserPhoto: userData.photoURL,
        postId: post.id,
        message: `${userData.displayName} commented on your post`,
        read: false,
        createdAt: serverTimestamp()
      });
    }

    setCommentText('');
    setLoading(false);
  };

  // Handle edit
  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setLoading(true);
    
    await updateDoc(doc(db, 'posts', post.id), {
      content: editContent.trim(),
      updatedAt: serverTimestamp()
    });

    setIsEditing(false);
    setLoading(false);
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deleteDoc(doc(db, 'posts', post.id));
      onDelete?.();
    }
  };

  // Handle share
  const handleShare = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    await updateDoc(doc(db, 'posts', post.id), {
      shares: post.shares + 1
    });
    alert('Link copied to clipboard!');
  };

  const formatDate = (date: any) => {
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  return (
    <article className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl border ${isDarkMode ? 'border-white/10' : 'border-gray-200'} shadow-xl backdrop-blur-xl overflow-hidden transition-all duration-300 hover:shadow-2xl`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.authorPhoto}
            alt={post.authorName}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-violet-500/30"
          />
          <div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} hover:text-violet-400 cursor-pointer transition-colors`}>
              {post.authorName}
            </h3>
            <p className="text-gray-400 text-sm">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {showMenu && (
            <div className={`absolute right-0 mt-2 w-48 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl border ${isDarkMode ? 'border-white/10' : 'border-gray-200'} overflow-hidden z-10 animate-fadeIn`}>
              {isOwner && (
                <>
                  <button
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 ${isDarkMode ? 'text-white hover:bg-white/5' : 'text-gray-900 hover:bg-gray-100'} transition-colors`}
                  >
                    <Edit className="h-4 w-4 text-violet-400" />
                    Edit Post
                  </button>
                  <button
                    onClick={() => { handleDelete(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Post
                  </button>
                </>
              )}
              <button
                onClick={() => setShowMenu(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 ${isDarkMode ? 'text-white hover:bg-white/5' : 'text-gray-900 hover:bg-gray-100'} transition-colors`}
              >
                <Bookmark className="h-4 w-4 text-amber-400" />
                Save Post
              </button>
              <button
                onClick={() => { handleShare(); setShowMenu(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 ${isDarkMode ? 'text-white hover:bg-white/5' : 'text-gray-900 hover:bg-gray-100'} transition-colors`}
              >
                <Copy className="h-4 w-4 text-blue-400" />
                Copy Link
              </button>
              {!isOwner && (
                <button
                  onClick={() => setShowMenu(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 ${isDarkMode ? 'text-white hover:bg-white/5' : 'text-gray-900 hover:bg-gray-100'} transition-colors`}
                >
                  <Flag className="h-4 w-4 text-red-400" />
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className={`w-full p-3 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none`}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'} whitespace-pre-wrap`}>
            {post.content}
          </p>
        )}
      </div>

      {/* Image */}
      {post.imageURL && (
        <div className="relative">
          <img
            src={post.imageURL}
            alt="Post"
            className="w-full max-h-[500px] object-cover"
          />
        </div>
      )}

      {/* Stats */}
      <div className={`px-4 py-3 flex items-center justify-between text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} border-t ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
        <div className="flex items-center gap-1">
          {post.likes.length > 0 && (
            <>
              <div className="h-5 w-5 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                <Heart className="h-3 w-3 text-white fill-white" />
              </div>
              <span>{post.likes.length}</span>
            </>
          )}
        </div>
        <div className="flex gap-4">
          {post.comments.length > 0 && (
            <span>{post.comments.length} comments</span>
          )}
          {post.shares > 0 && (
            <span>{post.shares} shares</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={`px-2 py-1 flex border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-300 ${
            isLiked
              ? 'text-pink-500'
              : isDarkMode
                ? 'text-gray-400 hover:bg-white/5 hover:text-pink-400'
                : 'text-gray-600 hover:bg-gray-100 hover:text-pink-600'
          }`}
        >
          <Heart className={`h-5 w-5 transition-transform ${isLiked ? 'fill-current scale-110' : 'hover:scale-110'}`} />
          <span className="font-medium">Like</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-white/5 hover:text-violet-400' : 'text-gray-600 hover:bg-gray-100 hover:text-violet-600'}`}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">Comment</span>
        </button>

        <button
          onClick={handleShare}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-white/5 hover:text-emerald-400' : 'text-gray-600 hover:bg-gray-100 hover:text-emerald-600'}`}
        >
          <Share2 className="h-5 w-5" />
          <span className="font-medium">Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className={`p-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'} animate-slideDown`}>
          {/* Comment Form */}
          <form onSubmit={handleComment} className="flex gap-3 mb-4">
            <img
              src={userData?.photoURL}
              alt={userData?.displayName}
              className="h-9 w-9 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 relative">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className={`w-full px-4 py-2 pr-12 ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-400' : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'} border rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500`}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-violet-400 hover:text-violet-300 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {post.comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3 group">
                <img
                  src={comment.authorPhoto}
                  alt={comment.authorName}
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <div className={`inline-block px-4 py-2 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {comment.authorName}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {comment.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 px-2 text-xs text-gray-400">
                    <span>{formatDate(comment.createdAt)}</span>
                    <button className="hover:text-violet-400">Like</button>
                    <button className="hover:text-violet-400">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};

export default Post;

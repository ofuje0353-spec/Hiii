/**
 * NewsFeed Component
 * Main feed displaying all posts with real-time updates
 */

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useTheme } from '../../context/ThemeContext';
import { Post as PostType } from '../../types';
import CreatePost from './CreatePost';
import Post from './Post';
import { RefreshCw, Sparkles } from 'lucide-react';

const NewsFeed: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time posts subscription
  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PostType[];
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 animate-spin mx-auto" />
            <div className={`absolute inset-1 rounded-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
              <Sparkles className="h-6 w-6 text-violet-500" />
            </div>
          </div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stories Section */}
      <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl border ${isDarkMode ? 'border-white/10' : 'border-gray-200'} p-4 overflow-hidden`}>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Create Story */}
          <div className="flex-shrink-0 w-28 h-44 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 relative overflow-hidden cursor-pointer group">
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
            <div className="absolute inset-x-0 bottom-0 p-3 text-center">
              <div className="h-10 w-10 rounded-full bg-violet-500 border-4 border-gray-900 mx-auto -mt-5 flex items-center justify-center">
                <span className="text-white text-xl">+</span>
              </div>
              <p className="text-white text-xs mt-2 font-medium">Add Story</p>
            </div>
          </div>
          
          {/* Sample Stories */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-28 h-44 rounded-xl relative overflow-hidden cursor-pointer group"
              style={{
                backgroundImage: `url(https://picsum.photos/200/300?random=${i})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:from-black/70 transition-colors" />
              <div className="absolute top-3 left-3">
                <div className="h-10 w-10 rounded-full ring-4 ring-violet-500 overflow-hidden">
                  <img
                    src={`https://i.pravatar.cc/100?img=${i + 10}`}
                    alt="User"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-white text-xs font-medium truncate">User {i}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Post */}
      <CreatePost />

      {/* Posts */}
      {posts.length === 0 ? (
        <div className={`text-center py-16 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 mb-4">
            <RefreshCw className="h-10 w-10 text-violet-400" />
          </div>
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            No posts yet
          </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Be the first to share something with the world!
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <Post key={post.id} post={post} />
        ))
      )}
    </div>
  );
};

export default NewsFeed;

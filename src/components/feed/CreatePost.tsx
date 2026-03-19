/**
 * CreatePost Component
 * Form for creating new posts with text, images, and videos
 */

import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { Image, Video, Smile, MapPin, Loader2, X } from 'lucide-react';

interface Props {
  onPostCreated?: () => void;
}

const CreatePost: React.FC<Props> = ({ onPostCreated }) => {
  const { userData, currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    if (!currentUser || !userData) return;

    setLoading(true);
    setError('');

    try {
      let imageURL = '';

      // Upload image if exists
      if (image) {
        const imageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        imageURL = await getDownloadURL(imageRef);
      }

      // Create post document
      await addDoc(collection(db, 'posts'), {
        authorId: currentUser.uid,
        authorName: userData.displayName,
        authorPhoto: userData.photoURL,
        content: content.trim(),
        imageURL,
        videoURL: '',
        likes: [],
        comments: [],
        shares: 0,
        createdAt: serverTimestamp(),
      });

      // Reset form
      setContent('');
      setImage(null);
      setImagePreview(null);
      onPostCreated?.();
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl border ${isDarkMode ? 'border-white/10' : 'border-gray-200'} p-4 shadow-xl backdrop-blur-xl`}>
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Input Area */}
        <div className="flex gap-3">
          <img
            src={userData?.photoURL}
            alt={userData?.displayName}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-violet-500/30 flex-shrink-0"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind, ${userData?.displayName?.split(' ')[0]}?`}
              rows={3}
              className={`w-full resize-none ${isDarkMode ? 'bg-transparent text-white placeholder-gray-400' : 'bg-transparent text-gray-900 placeholder-gray-500'} focus:outline-none text-lg`}
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mt-3 rounded-xl overflow-hidden group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-80 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className={`my-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`} />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {/* Image Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-emerald-600 hover:bg-emerald-50'} transition-colors`}
            >
              <Image className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Photo</span>
            </button>

            {/* Video Upload */}
            <button
              type="button"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'text-pink-400 hover:bg-pink-500/10' : 'text-pink-600 hover:bg-pink-50'} transition-colors`}
            >
              <Video className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Video</span>
            </button>

            {/* Emoji */}
            <button
              type="button"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'text-amber-400 hover:bg-amber-500/10' : 'text-amber-600 hover:bg-amber-50'} transition-colors`}
            >
              <Smile className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Feeling</span>
            </button>

            {/* Location */}
            <button
              type="button"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'text-blue-400 hover:bg-blue-500/10' : 'text-blue-600 hover:bg-blue-50'} transition-colors`}
            >
              <MapPin className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Location</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (!content.trim() && !image)}
            className="px-6 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;

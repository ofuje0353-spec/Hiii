/**
 * Ofuje - A Modern Social Network
 * Main Application Component
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AuthPage from './components/auth/AuthPage';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import RightSidebar from './components/layout/RightSidebar';
import NewsFeed from './components/feed/NewsFeed';
import FriendsPage from './components/friends/FriendsPage';
import MessagesPage from './components/messages/MessagesPage';
import NotificationsPage from './components/notifications/NotificationsPage';
import ProfilePage from './components/profile/ProfilePage';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase/config';
import { Loader2, Sparkles } from 'lucide-react';

// Main App Content
const AppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('feed');
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Listen for unread notifications
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotificationCount(snapshot.docs.length);
    });

    return unsubscribe;
  }, [currentUser]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search functionality
    console.log('Searching for:', query);
  };

  // Loading screen
  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 animate-spin mx-auto" />
            <div className={`absolute inset-2 rounded-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
              <Sparkles className="h-8 w-8 text-violet-500 animate-pulse" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
            Ofuje
          </h2>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading your experience...
          </p>
        </div>
      </div>
    );
  }

  // Auth screen
  if (!currentUser) {
    return <AuthPage />;
  }

  // Render active tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <NewsFeed />;
      case 'friends':
        return <FriendsPage />;
      case 'messages':
        return <MessagesPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return (
          <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl border ${isDarkMode ? 'border-white/10' : 'border-gray-200'} p-8 text-center`}>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Settings
            </h2>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Settings page coming soon!
            </p>
          </div>
        );
      default:
        return <NewsFeed />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notificationCount}
        messages={messageCount}
        onSearch={handleSearch}
      />

      {/* Layout */}
      <div className="flex pt-16">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 xl:mr-80 p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            {renderContent()}
          </div>
        </main>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
};

// App with Providers
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

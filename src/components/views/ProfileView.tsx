import { ReactNode, useState } from 'react';
import { Camera, Settings, Plus, LayoutGrid, MapPin, Share2, UserPlus, UserMinus, MessageSquare } from 'lucide-react';
import { MOCK_USER, MOCK_POSTS } from '../../data/mockData';
import { Post, UserProfile } from '../../types';
import NewsfeedView from './NewsfeedView';

interface ProfileViewProps {
  user?: UserProfile;
  onCommentClick?: (post: Post) => void;
}

const Stat = ({ value, label, border }: { value: string, label: string, border?: boolean }) => (
  <div className={`text-center md:text-left ${border ? 'border-x border-outline-variant/30 px-6' : ''}`}>
    <span className="block font-bold text-lg text-on-surface">{value}</span>
    <span className="text-xs text-outline uppercase tracking-wider font-semibold">{label}</span>
  </div>
);

const IntroItem = ({ icon, text, isLink }: { icon: ReactNode, text: string, isLink?: boolean }) => (
  <div className="flex items-center gap-3 text-on-surface-variant">
    {icon}
    <span className={`text-sm ${isLink ? 'text-primary hover:underline cursor-pointer' : ''}`}>{text}</span>
  </div>
);

const ProfileView = ({ user = MOCK_USER, onCommentClick }: ProfileViewProps) => {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const isMe = user.id === MOCK_USER.id;
  
  const userPosts = MOCK_POSTS.filter(post => post.author.id === user.id);

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-surface-container-lowest rounded-b-3xl overflow-hidden surface-elevation-tonal">
        <div className="h-64 md:h-80 w-full relative">
          <img alt="Cover" className="w-full h-full object-cover" src={user.cover} referrerPolicy="no-referrer" />
          {isMe && (
            <div className="absolute bottom-4 right-6">
              <button className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-headline hover:bg-white/30 transition-colors flex items-center gap-2">
                <Camera className="w-4 h-4" /> Edit Cover
              </button>
            </div>
          )}
        </div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative group -mt-16 md:-mt-20">
              <img alt="Profile" className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-surface-container-lowest object-cover shadow-xl" src={user.avatar} referrerPolicy="no-referrer" />
              {isMe && (
                <button className="absolute bottom-2 right-2 p-2 bg-surface-container-high text-on-surface rounded-full shadow-md hover:brightness-110 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1 text-center md:text-left pt-4 md:pt-6">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h1 className="font-headline font-extrabold text-3xl md:text-4xl text-on-surface tracking-tight">{user.name}</h1>
                {!isMe && (
                   <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit mx-auto md:mx-0">
                     {user.role}
                   </span>
                )}
              </div>
              <p className="text-on-surface-variant mt-1 max-w-lg leading-relaxed">{user.bio}</p>
              <div className="flex items-center justify-center md:justify-start gap-6 mt-4">
                <Stat value={user.following} label="Following" />
                <Stat value={user.followers} label="Followers" border />
                <Stat value={user.posts} label="Posts" />
              </div>
            </div>
            <div className="pt-4 md:pt-6 flex items-center gap-3">
              {isMe ? (
                <button className="btn-primary px-8 py-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Edit Profile
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleFollowToggle}
                    className={`px-8 py-3 rounded-xl font-headline font-bold text-sm transition-all flex items-center gap-2 ${
                      isFollowing 
                        ? 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest' 
                        : 'bg-primary text-on-primary hover:brightness-110 shadow-lg shadow-primary/20'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4" /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Follow
                      </>
                    )}
                  </button>
                  <button className="p-3 bg-surface-container-high text-on-surface rounded-xl hover:bg-surface-container-highest transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="px-8 border-t border-outline-variant/10">
          <div className="flex items-center gap-8">
            {['Posts', 'Photos', 'About'].map((tab, i) => (
              <button key={tab} className={`py-5 font-headline font-bold text-sm transition-colors ${i === 0 ? 'text-primary border-b-2 border-primary' : 'text-outline hover:text-primary'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl surface-elevation-tonal space-y-4">
            <h3 className="font-headline font-bold text-lg text-on-surface">Intro</h3>
            <div className="space-y-4">
              <IntroItem icon={<LayoutGrid className="w-4 h-4 text-primary" />} text={isMe ? "Art Director at Vibe Studio" : "Creative Professional"} />
              <IntroItem icon={<MapPin className="w-4 h-4 text-primary" />} text="Based in San Francisco, CA" />
              <IntroItem icon={<Share2 className="w-4 h-4 text-primary" />} text={`${user.name.toLowerCase().replace(' ', '')}.design`} isLink />
            </div>
          </div>
        </div>
        <div className="lg:col-span-8">
          <NewsfeedView onOpenCreate={() => {}} onCommentClick={onCommentClick} posts={userPosts} hideCreate />
        </div>
      </div>
    </div>
  );
};

export default ProfileView;

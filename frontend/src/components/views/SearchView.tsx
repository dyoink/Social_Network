import { MOCK_POSTS, MOCK_USERS } from '../../data/mockData';
import { Post, UserProfile } from '../../types';
import PostCard from '../feed/PostCard';

const UserCard = ({ user, onUserClick }: { user: UserProfile, onUserClick: (u: UserProfile) => void, key?: string }) => (
  <div className="bg-surface-container-lowest p-5 rounded-xl surface-elevation-tonal transition-all hover:shadow-xl hover:shadow-blue-500/5 group border border-transparent hover:border-outline-variant/10 cursor-pointer" onClick={() => onUserClick(user)}>
    <div className="flex items-center gap-4">
      <img alt={user.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/10" src={user.avatar} referrerPolicy="no-referrer" />
      <div className="flex-grow">
        <h4 className="font-bold text-on-surface leading-tight group-hover:text-primary transition-colors">{user.name}</h4>
        <p className="text-xs text-outline mt-0.5">{user.role}</p>
      </div>
    </div>
    <p className="mt-4 text-sm text-on-surface-variant leading-relaxed line-clamp-2">{user.bio}</p>
    <button className="mt-4 w-full py-2.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold text-sm hover:brightness-105 active:scale-95 transition-all">
      View Profile
    </button>
  </div>
);

const SearchView = ({ onCommentClick, onUserClick }: { onCommentClick?: (post: Post) => void, onUserClick: (u: UserProfile) => void }) => (
  <div className="flex flex-col gap-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Results for "Social"</h1>
      <div className="flex bg-surface-container-high p-1 rounded-full">
        {['All', 'People', 'Posts', 'Media'].map((tab, i) => (
          <button key={tab} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${i === 0 ? 'bg-white text-primary shadow-sm' : 'text-outline hover:text-primary'}`}>
            {tab}
          </button>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-lg text-on-surface">People</h2>
          <button className="text-primary text-sm font-semibold hover:underline">View all</button>
        </div>
        {MOCK_USERS.filter(u => u.id !== 'u1').map(user => (
          <UserCard key={user.id} user={user} onUserClick={onUserClick} />
        ))}
      </div>
      <div className="lg:col-span-8 space-y-8">
        <h2 className="font-headline font-bold text-lg text-on-surface">Top Posts</h2>
        <PostCard post={MOCK_POSTS[0]} onCommentClick={onCommentClick} />
      </div>
    </div>
  </div>
);

export default SearchView;

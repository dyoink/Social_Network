import { TrendingUp, UserPlus } from 'lucide-react';
import { UserProfile } from '../../types';
import { MOCK_USERS } from '../../data/mockData';

const SuggestedUser = ({ user, onUserClick }: { user: UserProfile, onUserClick: (u: UserProfile) => void, key?: string }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onUserClick(user)}>
      <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/5 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
        <img alt={user.name} src={user.avatar} referrerPolicy="no-referrer" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-on-surface leading-none mb-1 group-hover:text-primary transition-colors">{user.name}</h4>
        <p className="text-[10px] text-outline">{user.role}</p>
      </div>
    </div>
    <button className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
      <UserPlus className="w-4 h-4" />
    </button>
  </div>
);

const TrendingTopic = ({ category, title, meta }: { category: string, title: string, meta: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-outline font-bold mb-1">{category}</p>
    <h4 className="text-sm font-bold text-on-surface hover:text-primary cursor-pointer leading-tight mb-1">{title}</h4>
    <p className="text-xs text-outline">{meta}</p>
  </div>
);

const RightSidebar = ({ onUserClick }: { onUserClick: (u: UserProfile) => void }) => (
  <aside className="hidden lg:flex flex-col gap-8 sticky top-24 h-fit">
    <div className="bg-surface-container-lowest p-6 rounded-xl surface-elevation-tonal">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline font-bold text-on-surface">Suggested</h3>
        <button className="text-xs font-bold text-primary hover:underline">See All</button>
      </div>
      <div className="flex flex-col gap-5">
        {MOCK_USERS.filter(u => u.id !== 'u1').map(user => (
          <SuggestedUser key={user.id} user={user} onUserClick={onUserClick} />
        ))}
      </div>
    </div>
    <div className="bg-surface-container-lowest p-6 rounded-xl surface-elevation-tonal">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline font-bold text-on-surface">Trending</h3>
        <TrendingUp className="w-5 h-5 text-outline" />
      </div>
      <div className="flex flex-col gap-6">
        <TrendingTopic category="Technology • Trending" title="The future of generative UI in social platforms" meta="12.5k posts" />
        <TrendingTopic category="Design • Popular" title="Why serif fonts are making a huge comeback" meta="8.2k posts" />
        <TrendingTopic category="Life • Trending" title="10 morning habits for productive creatives" meta="24.1k posts" />
      </div>
    </div>
    <footer className="px-4 flex flex-wrap gap-x-4 gap-y-2">
      {['Privacy', 'Terms', 'Advertising', 'Cookies'].map(link => (
        <button key={link} className="text-[10px] text-outline hover:text-primary uppercase font-bold tracking-wider">{link}</button>
      ))}
      <p className="text-[10px] text-outline w-full mt-2 uppercase font-bold tracking-wider">Social Atelier © 2024</p>
    </footer>
  </aside>
);

export default RightSidebar;

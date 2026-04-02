import React, { useState, useEffect } from 'react';
import { TrendingUp, Loader, Hash, Flame, Sparkles, ChevronRight } from 'lucide-react';
import { getSocialNetworkApiV1, type TrendingHashtagDto } from '../../api/api-generated';
import { UserProfile } from '../../types';

const RightSidebar = ({ onUserClick, onHashtagClick }: { onUserClick: (u: UserProfile) => void; onHashtagClick?: (tag: string) => void }) => {
  const api = getSocialNetworkApiV1();
  const [trending, setTrending] = useState<TrendingHashtagDto[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    api.getApiPostsTrendingHashtags({ limit: 6 })
      .then(res => {
        if (res.success && res.data) setTrending(res.data);
      })
      .catch(() => {})
      .finally(() => setTrendingLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside className="hidden lg:flex flex-col gap-8 sticky top-24 h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pr-2">
      {/* Trending Section */}
      <section className="bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/10 shadow-sm">
        <div className="p-5 pb-3 flex items-center justify-between border-b border-outline-variant/5 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-xl">
              <Flame className="w-5 h-5 text-primary fill-current" />
            </div>
            <h3 className="font-headline font-extrabold text-on-surface tracking-tight">Xu hướng hot</h3>
          </div>
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        </div>

        <div className="p-2">
          {trendingLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-surface-container rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : trending.length === 0 ? (
            <p className="text-center py-8 text-sm text-outline italic">Chưa có xu hướng mới</p>
          ) : (
            <div className="flex flex-col">
              {trending.map((t, index) => (
                <button
                  key={t.tag}
                  onClick={() => onHashtagClick?.(t.tag ?? '')}
                  className="group flex items-center justify-between p-3 rounded-2xl hover:bg-white dark:hover:bg-white/5 transition-all duration-300 text-left relative overflow-hidden"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <span className={`text-2xl font-black italic min-w-[24px] text-center ${
                      index === 0 ? 'text-primary' : 
                      index === 1 ? 'text-secondary' : 
                      index === 2 ? 'text-tertiary' : 'text-outline/20'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1">
                        #{t.tag}
                        {index === 0 && <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase font-black tracking-tighter">Hot</span>}
                      </p>
                      <p className="text-[11px] text-outline font-medium">{(t.postCount ?? 0).toLocaleString()} bài thảo luận</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-outline opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  
                  {/* Hover background gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-surface-container-highest/30 border-t border-outline-variant/5">
          <button 
            onClick={() => onHashtagClick?.('trending')}
            className="w-full py-2.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2"
          >
            Xem tất cả xu hướng <TrendingUp className="w-3 h-3" />
          </button>
        </div>
      </section>

      <footer className="px-4 flex flex-wrap gap-x-4 gap-y-2">
        {['Quyền riêng tư', 'Điều khoản', 'Quảng cáo', 'Cookie'].map(link => (
          <button key={link} className="text-[10px] text-outline hover:text-primary uppercase font-bold tracking-wider">{link}</button>
        ))}
        <p className="text-[10px] text-outline w-full mt-2 uppercase font-bold tracking-wider">Social Network © 2026</p>
      </footer>
    </aside>
  );
};

export default RightSidebar;

import React, { useState, useEffect } from 'react';
import { TrendingUp, Loader, Hash } from 'lucide-react';
import { getSocialNetworkApiV1, type TrendingHashtagDto } from '../../api/api-generated';
import { UserProfile } from '../../types';

const TrendingTopic = ({ category, title, meta }: { category: string; title: string; meta: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-outline font-bold mb-1">{category}</p>
    <h4 className="text-sm font-bold text-on-surface hover:text-primary cursor-pointer leading-tight mb-1">{title}</h4>
    <p className="text-xs text-outline">{meta}</p>
  </div>
);

const RightSidebar = ({ onUserClick, onHashtagClick }: { onUserClick: (u: UserProfile) => void; onHashtagClick?: (tag: string) => void }) => {
  const api = getSocialNetworkApiV1();
  const [trending, setTrending] = useState<TrendingHashtagDto[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    api.getApiPostsTrendingHashtags({ limit: 10 })
      .then(res => {
        if (res.success && res.data) setTrending(res.data);
      })
      .catch(() => {})
      .finally(() => setTrendingLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside className="hidden lg:flex flex-col gap-8 sticky top-24 h-fit">
      {/* Trending hashtags */}
      <div className="bg-surface-container-lowest p-6 rounded-xl surface-elevation-tonal">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline font-bold text-on-surface">Xu hướng</h3>
          <TrendingUp className="w-5 h-5 text-outline" />
        </div>
        <div className="flex flex-col gap-4">
          {trendingLoading && (
            <div className="flex justify-center py-4">
              <Loader className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
          {!trendingLoading && trending.length === 0 && (
            <p className="text-xs text-outline text-center py-2">Chưa có xu hướng nào.</p>
          )}
          {trending.map((t, i) => (
            <button
              key={t.tag}
              onClick={() => onHashtagClick?.(t.tag ?? '')}
              className="text-left group"
            >
              <p className="text-[10px] uppercase tracking-wider text-outline font-bold mb-0.5">#{i + 1} Trending</p>
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-primary" />
                <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{t.tag ?? ''}</h4>
              </div>
              <p className="text-xs text-outline mt-0.5">{(t.postCount ?? 0).toLocaleString()} bài viết</p>
            </button>
          ))}
        </div>
      </div>

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

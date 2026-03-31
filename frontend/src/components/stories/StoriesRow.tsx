import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { getStoryFeed, type StoryGroupDto } from '../../api/storyApi';
import useAuthStore from '../../store/authStore';
import StoryViewer from './StoryViewer';
import StoryCreator from './StoryCreator';

interface StoriesRowProps {
  refreshKey?: number;
}

const StoriesRow = ({ refreshKey }: StoriesRowProps) => {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<StoryGroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(0);
  const [creatorOpen, setCreatorOpen] = useState(false);

  const loadStories = useCallback(async () => {
    try {
      const data = await getStoryFeed();
      setGroups(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStories(); }, [loadStories, refreshKey]);

  const openViewer = (idx: number) => {
    setViewerGroupIndex(idx);
    setViewerOpen(true);
  };

  const handleCreated = () => {
    setCreatorOpen(false);
    loadStories();
  };

  // Tìm group của chính mình (nếu có)
  const myId = Number(user?.id ?? 0);
  const myGroup = groups.find(g => g.userId === myId);
  const hasMyStory = !!myGroup;

  if (loading) {
    return (
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-thin">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-16 h-16 rounded-full bg-surface-container-low animate-pulse" />
            <div className="w-12 h-2.5 rounded bg-surface-container-low animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-thin">
        {/* Nút tạo story */}
        <button
          onClick={() => setCreatorOpen(true)}
          className="flex flex-col items-center gap-1.5 shrink-0 group"
        >
          <div className="relative w-16 h-16">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-surface-container-low">
              <img
                src={user?.avatarUrl || `https://picsum.photos/seed/${user?.username}/100/100`}
                alt="Bạn"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {!hasMyStory && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-surface-container-lowest">
                <Plus className="w-3 h-3 text-white" />
              </div>
            )}
            {hasMyStory && (
              <div className="absolute inset-0 rounded-full border-2 border-primary" />
            )}
          </div>
          <span className="text-[11px] text-outline truncate max-w-[64px]">
            {hasMyStory ? 'Story của bạn' : 'Tạo story'}
          </span>
        </button>

        {/* Stories của người khác */}
        {groups
          .filter(g => g.userId !== myId)
          .map((group, _idx) => {
            const actualIdx = groups.indexOf(group);
            return (
              <button
                key={group.userId}
                onClick={() => openViewer(actualIdx)}
                className="flex flex-col items-center gap-1.5 shrink-0 group"
              >
                <div className={`w-16 h-16 rounded-full overflow-hidden p-0.5 ${
                  group.hasUnviewed
                    ? 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400'
                    : 'bg-surface-container-low'
                }`}>
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-surface-container-lowest">
                    <img
                      src={group.avatarUrl || `https://picsum.photos/seed/${group.username}/100/100`}
                      alt={group.username}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <span className="text-[11px] text-outline truncate max-w-[64px]">
                  {group.fullName || group.username}
                </span>
              </button>
            );
          })}
      </div>

      {/* Story Viewer */}
      {viewerOpen && groups.length > 0 && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={viewerGroupIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* Story Creator */}
      {creatorOpen && (
        <StoryCreator
          onClose={() => setCreatorOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
};

export default StoriesRow;

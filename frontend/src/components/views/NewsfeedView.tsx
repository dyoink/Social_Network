import { Camera, Smile, MapPin } from 'lucide-react';
import { MOCK_USER, MOCK_POSTS } from '../../data/mockData';
import { Post } from '../../types';
import PostCard from '../feed/PostCard';

interface NewsfeedViewProps {
  onOpenCreate: () => void;
  onCommentClick?: (post: Post) => void;
  posts?: Post[];
  hideCreate?: boolean;
}

const NewsfeedView = ({ 
  onOpenCreate, 
  onCommentClick, 
  posts = MOCK_POSTS, 
  hideCreate = false 
}: NewsfeedViewProps) => (
  <div className="flex flex-col gap-10">
    {!hideCreate && (
      <div className="bg-surface-container-lowest p-6 rounded-xl surface-elevation-tonal transition-all hover:bg-surface-bright group cursor-pointer" onClick={onOpenCreate}>
        <div className="flex gap-4 mb-6">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/5">
            <img alt="User" src={MOCK_USER.avatar} referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1 bg-surface-container-low rounded-xl px-5 py-3 border border-transparent group-hover:border-primary/20 transition-all">
            <p className="text-outline font-headline">What's on your mind, Alex?</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-surface-container-low">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-outline hover:text-primary transition-colors text-sm font-medium">
              <Camera className="w-4 h-4 text-primary" /> Media
            </button>
            <button className="flex items-center gap-2 text-outline hover:text-primary transition-colors text-sm font-medium">
              <Smile className="w-4 h-4 text-orange-400" /> Feeling
            </button>
            <button className="flex items-center gap-2 text-outline hover:text-primary transition-colors text-sm font-medium">
              <MapPin className="w-4 h-4 text-emerald-500" /> Location
            </button>
          </div>
          <button className="bg-primary/10 text-primary px-6 py-2 rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all">
            Post
          </button>
        </div>
      </div>
    )}
    <div className="flex flex-col gap-12">
      {posts.map(post => <PostCard key={post.id} post={post} onCommentClick={onCommentClick} />)}
    </div>
  </div>
);

export default NewsfeedView;

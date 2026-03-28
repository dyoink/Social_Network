import { useState, FC } from 'react';
import { ThumbsUp, Heart, Smile, Info, MoreHorizontal, Globe, MessageCircle, Share2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Post } from '../../types';
import { MOCK_USER } from '../../data/mockData';

const PostCard: FC<{ post: Post, onCommentClick?: (post: Post) => void }> = ({ post, onCommentClick }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);

  const reactions = [
    { icon: <ThumbsUp className="w-5 h-5 text-blue-500 fill-current" />, label: 'Like', color: 'text-blue-500' },
    { icon: <Heart className="w-5 h-5 text-red-500 fill-current" />, label: 'Love', color: 'text-red-500' },
    { icon: <Smile className="w-5 h-5 text-yellow-500 fill-current" />, label: 'Haha', color: 'text-yellow-500' },
    { icon: <Info className="w-5 h-5 text-purple-500 fill-current" />, label: 'Wow', color: 'text-purple-500' },
  ];

  const handleCommentToggle = () => {
    if (onCommentClick && window.innerWidth >= 1024) {
      onCommentClick(post);
    } else {
      setShowComments(!showComments);
    }
  };

  return (
    <article className="bg-surface-container-lowest rounded-xl surface-elevation-tonal overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/5">
              <img alt={post.author.name} src={post.author.avatar} referrerPolicy="no-referrer" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-on-surface leading-tight">{post.author.name}</h4>
              <p className="text-xs text-outline flex items-center gap-1">
                {post.time} <Globe className="w-3 h-3" />
              </p>
            </div>
          </div>
          <button className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        <p className="text-on-surface-variant leading-relaxed mb-5">
          {post.content}
        </p>
      </div>
      {post.image && (
        <div className="px-2">
          <div className="rounded-lg overflow-hidden h-[400px]">
            <img alt="Post Content" className="w-full h-full object-cover" src={post.image} referrerPolicy="no-referrer" />
          </div>
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-container-low">
          <div className="flex items-center -space-x-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ring-2 ring-white">
              <ThumbsUp className="w-3 h-3 text-white fill-current" />
            </div>
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-white">
              <Heart className="w-3 h-3 text-white fill-current" />
            </div>
            <span className="pl-4 text-xs font-medium text-outline">{post.reactions + (isLiked ? 1 : 0)} reactions</span>
          </div>
          <div className="flex gap-4 text-xs font-medium text-outline">
            <button onClick={handleCommentToggle} className="hover:underline">{post.comments} Comments</button>
            <span>{post.shares} Shares</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-6 relative">
          {/* Reaction Picker */}
          <AnimatePresence>
            {showReactions && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-xl border border-outline-variant/20 p-1.5 flex gap-1 z-10"
                onMouseLeave={() => setShowReactions(false)}
              >
                {reactions.map((r, i) => (
                  <motion.button
                    key={r.label}
                    whileHover={{ scale: 1.3, y: -5 }}
                    onClick={() => {
                      setReaction(r.label);
                      setIsLiked(true);
                      setShowReactions(false);
                    }}
                    className="p-2 hover:bg-surface-container rounded-full transition-colors"
                  >
                    {r.icon}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onMouseEnter={() => setShowReactions(true)}
            onClick={() => {
              setIsLiked(!isLiked);
              if (isLiked) setReaction(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full transition-all font-medium text-sm ${isLiked ? 'bg-primary/10 text-primary' : 'bg-secondary-container/30 text-on-secondary-container hover:bg-secondary-container/60'}`}
          >
            {reaction ? (
              reactions.find(r => r.label === reaction)?.icon
            ) : (
              <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            )}
            {reaction || (isLiked ? 'Liked' : 'Like')}
          </button>
          
          <button 
            onClick={handleCommentToggle}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full transition-colors font-medium text-sm ${showComments ? 'bg-surface-container text-primary' : 'text-outline hover:bg-surface-container hover:text-primary'}`}
          >
            <MessageCircle className="w-4 h-4" />
            Comment
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full hover:bg-surface-container transition-colors font-medium text-sm text-outline hover:text-primary">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Comment Section (Inline for mobile/tablet) */}
        <AnimatePresence>
          {showComments && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden lg:hidden"
            >
              <div className="flex gap-3 mb-6">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <img alt="User" src={MOCK_USER.avatar} referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Write a comment..." 
                    className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary/30 rounded-2xl py-2 px-4 text-sm text-on-surface placeholder:text-outline"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button className="p-1 text-outline hover:text-primary transition-colors"><Smile className="w-4 h-4" /></button>
                    <button className="p-1 text-outline hover:text-primary transition-colors"><Camera className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <img alt="Commenter" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCL8ixvp9QIQZXVaJrguGy80dp3yTDz8YI2eQEEegSNx1QrECjb7V-FqAM4HOhKErhlq_e7P-RatDGWxFpQnba-h56tK4yazQIEwcHBFU4WMG6NcxiogzjiCb1kfczTQBNl9tc30VkKWa7KMzOppuEqHsU7NVNkr0KrxhPu_Otflw27KRZUWLw4EL-zRERJheSWsllclSaM9fuuflbtjOqEgIwTj_cxalHFJbBB0p5KwkGY7Nz1YScvTnZgkxdtlBxJYDxJCpmFEC70" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-surface-container-low rounded-2xl p-3">
                      <h5 className="text-xs font-bold text-on-surface mb-1">David Chen</h5>
                      <p className="text-sm text-on-surface-variant leading-snug">The typography choice is incredible Sarah! Can't wait to see the full rollout.</p>
                    </div>
                    <div className="flex items-center gap-4 mt-1 ml-2">
                      <button className="text-[10px] font-bold text-outline hover:text-primary">Like</button>
                      <button className="text-[10px] font-bold text-outline hover:text-primary">Reply</button>
                      <span className="text-[10px] text-outline">12m</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
};

export default PostCard;

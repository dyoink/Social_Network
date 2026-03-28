import { X, CheckCircle2, Globe, Plus, Palette, Camera, UserPlus, Smile, MapPin, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_USER } from '../../data/mockData';

const CreatePostModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-surface-container-lowest w-full max-w-xl rounded-xl surface-elevation-tonal overflow-hidden"
        >
          <div className="px-6 py-5 flex items-center justify-between border-b border-surface-container-low">
            <h2 className="text-xl font-bold tracking-tight text-on-surface font-headline">Create Post</h2>
            <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
              <X className="w-5 h-5 text-outline" />
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-full overflow-hidden border border-primary/10">
                <img alt="User" src={MOCK_USER.avatar} referrerPolicy="no-referrer" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-on-surface text-sm">{MOCK_USER.name}</span>
                  <CheckCircle2 className="w-4 h-4 text-primary fill-current" />
                </div>
                <button className="flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-lg text-[11px] font-semibold text-secondary hover:bg-surface-container-high transition-colors">
                  <Globe className="w-3 h-3" />
                  Public
                  <Plus className="w-3 h-3 rotate-45" />
                </button>
              </div>
            </div>
            <textarea 
              className="w-full border-none focus:ring-0 text-lg md:text-xl text-on-surface placeholder:text-outline/50 resize-none min-h-[160px] leading-relaxed p-0 bg-transparent" 
              placeholder="What's on your mind?"
            ></textarea>
            <div className="flex gap-2 mt-4 mb-8">
              <button className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center border border-white shadow-sm hover:scale-110 transition-transform">
                <Palette className="w-4 h-4 text-outline" />
              </button>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-cyan-400 cursor-pointer hover:scale-110 transition-transform"></div>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-500 cursor-pointer hover:scale-110 transition-transform"></div>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-400 to-rose-400 cursor-pointer hover:scale-110 transition-transform"></div>
            </div>
            <div className="rounded-xl border border-outline-variant/30 p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-secondary px-1">Add to your post</span>
                <div className="flex items-center gap-1">
                  <button className="p-2.5 hover:bg-surface-container-low rounded-full transition-colors text-primary"><Camera className="w-5 h-5" /></button>
                  <button className="p-2.5 hover:bg-surface-container-low rounded-full transition-colors text-tertiary"><UserPlus className="w-5 h-5" /></button>
                  <button className="p-2.5 hover:bg-surface-container-low rounded-full transition-colors text-orange-500"><Smile className="w-5 h-5" /></button>
                  <button className="p-2.5 hover:bg-surface-container-low rounded-full transition-colors text-red-500"><MapPin className="w-5 h-5" /></button>
                  <button className="p-2.5 hover:bg-surface-container-low rounded-full transition-colors text-outline"><MoreHorizontal className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
            <button className="w-full btn-primary py-3.5">
              Post
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default CreatePostModal;

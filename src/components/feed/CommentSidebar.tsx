import { X, ArrowRight } from 'lucide-react';
import { Post } from '../../types';
import { MOCK_USER } from '../../data/mockData';

const SidebarComment = ({ name, text, time, avatar }: { name: string, text: string, time: string, avatar: string }) => (
  <div className="flex gap-3">
    <img alt={name} src={avatar} className="w-8 h-8 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
    <div className="flex-1">
      <div className="bg-surface-container-low rounded-2xl p-3">
        <h5 className="text-xs font-bold text-on-surface mb-1">{name}</h5>
        <p className="text-sm text-on-surface-variant leading-snug">{text}</p>
      </div>
      <div className="flex items-center gap-4 mt-1 ml-2">
        <button className="text-[10px] font-bold text-outline hover:text-primary">Like</button>
        <button className="text-[10px] font-bold text-outline hover:text-primary">Reply</button>
        <span className="text-[10px] text-outline">{time}</span>
      </div>
    </div>
  </div>
);

const CommentSidebar = ({ post, onClose }: { post: Post, onClose: () => void }) => (
  <aside className="hidden lg:flex flex-col gap-4 sticky top-24 h-[calc(100vh-120px)] overflow-hidden bg-surface-container-lowest rounded-xl surface-elevation-tonal border border-outline-variant/10">
    <div className="p-6 border-b border-surface-container flex items-center justify-between">
      <h3 className="font-headline font-bold text-on-surface">Comments</h3>
      <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
        <X className="w-5 h-5 text-outline" />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <img alt={post.author.name} src={post.author.avatar} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
        <p className="text-xs font-bold text-on-surface">{post.author.name}</p>
      </div>
      <p className="text-sm text-on-surface-variant mb-6 line-clamp-2">{post.content}</p>
      
      <div className="space-y-6">
        <SidebarComment 
          name="David Chen" 
          text="The typography choice is incredible Sarah! Can't wait to see the full rollout." 
          time="12m" 
          avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuCL8ixvp9QIQZXVaJrguGy80dp3yTDz8YI2eQEEegSNx1QrECjb7V-FqAM4HOhKErhlq_e7P-RatDGWxFpQnba-h56tK4yazQIEwcHBFU4WMG6NcxiogzjiCb1kfczTQBNl9tc30VkKWa7KMzOppuEqHsU7NVNkr0KrxhPu_Otflw27KRZUWLw4EL-zRERJheSWsllclSaM9fuuflbtjOqEgIwTj_cxalHFJbBB0p5KwkGY7Nz1YScvTnZgkxdtlBxJYDxJCpmFEC70" 
        />
        <SidebarComment 
          name="Emma Stone" 
          text="This is exactly what we needed for the brand identity. The balance is perfect." 
          time="45m" 
          avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuDuwfoB0-jMMWg27dLqs3wxXPDqiCY7VWZnJ9XnByo_gSV1m05f-6EVFyRP9TpdfY68-j3fPoZJLSdsKVeCSLgadCMr5bEu2trmTt_zdlpWUulrtyacfQ0Y09-wDuv-A09T2P_eSEcLfeS7fhwjeppXZyDvW0Dkq8FBMGAMLEscFxnxPnQhWZ7A_AwZKvMWK0dgvfENzNH9ZBmfjNrSjhSH0VAICbyTQOrjE5nsS1ikS3dZXUP6PHy-55Jw_eYmtwI8xvu8kL_tueu7" 
        />
        <SidebarComment 
          name="Marcus Wright" 
          text="Great work on the balance between authority and fluidity. Very inspiring!" 
          time="1h" 
          avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuC52K_yr0tgNx6aDqb7poIJqEJeSkQjPWUf7Irzw18yXdUtLrTuwYaFmFYmoC0ohaPJqiwWzJS4NADZv1M_uSxBcbR7-UuAfLMsXCYsYXy1rS53hgjhKFMYI3YlHlhca0y_IxepCqUh6DijWdXZJ2c9R6Gn_rT6ng26Cnekb8PRcgyP9pOAHysq52eeUVULphEXPp0gDD8agFUpkIh98P3aP1VCwyFs_2sHrl1GcY8Pzr00GFuLoN8HS9TGQnRGyYrxlNr5_p7sB0HY" 
        />
      </div>
    </div>
    <div className="p-6 bg-white/50 backdrop-blur-md border-t border-surface-container">
      <div className="bg-surface-container-low rounded-xl p-2 flex items-center gap-2">
        <input className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 text-on-surface placeholder:text-outline" placeholder="Write a comment..." type="text" />
        <button className="p-2 text-primary hover:scale-110 transition-transform"><ArrowRight className="w-5 h-5" /></button>
      </div>
    </div>
  </aside>
);

export default CommentSidebar;

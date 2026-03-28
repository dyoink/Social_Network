import { ReactNode } from 'react';
import { Heart, Globe, MoreHorizontal } from 'lucide-react';

const NotificationItem = ({ unread, name, action, time, avatar, icon, iconBg, comment }: { unread?: boolean, name: string, action: string, time: string, avatar: string, icon: ReactNode, iconBg: string, comment?: string }) => (
  <div className={`group bg-surface-container-lowest p-5 rounded-xl shadow-sm hover:shadow-md transition-all flex gap-4 relative`}>
    {unread && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full"></div>}
    <div className="flex-shrink-0">
      <div className="relative">
        <img alt={name} className="w-12 h-12 rounded-full object-cover ring-2 ring-white" src={avatar} referrerPolicy="no-referrer" />
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${iconBg} rounded-full flex items-center justify-center border-2 border-white`}>
          {icon}
        </div>
      </div>
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-on-surface leading-tight">
            <span className="font-bold">{name}</span> {action}
          </p>
          {comment && (
            <div className="mt-3 p-3 bg-surface-container-low rounded-xl text-sm italic text-on-surface-variant border-l-4 border-primary/20">
              "{comment}"
            </div>
          )}
          <span className="text-xs text-outline mt-1 block">{time}</span>
        </div>
        <button className="p-1 rounded-full text-outline hover:bg-surface-container transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

const NotificationsView = () => (
  <div className="max-w-2xl mx-auto">
    <div className="flex items-end justify-between mb-8">
      <div>
        <h1 className="text-4xl font-black text-on-surface font-headline tracking-tight">Notifications</h1>
        <p className="text-outline mt-1">Stay updated with your community activities.</p>
      </div>
      <button className="text-sm font-semibold text-primary hover:bg-primary/5 px-4 py-2 rounded-full transition-colors">
        Mark all as read
      </button>
    </div>
    <div className="flex gap-2 mb-6 p-1 bg-surface-container-low rounded-full w-fit">
      <button className="px-6 py-2 rounded-full text-sm font-bold bg-white text-primary shadow-sm">All</button>
      <button className="px-6 py-2 rounded-full text-sm font-semibold text-outline hover:text-on-surface transition-colors">Mentions</button>
      <button className="px-6 py-2 rounded-full text-sm font-semibold text-outline hover:text-on-surface transition-colors">My Posts</button>
    </div>
    <div className="space-y-4">
      <NotificationItem 
        unread 
        name="Sarah Miller" 
        action="liked your post about the new atelier gallery." 
        time="2m ago" 
        avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuBQc4jbCIdr_oI2RurkrxUWoFCZngZrtKLGRhhAbu51-qmgF6WF5XKO-GuTQfyB9G--ON9ovXFmzZesrYOFnWU7tRT2gybOh04alCjdgPTCG4YrhKn0XRKpc7P7QtDr_RAyDKK7fUR5NwxMapXtP3cNmtLsyVTa-6F0GxJlIAxIHDLrgUMk-QrVUl2UPsY39HnBpvAKrV6Q2L96sXR0GzSljlK8eTO2D9t0nzsCrZN93gUYlhVaMbgZeKGHm6t5mkE5L5DdTu-GxeGY" 
        icon={<Heart className="w-3 h-3 text-white fill-current" />}
        iconBg="bg-primary"
      />
      <NotificationItem 
        name="Marcus Wright" 
        action="mentioned you in a comment." 
        time="1h ago" 
        avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuC52K_yr0tgNx6aDqb7poIJqEJeSkQjPWUf7Irzw18yXdUtLrTuwYaFmFYmoC0ohaPJqiwWzJS4NADZv1M_uSxBcbR7-UuAfLMsXCYsYXy1rS53hgjhKFMYI3YlHlhca0y_IxepCqUh6DijWdXZJ2c9R6Gn_rT6ng26Cnekb8PRcgyP9pOAHysq52eeUVULphEXPp0gDD8agFUpkIh98P3aP1VCwyFs_2sHrl1GcY8Pzr00GFuLoN8HS9TGQnRGyYrxlNr5_p7sB0HY" 
        icon={<Globe className="w-3 h-3 text-white" />}
        iconBg="bg-tertiary"
        comment="@Alexander I think we should definitely include the editorial layout for the next release!"
      />
    </div>
  </div>
);

export default NotificationsView;

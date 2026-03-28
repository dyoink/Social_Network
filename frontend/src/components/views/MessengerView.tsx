import { Plus, Phone, VideoIcon, Info, Smile, Camera, ArrowRight, CheckCircle2 } from 'lucide-react';

const ChatItem = ({ active, name, message, time, avatar, online }: { active?: boolean, name: string, message: string, time: string, avatar: string, online?: boolean }) => (
  <div className={`p-4 rounded-xl flex gap-4 cursor-pointer transition-all ${active ? 'bg-white shadow-sm border-l-4 border-primary' : 'hover:bg-white'}`}>
    <div className="relative">
      <img alt={name} className="w-12 h-12 rounded-full object-cover" src={avatar} referrerPolicy="no-referrer" />
      {online && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline">
        <h4 className={`font-bold truncate ${active ? 'text-on-surface' : 'text-on-surface hover:text-primary transition-colors'}`}>{name}</h4>
        <span className={`text-[10px] font-semibold uppercase tracking-widest ${active ? 'text-primary' : 'text-outline'}`}>{time}</span>
      </div>
      <p className={`text-sm truncate ${active ? 'text-on-surface-variant font-medium' : 'text-outline'}`}>{message}</p>
    </div>
  </div>
);

const Message = ({ sent, received, text, time }: { sent?: boolean, received?: boolean, text: string, time: string }) => (
  <div className={`flex flex-col ${sent ? 'items-end self-end' : 'items-start'} max-w-[80%]`}>
    <div className={`p-4 rounded-xl ${sent ? 'bg-gradient-to-br from-primary to-primary-container text-white rounded-br-none shadow-lg shadow-primary/10' : 'bg-surface-container-low text-on-surface rounded-bl-none shadow-sm'}`}>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
    <div className="flex items-center gap-1 mt-1 px-1">
      <span className="text-[10px] text-outline">{time}</span>
      {sent && <CheckCircle2 className="w-3 h-3 text-primary fill-current" />}
    </div>
  </div>
);

const MessengerView = () => (
  <div className="bg-surface-container-lowest rounded-xl surface-elevation-tonal flex h-[calc(100vh-160px)] overflow-hidden border border-outline-variant/10">
    <div className="w-1/3 border-r border-surface-container flex flex-col">
      <div className="p-6 flex items-center justify-between border-b border-surface-container">
        <h2 className="text-2xl font-headline font-extrabold tracking-tight">Messages</h2>
        <button className="p-2 bg-surface-container-low rounded-full text-primary hover:bg-primary/10 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <ChatItem active name="Sarah Jenkins" message="I just saw the gallery update! It looks..." time="Now" avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuDURVGkwVvYKRzBFMh781qM6tUgGC4XztbOpEbsCn4HEdU55ranu4PY7WzUtwYohxcTXurcYnwOJTBMXesTdr_GYCzItQ47JGV5RgxRAi6DldEFVKcDX8TEy9IX4cuoLKUHxet9qt_msLHAfIc07cE58kTYjuGrZ9M-BtionCBW9Ebv-ihvdon6jh4HrW_kXrBrZw7UG8RCYSzONZqs59RZ_C7VqO7rA6r4p1R_ce9PK1JXszcdhZ7HVYrsZCMpds1mdjk35MQgtHfL" online />
        <ChatItem name="Marcus Thorne" message="Did you get the files I sent over for..." time="2h ago" avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuCQzPx4LvkWd8kBcnHLkXNIzlmmjex6_xf_3Hg8kInZo5AkZ2xwYn3gAGW_haOZcly3WSx-hKQkeaFKX9pHX7ixUJpdn-qq8S4Xy3Qx8rlpi6i9NpAT1EERUnoiFmjLKv1hCRHQlUDVPdmlp6M6K5FIoY5IA80kn0kjdxijCcmTLJNFLyL0Zbz0_c5nufEYNdHqJ2J9HnUmblbuX1kIW_65AWm1Z53Y3kETF_LYgxAeNZacAvCQgypsx5esNwPkpXQxiGOOUOG2Dbzh" />
        <ChatItem name="Elena Rodriguez" message="Let's grab coffee tomorrow at 10." time="5h ago" avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuB_NMumY1iZJhLzzXbQSBSi_Bfg7ec_FnKbq36EVDszF4V2VmaDzz_TR6pFOA5BKHL3qFjiiEGr2HhN_yz1Lnyy-gBwmerWLljGcJVmlc7XGKJxGA4xjiQ5hjZwWIlRoYE8rudLnWZ0ylR4SPJqjixoiTn2ndF_2KSdkFasiwKN58cHfgLpp0aSZcC11gruDFlxeW-4TaApuUysiN3L4rnaY73_fUg2AJjO6HraE3DApuv6qR0Vfb3wu3wNzrzaRGnS7OqKQEGMxUt9" online />
      </div>
    </div>
    <div className="flex-1 flex flex-col">
      <header className="p-4 flex items-center justify-between border-b border-surface-container">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img alt="Sarah" className="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDURVGkwVvYKRzBFMh781qM6tUgGC4XztbOpEbsCn4HEdU55ranu4PY7WzUtwYohxcTXurcYnwOJTBMXesTdr_GYCzItQ47JGV5RgxRAi6DldEFVKcDX8TEy9IX4cuoLKUHxet9qt_msLHAfIc07cE58kTYjuGrZ9M-BtionCBW9Ebv-ihvdon6jh4HrW_kXrBrZw7UG8RCYSzONZqs59RZ_C7VqO7rA6r4p1R_ce9PK1JXszcdhZ7HVYrsZCMpds1mdjk35MQgtHfL" referrerPolicy="no-referrer" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <h3 className="font-bold text-on-surface leading-tight">Sarah Jenkins</h3>
            <p className="text-xs text-green-600 font-medium">Active now</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-outline hover:bg-surface-container rounded-full transition-colors"><Phone className="w-5 h-5" /></button>
          <button className="p-2 text-outline hover:bg-surface-container rounded-full transition-colors"><VideoIcon className="w-5 h-5" /></button>
          <button className="p-2 text-outline hover:bg-surface-container rounded-full transition-colors"><Info className="w-5 h-5" /></button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
        <div className="flex justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-outline bg-surface-container-low px-3 py-1 rounded-full">Today</span>
        </div>
        <Message received text="Hey! Did you see the latest editorial layout I shared in the channel? I think we should use that same 'Atelier' vibe for the new Messenger interface." time="10:42 AM" />
        <Message sent text="I just saw it! The breathable white space and the serif headers really give it that premium newsroom feel. I'm working on the chat bubbles now." time="10:45 AM" />
      </div>
      <footer className="p-6 bg-white/50 backdrop-blur-md border-t border-surface-container">
        <div className="bg-surface-container-low rounded-full p-2 flex items-center gap-2">
          <button className="p-2 text-outline hover:text-primary transition-colors"><Plus className="w-5 h-5" /></button>
          <button className="p-2 text-outline hover:text-primary transition-colors"><Camera className="w-5 h-5" /></button>
          <input className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 text-on-surface placeholder:text-outline" placeholder="Type a message..." type="text" />
          <button className="p-2 text-outline hover:text-primary transition-colors"><Smile className="w-5 h-5" /></button>
          <button className="bg-primary text-white p-2 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-transform">
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  </div>
);

export default MessengerView;

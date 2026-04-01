import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPokeConnection } from '../../api/signalr';
import * as signalR from '@microsoft/signalr';

const POKE_TYPES = [
  { type: 'debt',  emoji: '💸', label: 'Đòi nợ',             desc: 'Nhắc nhở nợ nần!' },
  { type: 'drink', emoji: '🍺', label: 'Rủ đi nhậu',         desc: 'Tối nay đi 1 vòng?' },
  { type: 'bell',  emoji: '🔔', label: 'Gõ mõ tụng kinh',    desc: 'Tung tung tung sahur!' },
  { type: 'boo',   emoji: '👻', label: 'Boo!',               desc: 'Dọa cho một phát!' },
] as const;

interface PokeModalProps {
  targetUserId: number;
  targetName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PokeModal({ targetUserId, targetName, isOpen, onClose }: PokeModalProps) {
  const [sending, setSending] = useState(false);

  const handlePoke = async (pokeType: string) => {
    if (sending) return;
    setSending(true);
    try {
      const conn = getPokeConnection();
      // Đảm bảo connection đã started trước khi invoke
      if (conn.state === signalR.HubConnectionState.Disconnected) {
        await conn.start();
      }
      // Đợi connection sẵn sàng nếu đang reconnecting
      if (conn.state !== signalR.HubConnectionState.Connected) {
        // Chờ tối đa 3s cho connection sẵn sàng
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('timeout')), 3000);
          const check = () => {
            if (conn.state === signalR.HubConnectionState.Connected) {
              clearTimeout(timeout);
              resolve();
            } else if (conn.state === signalR.HubConnectionState.Disconnected) {
              clearTimeout(timeout);
              reject(new Error('disconnected'));
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });
      }
      await conn.invoke('Poke', targetUserId, pokeType);
      const info = POKE_TYPES.find(p => p.type === pokeType);
      toast.success(`Đã ${info?.label.toLowerCase() ?? 'chọc'} ${targetName}!`);
      onClose();
    } catch (err) {
      console.error('[Poke] Error:', err);
      toast.error('Không thể gửi poke. Kiểm tra kết nối mạng và thử lại.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/20 w-full max-w-sm mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
              <h3 className="font-headline font-bold text-on-surface text-lg">
                Chọc {targetName}
              </h3>
              <button onClick={onClose} className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Poke options */}
            <div className="p-4 grid grid-cols-2 gap-3">
              {POKE_TYPES.map(poke => (
                <button
                  key={poke.type}
                  onClick={() => handlePoke(poke.type)}
                  disabled={sending}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all hover:scale-105 active:scale-95 disabled:opacity-60 group"
                >
                  {sending ? (
                    <Loader className="w-8 h-8 animate-spin text-primary" />
                  ) : (
                    <span className="text-4xl group-hover:scale-125 transition-transform">{poke.emoji}</span>
                  )}
                  <span className="font-headline font-bold text-sm text-on-surface">{poke.label}</span>
                  <span className="text-xs text-outline">{poke.desc}</span>
                </button>
              ))}
            </div>

            {/* Warning */}
            <div className="px-5 pb-4">
              <p className="text-xs text-outline text-center">
                Tối đa 5 lần chọc/phút. Chọc có trách nhiệm nhé! 😄
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

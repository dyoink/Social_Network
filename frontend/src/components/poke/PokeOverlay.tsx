import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { getPokeConnection } from '../../api/signalr';
import * as signalR from '@microsoft/signalr';

// Các loại poke với emoji + label
const POKE_MAP: Record<string, { emoji: string; label: string; color: string }> = {
  debt:  { emoji: '💸', label: 'đòi nợ bạn!',           color: 'text-green-500' },
  drink: { emoji: '🍺', label: 'rủ bạn đi nhậu!',       color: 'text-amber-500' },
  bell:  { emoji: '🔔', label: 'gõ mõ tụng kinh bạn!',  color: 'text-yellow-500' },
  boo:   { emoji: '👻', label: 'dọa bạn!',              color: 'text-purple-500' },
};

interface FallingIcon {
  id: number;
  emoji: string;
  left: number;   // % from left
  delay: number;  // animation delay (s)
  size: number;   // font size (px)
  duration: number; // animation duration (s)
}

/**
 * Poke overlay — lắng nghe SignalR "ReceivePoke" event.
 * Khi nhận poke: hiển thị full-screen icon rain + screen shake + toast.
 */
export default function PokeOverlay() {
  const [active, setActive] = useState(false);
  const [icons, setIcons] = useState<FallingIcon[]>([]);
  const [pokeInfo, setPokeInfo] = useState<{ emoji: string; label: string } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idCounter = useRef(0);

  const triggerPoke = useCallback((pokeType: string, fromUserId: number) => {
    const info = POKE_MAP[pokeType] ?? POKE_MAP.boo;

    // Toast thông báo
    toast(`User #${fromUserId} ${info.emoji} ${info.label}`, {
      icon: info.emoji,
      duration: 4000,
      style: { fontWeight: 600 },
    });

    // Vibration trên mobile
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Tạo icon rain (30 icons)
    const newIcons: FallingIcon[] = Array.from({ length: 30 }, () => {
      idCounter.current += 1;
      return {
        id: idCounter.current,
        emoji: info.emoji,
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        size: 20 + Math.random() * 30,
        duration: 2 + Math.random() * 2,
      };
    });

    setPokeInfo(info);
    setIcons(newIcons);
    setActive(true);

    // Tự tắt sau 4s
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActive(false);
      setIcons([]);
      setPokeInfo(null);
    }, 4000);
  }, []);

  useEffect(() => {
    const conn = getPokeConnection();

    const handler = (data: { fromUserId: number; pokeType: string }) => {
      triggerPoke(data.pokeType, data.fromUserId);
    };

    conn.on('ReceivePoke', handler);

    // Đảm bảo connection đã started để nhận được event
    if (conn.state === signalR.HubConnectionState.Disconnected) {
      conn.start().catch(err => console.error('[PokeOverlay] Failed to start connection:', err));
    }

    return () => {
      conn.off('ReceivePoke', handler);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [triggerPoke]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
        >
          {/* Screen shake — áp dụng animation lên wrapper */}
          <motion.div
            animate={{
              x: [0, -8, 8, -6, 6, -4, 4, -2, 2, 0],
              y: [0, 4, -4, 3, -3, 2, -2, 1, -1, 0],
            }}
            transition={{ duration: 0.6, repeat: 3, repeatType: 'loop' }}
            className="fixed inset-0 pointer-events-none"
          />

          {/* Icon rain */}
          {icons.map(icon => (
            <motion.div
              key={icon.id}
              initial={{ y: -60, opacity: 1, rotate: 0 }}
              animate={{ y: '110vh', opacity: [1, 1, 0.5, 0], rotate: 360 }}
              transition={{
                duration: icon.duration,
                delay: icon.delay,
                ease: 'easeIn',
              }}
              className="absolute"
              style={{
                left: `${icon.left}%`,
                fontSize: `${icon.size}px`,
                top: 0,
              }}
            >
              {icon.emoji}
            </motion.div>
          ))}

          {/* Center text */}
          {pokeInfo && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center bg-surface-container-lowest/90 backdrop-blur-xl rounded-3xl px-10 py-8 shadow-2xl border border-outline-variant/20">
                <span className="text-6xl mb-3 block">{pokeInfo.emoji}</span>
                <p className="text-xl font-headline font-bold text-on-surface">
                  Ai đó {pokeInfo.label}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

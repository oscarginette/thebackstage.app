'use client';

import {
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  FileText,
  History,
  Music,
  Users,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

// Configuration for the items in the dock
const DOCK_ITEMS = [
  { id: 'drafts', icon: FileText, label: 'Borradores' },
  { id: 'tracks', icon: Music, label: 'Tracks' },
  { id: 'history', icon: History, label: 'Historial' },
  { id: 'contacts', icon: Users, label: 'Contactos' },
];

const IDLE_TIMEOUT = 3000; // 3 seconds
const ACTIVE_DISTANCE = 300; // Lux distance to be considered "near"

export default function Dock() {
  const mouseX = useMotionValue(Infinity);
  const mouseY = useMotionValue(Infinity);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      mouseX.set(e.pageX);
      
      // Check proximity to the dock area (right side)
      const distFromRight = window.innerWidth - e.pageX;
      const isNear = distFromRight < ACTIVE_DISTANCE;
      const isMagnificationRange = distFromRight < 150;

      // Only animate icons (magnification) if we are horizontally close
      if (isMagnificationRange) {
        mouseY.set(e.pageY);
      } else {
        mouseY.set(Infinity);
      }

      if (isNear) {
        setIsIdle(false);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      } else {
        if (!idleTimerRef.current && !isIdle) {
          idleTimerRef.current = setTimeout(() => {
            setIsIdle(true);
          }, IDLE_TIMEOUT);
        }
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isIdle]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Base opacity based on proximity and idle state
  const proximityOpacitySync = useTransform(
    mouseX,
    (val) => {
      if (isIdle) return 0.05;
      const distFromRight = window.innerWidth - val;
      if (distFromRight > ACTIVE_DISTANCE) return 0.1;
      return 1 - (distFromRight / ACTIVE_DISTANCE) * 0.9;
    }
  );
  
  const dockOpacity = useSpring(proximityOpacitySync, { stiffness: 100, damping: 20 });

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50">
      <motion.div
        style={{ opacity: dockOpacity }}
        className="flex flex-col items-center gap-4 px-2 py-4"
      >
        {DOCK_ITEMS.map((item) => (
          <DockItem
            key={item.id}
            mouseY={mouseY}
            icon={item.icon}
            label={item.label}
            onClick={() => scrollToSection(item.id)}
          />
        ))}
      </motion.div>
    </div>
  );
}

function DockItem({
  mouseY,
  icon: Icon,
  label,
  onClick,
}: {
  mouseY: MotionValue;
  icon: typeof FileText;
  label: string;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseY, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - (bounds.y + window.scrollY) - bounds.height / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [44, 75, 44]);
  const size = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onClick={onClick}
      className="cursor-pointer rounded-full flex items-center justify-center relative group transition-colors"
    >
      <Icon className="h-6 w-6 text-gray-800 pointer-events-none drop-shadow-sm" />
      
      {/* Tooltip - Adjusted for right position */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
        {label}
      </div>
    </motion.div>
  );
}

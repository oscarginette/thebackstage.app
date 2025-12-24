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
  BarChart2,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Configuration for the items in the dock
const DOCK_ITEMS = [
  { id: 'drafts', icon: FileText, label: 'Borradores' },
  { id: 'tracks', icon: Music, label: 'Tracks' },
  { id: 'gates', icon: BarChart2, label: 'Download Gates' },
  { id: 'history', icon: History, label: 'Historial' },
  { id: 'contacts', icon: Users, label: 'Contactos' },
];

const IDLE_TIMEOUT = 3000; // 3 seconds
const ACTIVE_DISTANCE = 300; // Lux distance to be considered "near"

export default function Dock() {
  const router = useRouter();
  const pathname = usePathname();
  const mouseY = useMotionValue(Infinity);
  const dockDistance = useMotionValue(Infinity);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dockRef.current) return;
      
      const rect = dockRef.current.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const rightX = window.innerWidth; // Dock is at right edge, effectively
      
      // Calculate distances using client coordinates (viewport relative) as Dock is fixed
      const dX = Math.abs(rightX - e.clientX); // Distance from right edge
      const dyRaw = Math.abs(e.clientY - rect.top - rect.height / 2) - rect.height / 2;
      const dY = Math.max(0, dyRaw); // 0 if inside vertical bounds
      
      // True 2D distance to the "dock segment"
      const distance = Math.hypot(dX, dY);
      
      dockDistance.set(distance);
      
      // Active zones
      const isMagnificationZone = distance < 150;
      const isOpacityZone = distance < 300;

      // Magnification logic
      if (isMagnificationZone) {
        mouseY.set(e.clientY);
      } else {
        mouseY.set(Infinity);
      }

      // Idle logic
      if (isOpacityZone) {
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
  }, [isIdle, dockDistance, mouseY]);

  const scrollToSection = (id: string) => {
    // Map dock IDs to dashboard tabs
    const tabMapping: Record<string, string> = {
      'drafts': 'engagement',
      'tracks': 'engagement',
      'gates': 'growth',
      'history': 'engagement',
      'contacts': 'audience'
    };

    const targetTab = tabMapping[id];

    if (pathname === '/dashboard' && targetTab) {
      // If we are on dashboard, update the tab in URL
      router.push(`/dashboard?tab=${targetTab}`, { scroll: false });
      
      // Wait for tab transition, then scroll
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      // Navigation logic
      if (id === 'gates' && pathname !== '/dashboard/download-gates') {
        router.push('/dashboard?tab=growth');
      } else if (pathname !== '/dashboard') {
        const url = targetTab ? `/dashboard?tab=${targetTab}#${id}` : `/dashboard#${id}`;
        router.push(url);
      }
    }
  };

  // Base opacity based on proximity and idle state
  const proximityOpacitySync = useTransform(
    dockDistance,
    (val) => {
      if (isIdle) return 0.05;
      if (val > ACTIVE_DISTANCE) return 0.1;
      return 1 - (val / ACTIVE_DISTANCE) * 0.9;
    }
  );
  
  const dockOpacity = useSpring(proximityOpacitySync, { stiffness: 100, damping: 20 });

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50">
      <motion.div
        ref={dockRef}
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
    // val is now clientY (viewport), bounds.y is viewport. No need for scrollY.
    return val - bounds.y - bounds.height / 2;
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

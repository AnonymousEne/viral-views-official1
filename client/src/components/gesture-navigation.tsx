import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { 
  Home, Search, PlusCircle, Heart, User,
  Music, Radio, TrendingUp, Zap, Crown
} from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  color: string;
}

interface GestureNavigationProps {
  tabs: Tab[];
  initialTab?: string;
  onTabChange?: (tabId: string) => void;
  children?: React.ReactNode;
}

export default function GestureNavigation({ 
  tabs, 
  initialTab = tabs[0]?.id, 
  onTabChange,
  children 
}: GestureNavigationProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showHints, setShowHints] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<number>(0);
  const lastTabChangeRef = useRef<number>(0);

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  // Handle tab switching
  const switchToTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
    lastTabChangeRef.current = Date.now();
  }, [onTabChange]);

  const switchToPrevious = useCallback(() => {
    if (currentTabIndex > 0) {
      switchToTab(tabs[currentTabIndex - 1].id);
    }
  }, [currentTabIndex, tabs, switchToTab]);

  const switchToNext = useCallback(() => {
    if (currentTabIndex < tabs.length - 1) {
      switchToTab(tabs[currentTabIndex + 1].id);
    }
  }, [currentTabIndex, tabs, switchToTab]);

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: switchToNext,
    onSwipedRight: switchToPrevious,
    onSwipedUp: () => {
      // Quick access to trending/featured content
      if (tabs.find(t => t.id === 'discover')) {
        switchToTab('discover');
      }
    },
    onSwipedDown: () => {
      // Quick access to profile/settings
      if (tabs.find(t => t.id === 'profile')) {
        switchToTab('profile');
      }
    },
    trackMouse: true,
    delta: 50 // Minimum distance for swipe
  });

  // Pan gesture for smooth tab transitions
  const handlePanStart = useCallback(() => {
    setIsDragging(true);
    dragStartRef.current = Date.now();
  }, []);

  const handlePan = useCallback((event: any, info: PanInfo) => {
    const screenWidth = window.innerWidth;
    const offset = (info.offset.x / screenWidth) * 100;
    setDragOffset(Math.max(-100, Math.min(100, offset)));
  }, []);

  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    setIsDragging(false);
    const velocity = info.velocity.x;
    const offset = info.offset.x;
    const threshold = window.innerWidth * 0.25; // 25% of screen width

    // Determine if we should switch tabs based on velocity and distance
    if (Math.abs(velocity) > 500 || Math.abs(offset) > threshold) {
      if (offset > 0) {
        switchToPrevious();
      } else {
        switchToNext();
      }
    }

    setDragOffset(0);
  }, [switchToPrevious, switchToNext]);

  // Hide hints after interaction
  useEffect(() => {
    const timer = setTimeout(() => setShowHints(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          switchToPrevious();
          break;
        case 'ArrowRight':
          switchToNext();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          const index = parseInt(event.key) - 1;
          if (tabs[index]) {
            switchToTab(tabs[index].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [switchToPrevious, switchToNext, switchToTab, tabs]);

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div 
      className="h-screen w-full bg-black relative overflow-hidden"
      {...handlers}
      ref={containerRef}
    >
      {/* Main content area */}
      <motion.div
        className="relative h-full"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={handlePanStart}
        onDrag={handlePan}
        onDragEnd={handlePanEnd}
        animate={{ 
          x: isDragging ? `${dragOffset}%` : '0%' 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {ActiveComponent ? <ActiveComponent /> : children}
          </motion.div>
        </AnimatePresence>

        {/* Tab preview overlays */}
        <AnimatePresence>
          {isDragging && (
            <>
              {/* Previous tab preview */}
              {currentTabIndex > 0 && dragOffset > 10 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: Math.min(dragOffset / 50, 0.3) }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent to-purple-500/20"
                >
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white">
                    <div className="text-center">
                      {React.createElement(tabs[currentTabIndex - 1].icon, { 
                        className: "w-8 h-8 mx-auto mb-2" 
                      })}
                      <div className="text-sm">{tabs[currentTabIndex - 1].label}</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Next tab preview */}
              {currentTabIndex < tabs.length - 1 && dragOffset < -10 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: Math.min(Math.abs(dragOffset) / 50, 0.3) }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-l from-transparent to-blue-500/20"
                >
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white">
                    <div className="text-center">
                      {React.createElement(tabs[currentTabIndex + 1].icon, { 
                        className: "w-8 h-8 mx-auto mb-2" 
                      })}
                      <div className="text-sm">{tabs[currentTabIndex + 1].label}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-gray-800 z-50">
        <div className="flex items-center justify-around py-2 px-4">
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => switchToTab(tab.id)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
                  isActive 
                    ? `bg-${tab.color}-500/20 text-${tab.color}-400` 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <tab.icon className={`w-6 h-6 mb-1 ${
                  isActive ? `text-${tab.color}-400` : ''
                }`} />
                <span className="text-xs font-medium">{tab.label}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-${tab.color}-400 rounded-full`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation hints */}
      <AnimatePresence>
        {showHints && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40"
          >
            <div className="bg-black/70 text-white text-xs px-3 py-2 rounded-full">
              ← Swipe to navigate →
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture feedback */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
          >
            <div className="text-white text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: dragOffset > 0 ? [-5, 5, -5] : [5, -5, 5]
                }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-4xl mb-2"
              >
                {dragOffset > 0 ? '←' : '→'}
              </motion.div>
              <div className="text-sm">
                {dragOffset > 0 && currentTabIndex > 0 && tabs[currentTabIndex - 1].label}
                {dragOffset < 0 && currentTabIndex < tabs.length - 1 && tabs[currentTabIndex + 1].label}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick actions overlay */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-20 space-y-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
          onClick={() => setShowHints(!showHints)}
        >
          ?
        </motion.button>
      </div>

      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20 space-y-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
          onClick={() => switchToTab('create')}
        >
          <PlusCircle className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}

// Hook for external components to trigger navigation
export function useGestureNavigation() {
  const [currentTab, setCurrentTab] = useState<string>('');

  const navigateToTab = useCallback((tabId: string) => {
    setCurrentTab(tabId);
    // Dispatch custom event for navigation
    window.dispatchEvent(new CustomEvent('gesture-navigate', { 
      detail: { tabId } 
    }));
  }, []);

  return { currentTab, navigateToTab };
}
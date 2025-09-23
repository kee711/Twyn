'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  FileEdit,
  FileText,
  Calendar,
  BarChart2,
  MessageSquare,
  ChevronDown,
  Settings,
  X,
  MessageSquareReply,
  AtSign,
  Bookmark
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { SocialAccountSelector } from '@/components/SocialAccountSelector';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';


// Navigation item type definition
interface NavItem {
  name: string;          // Display name of the navigation item
  href?: string;         // URL path for navigation (optional for expandable items)
  icon: LucideIcon;      // Lucide icon component
  isExpandable?: boolean;// Whether this item has expandable sub-items
  subItems?: {           // Array of sub-navigation items
    name: string;
    href: string;
    icon: LucideIcon;
  }[];
}

interface SidebarProps {
  className?: string;    // Optional className for styling
}

// Local storage key for persisting sidebar state
const STORAGE_KEY = 'sidebar-open-items';

export function Sidebar({ className }: SidebarProps) {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isSidebarOpen, closeSidebar, isMobile } = useMobileSidebar();

  // Initialize with empty array to prevent hydration mismatch
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load saved state after initial render
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved !== 'undefined' && saved !== 'null') {
        setOpenItems(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('localStorage access failed:', error);
      // Clear corrupted localStorage data
      localStorage.removeItem(STORAGE_KEY);
    }
    setMounted(true);
  }, []);

  // Persist open items state to localStorage whenever it changes
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(openItems));
      } catch (error) {
        console.warn('localStorage save failed:', error);
      }
    }
  }, [openItems, mounted]);

  // Toggle handler for expandable menu items
  const toggleItem = (itemName: string) => {
    setOpenItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((item) => item !== itemName)
        : [itemName] // Only keep the newly opened item
    );
  };

  // 모바일에서 링크 클릭 시 사이드바 닫기
  const handleLinkClick = () => {
    if (isMobile) {
      closeSidebar();
    }
  };

  // Navigation configuration
  const navigation: NavItem[] = [
    {
      name: t('contentsCooker'),
      icon: FileEdit,
      isExpandable: true,
      subItems: [
        { name: t('topicFinder'), href: '/contents/topic-finder', icon: TrendingUp },
        // { name: t('postRadar'), href: '/contents/post-radar', icon: Newspaper },
        { name: t('draft'), href: '/contents/draft', icon: FileText },
        { name: t('saved'), href: '/contents/saved', icon: Bookmark },
      ],
    },
    {
      name: t('schedule'),
      href: '/schedule',
      icon: Calendar,
    },
    {
      name: t('statistics'),
      href: '/statistics',
      icon: BarChart2,
    },
    {
      name: t('comments'),
      icon: MessageSquare,
      isExpandable: true,
      subItems: [
        { name: t('comments'), href: '/comments', icon: MessageSquareReply },
        { name: t('mentions'), href: '/mentions', icon: AtSign },
      ],
    },
  ];

  // 항상 라이트 테마 로고 사용
  const logoSrc = '/twyn-logo-blk.svg';

  // 모바일에서 오버레이 클릭 시 사이드바 닫기
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeSidebar();
    }
  };

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <div className={cn(
        "w-[224px] hidden md:block",
        className
      )}>
        <SidebarContent
          navigation={navigation}
          logoSrc={logoSrc}
          pathname={pathname}
          session={session}
          openItems={openItems}
          toggleItem={toggleItem}
          onLinkClick={handleLinkClick}
        />
      </div>

      {/* 모바일 오버레이 및 사이드바 */}
      {isMobile && (
        <>
          {/* 오버레이 */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={handleOverlayClick}
            />
          )}

          {/* 모바일 사이드바 */}
          <div className={cn(
            "fixed left-0 top-0 z-50 h-full w-[280px] transform bg-muted transition-transform duration-300 ease-in-out md:hidden",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            {/* 닫기 버튼 */}
            <div className="absolute top-0 right-0 items-center justify-between p-4 border-b">
              <Button
                variant="ghost"
                size="icon"
                onClick={closeSidebar}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-screen overflow-y-auto">
              <SidebarContent
                navigation={navigation}
                logoSrc={logoSrc}
                pathname={pathname}
                session={session}
                openItems={openItems}
                toggleItem={toggleItem}
                onLinkClick={handleLinkClick}
                isMobile={true}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

// 사이드바 콘텐츠 분리 컴포넌트
function SidebarContent({
  navigation,
  logoSrc,
  pathname,
  session,
  openItems,
  toggleItem,
  onLinkClick,
  isMobile = false,
}: {
  navigation: NavItem[];
  logoSrc: string;
  pathname: string;
  session: any;
  openItems: string[];
  toggleItem: (itemName: string) => void;
  onLinkClick: () => void;
  isMobile?: boolean;
}) {
  const t = useTranslations('navigation');

  return (
    <div className="flex flex-col justify-between h-full">
      {/* Top section: Logo and Navigation */}
      <div className="px-3 flex-1">
        {/* Logo - 모바일에서는 더 작게 */}
        <div className="py-5 px-2">
          <Link className={cn(
            isMobile ? "mt-1" : "mt-2"
          )} href="/contents/topic-finder" onClick={onLinkClick}>
            <Image
              src={logoSrc}
              alt="Logo"
              width={isMobile ? 100 : 92}
              height={isMobile ? 80 : 80}
            />
          </Link>
        </div>
        {/* 소셜 계정 전환 dropdown */}
        <div className="mb-4">
          <SocialAccountSelector />
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            // Render expandable menu item with dropdown
            if (item.isExpandable) {
              const isOpen = openItems.includes(item.name);
              return (
                <div key={item.name}>
                  {/* Dropdown trigger button */}
                  <Button
                    variant="ghost"
                    className="w-full justify-between font-normal px-3 text-sm text-muted-foreground"
                    onClick={() => toggleItem(item.name)}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isOpen && "transform rotate-180"
                      )}
                    />
                  </Button>

                  {/* Dropdown content with animation */}
                  <div className={cn(
                    "space-y-1 overflow-hidden transition-all duration-200",
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}>
                    {item.subItems?.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        onClick={onLinkClick}
                        className={cn(
                          "flex items-center rounded-xl px-6 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-accent-foreground",
                          pathname === subItem.href
                            ? "bg-accent text-accent-foreground"
                            : "transparent"
                        )}
                      >
                        <subItem.icon className="mr-3 h-4 w-4" />
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            // Skip items without href
            if (!item.href) return null;

            // Render regular menu item
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onLinkClick}
                className={cn(
                  "flex items-center rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-accent-foreground",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "transparent"
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Streaks */}
      {/* <div className="border border-slate-300 rounded-lg px-2 py-4 m-4 mb-0">
        <div className="flex items-center justify-center">
          <Flame className="h-7 w-7" />
          <p className="text-2xl font-bold">10</p>
        </div>
      </div> */}

      {/* Bottom section: User Profile */}
      <div className=" border-slate-300 rounded-lg p-4 mb-4">
        <div className="flex-col px-2 py-2 mb-4 justify-between rounded-xl border border-muted-foreground/10">
          <div className="text-sm font-medium text-muted-foreground mb-2 ml-1 mt-1">
            {t('joinOurCommunity')}
          </div>
          {/* Social Links */}
          <div className="flex items-start justify-center gap-1">
            <Link
              href="https://www.threads.com/@twyn.intern"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors bg-muted-foreground/10 flex items-center justify-center rounded-lg w-full p-2 group relative"
            >
              <Image
                src="/threads_logo.svg"
                alt="Threads"
                width={20}
                height={20}
                className="opacity-100 group-hover:opacity-0 transition-opacity duration-200 absolute"
              />
              <Image
                src="/threads_logo_blk.svg"
                alt="Threads"
                width={20}
                height={20}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              />
            </Link>
            <Link
              href="https://x.com/twyn_official?s=11&t=sc5V6xMmb_dTK77C0CJIAQ"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors bg-muted-foreground/10 flex items-center justify-center rounded-lg w-full p-2"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://ww  w.w3.org/2000/svg"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </Link>
            <Link
              href="https://discord.gg/QwbUJ28FfC"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors bg-muted-foreground/10 flex items-center justify-center rounded-lg w-full p-2"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
              </svg>
            </Link>
          </div>
        </div>
        {session ? (
          // 로그인된 경우
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* User Avatar */}
              <Avatar>
                <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                <AvatarFallback>
                  {session.user?.name
                    ? session.user.name
                      .split(' ')
                      .filter((n: string) => n.length > 0)
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase() || '??'
                    : '??'}
                </AvatarFallback>
              </Avatar>
              {/* User Info */}
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{session.user?.name}</p>
                <p className="text-xs text-muted-foreground">{t('premiumPlan')}</p>
              </div>
            </div>
            <div className="flex items-center">
              {/* Settings Button */}
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="flex items-center gap-1 text-gray-400 hover:bg-gray-200"
              >
                <Link href="/settings" onClick={onLinkClick}>
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">{t('settings')}</span>
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          // 로그인되지 않은 경우
          <Button
            variant="default"
            className="w-full"
            onClick={() => signIn()}
          >
            {t('login')}
          </Button>
        )}
      </div>
    </div >
  );
} 

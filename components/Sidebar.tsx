'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  Search as SearchIcon,
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
  Bookmark,
  UserRoundCog,
  Check,
  Plus,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LucideIcon } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import useSocialAccountStore, { type SocialAccount, type PlatformKey } from '@/stores/useSocialAccountStore';
import { PLATFORM_KEYS } from '@/stores/useThreadChainStore';
import { useThreadsProfilePicture } from '@/hooks/useThreadsProfilePicture';
import { toast } from 'sonner';
import { useSignIn, QRCode } from '@farcaster/auth-kit';
import type { StatusAPIResponse } from '@farcaster/auth-client';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';


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

const PLATFORM_DISPLAY_NAMES: Record<PlatformKey, string> = {
  threads: 'Threads',
  x: 'X',
  farcaster: 'Farcaster',
};

const PLATFORM_ICON_MAP: Record<PlatformKey, { src: string; alt: string }> = {
  threads: { src: '/threads_logo_wh.svg', alt: 'Threads logo' },
  x: { src: '/x-logo.jpg', alt: 'X logo' },
  farcaster: { src: '/farcaster-logo.svg', alt: 'Farcaster logo' },
};

const MAX_VISIBLE_SELECTED_ACCOUNTS = 4;

export function Sidebar({ className }: SidebarProps) {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isSidebarOpen, closeSidebar, isMobile } = useMobileSidebar();
  const tAccounts = useTranslations('SocialAccountSelector');
  const {
    accounts,
    selectedAccounts,
    fetchAccounts,
    selectAccount,
    isLoading: isAccountLoading,
  } = useSocialAccountStore();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Initialize with empty array to prevent hydration mismatch
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchAccounts(session.user.id);
  }, [session?.user?.id, fetchAccounts]);

  const handleAccountSelect = async (platform: PlatformKey, socialAccountId: string) => {
    if (!session?.user?.id) {
      toast.error(tAccounts('failedToSaveSelection'));
      return;
    }

    try {
      await selectAccount(session.user.id, platform, socialAccountId);
      toast.success(tAccounts('selectionSaved'));
    } catch (error) {
      console.error('[Sidebar] Failed to select account', error);
      toast.error(tAccounts('failedToSaveSelection'));
    }
  };

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
        {
          // TODO(test-feature): remove Threads search experimental entry after validation
          name: t('threadsSearchTest'),
          href: '/contents/search',
          icon: SearchIcon,
        },
        // { name: t('postRadar'), href: '/contents/post-radar', icon: Newspaper },
        { name: t('draft'), href: '/contents/draft', icon: FileText },
        // { name: t('saved'), href: '/contents/saved', icon: Bookmark },
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
          accounts={accounts}
          selectedAccounts={selectedAccounts}
          onAccountSettingsClick={() => setIsAccountModalOpen(true)}
          isAccountLoading={isAccountLoading}
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
            "fixed left-0 top-0 z-50 h-[100dvh] w-[280px] transform bg-muted transition-transform duration-300 ease-in-out md:hidden",
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

            <div
              className="h-[100dvh] overflow-y-auto"
              style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
              }}
            >
              <SidebarContent
                navigation={navigation}
                logoSrc={logoSrc}
                pathname={pathname}
                session={session}
                openItems={openItems}
                toggleItem={toggleItem}
                onLinkClick={handleLinkClick}
                isMobile={true}
                accounts={accounts}
                selectedAccounts={selectedAccounts}
                onAccountSettingsClick={() => setIsAccountModalOpen(true)}
                isAccountLoading={isAccountLoading}
              />
            </div>
          </div>
        </>
      )}

      <AccountSelectionModal
        open={isAccountModalOpen}
        onOpenChange={setIsAccountModalOpen}
        accounts={accounts}
        selectedAccounts={selectedAccounts}
        onSelectAccount={handleAccountSelect}
        fetchAccounts={fetchAccounts}
        userId={session?.user?.id ?? null}
      />
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
  accounts,
  selectedAccounts,
  onAccountSettingsClick,
  isAccountLoading,
  isMobile = false,
}: {
  navigation: NavItem[];
  logoSrc: string;
  pathname: string;
  session: any;
  openItems: string[];
  toggleItem: (itemName: string) => void;
  onLinkClick: () => void;
  accounts: SocialAccount[];
  selectedAccounts: Partial<Record<PlatformKey, string>>;
  onAccountSettingsClick: () => void;
  isAccountLoading: boolean;
  isMobile?: boolean;
}) {
  const t = useTranslations('navigation');
  const tAccounts = useTranslations('SocialAccountSelector');

  const selectedAccountList = useMemo(() => {
    return PLATFORM_KEYS
      .map((platform) => {
        const selectedId = selectedAccounts?.[platform];
        if (!selectedId) return null;
        return accounts.find((account) => account.id === selectedId) || null;
      })
      .filter(Boolean) as SocialAccount[];
  }, [accounts, selectedAccounts]);

  const visibleAccounts = selectedAccountList.slice(0, MAX_VISIBLE_SELECTED_ACCOUNTS);
  const overflowCount = selectedAccountList.length - visibleAccounts.length;

  const renderSelectedAccountStack = () => {
    if (isAccountLoading) {
      return (
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted/60" />
          <div className="h-3 w-12 animate-pulse rounded-full bg-muted/60" />
        </div>
      );
    }

    if (visibleAccounts.length === 0) {
      return (
        <span className="text-xs text-muted-foreground px-3 py-2 rounded-full border border-dashed border-muted-foreground/30">
          {tAccounts('addAccount')}
        </span>
      );
    }

    return (
      <div className="flex items-center">
        <div className="flex items-center">
          {visibleAccounts.map((account, index) => (
            <SelectedAccountBadge
              key={account.id}
              account={account}
              index={index}
              total={visibleAccounts.length}
            />
          ))}
        </div>
        {overflowCount > 0 && (
          <span className="ml-2 text-sm font-medium text-muted-foreground">+{overflowCount}</span>
        )}
      </div>
    );
  };

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
        {/* Selected accounts stack */}
        <div className="mb-4 px-2">
          <div className="flex items-center justify-between gap-3">
            {renderSelectedAccountStack()}
            <Button
              variant="ghost"
              size="icon"
              onClick={onAccountSettingsClick}
              className="h-8 w-8 shrink-0"
            >
              <UserRoundCog className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
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

function AccountAvatar({ account, className }: { account: SocialAccount; className?: string }) {
  const socialIdForPicture = account.platform === 'threads' ? account.social_id : null;
  const { profilePictureUrl } = useThreadsProfilePicture(socialIdForPicture);
  const displayName = account.username || account.social_id;

  return (
    <Avatar className={cn('h-10 w-10 border border-border/30 bg-background', className)}>
      {profilePictureUrl ? (
        <AvatarImage src={profilePictureUrl} alt={displayName || 'Account avatar'} />
      ) : (
        <AvatarFallback className="text-sm font-medium text-muted-foreground">
          {displayName ? displayName.charAt(0)?.toUpperCase() : '?'}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

function SelectedAccountBadge({ account, index, total }: { account: SocialAccount; index: number; total: number }) {
  const icon = PLATFORM_ICON_MAP[account.platform];
  const zIndex = total - index;

  return (
    <div
      className={cn('relative h-10 w-10', index > 0 && '-ml-3')}
      style={{ zIndex }}
    >
      <AccountAvatar
        account={account}
        className="h-10 w-10 border-2 border-background bg-background shadow-sm"
      />
      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-background bg-background">
        <Image
          src={icon.src}
          alt={icon.alt}
          width={16}
          height={16}
          className="h-4.5 w-4.5 object-contain"
        />
      </div>
    </div>
  );
}

interface AccountSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: SocialAccount[];
  selectedAccounts: Partial<Record<PlatformKey, string>>;
  onSelectAccount: (platform: PlatformKey, socialAccountId: string) => void;
  fetchAccounts: (userId: string) => Promise<void>;
  userId: string | null;
}


function AccountSelectionModal({
  open,
  onOpenChange,
  accounts,
  selectedAccounts,
  onSelectAccount,
  fetchAccounts,
  userId,
}: AccountSelectionModalProps) {
  const tAccounts = useTranslations('SocialAccountSelector');
  const [isFarcasterModalOpen, setIsFarcasterModalOpen] = useState(false);
  const [isWalletFlowActive, setIsWalletFlowActive] = useState(false);
  const [accountPendingRemoval, setAccountPendingRemoval] = useState<SocialAccount | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isRemovingAccount, setIsRemovingAccount] = useState(false);

  const { connectModalOpen } = useConnectModal();
  const { isConnected } = useAccount();
  const prevIsConnectedRef = useRef(isConnected);
  const prevConnectModalOpenRef = useRef(connectModalOpen);

  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const shouldRestoreAccountModalRef = useRef(false);
  const hasProcessedSignInRef = useRef(false);
  const lastProcessedFidRef = useRef<number | null>(null);

  const handleFarcasterError = useCallback((error?: unknown) => {
    console.error('[AccountSelectionModal] Farcaster sign-in error:', error);
    toast.error(tAccounts('farcasterSignInError'));
    setIsFarcasterModalOpen(false);
  }, [tAccounts]);

  const handleFarcasterStatus = useCallback(async (status?: StatusAPIResponse) => {
    if (!status) return;
    const { state, fid, username } = status;
    if (!fid) return;

    if (state && state !== 'completed') {
      return;
    }

    if (!userId) {
      toast.error(tAccounts('farcasterSignInError'));
      return;
    }

    if (hasProcessedSignInRef.current && lastProcessedFidRef.current === fid) {
      return;
    }

    hasProcessedSignInRef.current = true;
    lastProcessedFidRef.current = fid;

    try {
      const response = await fetch('/api/farcaster/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid, username }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to persist Farcaster account');
        throw new Error(errorText);
      }

      toast.success(tAccounts('farcasterLinkSuccess'));
      await fetchAccounts(userId);
    } catch (error) {
      console.error('[AccountSelectionModal] Farcaster account link failed:', error);
      toast.error(tAccounts('farcasterSignInError'));
    } finally {
      setIsFarcasterModalOpen(false);
    }
  }, [fetchAccounts, tAccounts, userId]);

  const {
    connect: connectFarcaster,
    signIn: signInFarcaster,
    reconnect: reconnectFarcaster,
    isError: isFarcasterError,
    error: farcasterError,
    url: farcasterUrl,
    isPolling: isFarcasterPolling,
  } = useSignIn({
    onSuccess: handleFarcasterStatus,
    onStatusResponse: handleFarcasterStatus,
    onError: handleFarcasterError,
  });

  const handleFarcasterConnectClick = useCallback(async () => {
    if (!userId) {
      toast.error(tAccounts('farcasterSignInError'));
      return;
    }

    try {
      hasProcessedSignInRef.current = false;
      lastProcessedFidRef.current = null;
      setIsFarcasterModalOpen(true);

      if (isFarcasterError) {
        reconnectFarcaster();
      }

      await connectFarcaster();
      await signInFarcaster();
    } catch (error) {
      console.error('[AccountSelectionModal] Farcaster connect failed:', error);
      toast.error(tAccounts('farcasterSignInError'));
      setIsFarcasterModalOpen(false);
    }
  }, [connectFarcaster, isFarcasterError, reconnectFarcaster, signInFarcaster, tAccounts, userId]);

  const accountsByPlatform = useMemo(() => {
    return PLATFORM_KEYS.reduce<Record<PlatformKey, SocialAccount[]>>((acc, platform) => {
      acc[platform] = accounts.filter((account) => account.platform === platform);
      return acc;
    }, {
      threads: [],
      x: [],
      farcaster: [],
    } as Record<PlatformKey, SocialAccount[]>);
  }, [accounts]);

  const removalPlatformName = accountPendingRemoval ? PLATFORM_DISPLAY_NAMES[accountPendingRemoval.platform] : '';
  const removalAccountLabel = accountPendingRemoval?.username || accountPendingRemoval?.social_id || '';

  const handleSelect = useCallback((platform: PlatformKey, accountId: string) => {
    onSelectAccount(platform, accountId);
  }, [onSelectAccount]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    longPressTriggeredRef.current = false;
  }, []);

  const triggerAccountRemoval = useCallback((account: SocialAccount) => {
    longPressTriggeredRef.current = true;
    shouldRestoreAccountModalRef.current = open;
    setAccountPendingRemoval(account);
    setIsRemoveDialogOpen(true);
    if (open) {
      onOpenChange(false);
    }
  }, [open, onOpenChange]);

  const handleAccountPointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>, account: SocialAccount) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    longPressTimeoutRef.current = setTimeout(() => {
      triggerAccountRemoval(account);
    }, 600);
  }, [clearLongPressTimer, triggerAccountRemoval]);

  const handleAccountPointerUp = useCallback((event: ReactPointerEvent<HTMLButtonElement>, platform: PlatformKey, account: SocialAccount) => {
    const wasTriggered = longPressTriggeredRef.current;
    clearLongPressTimer();
    if (wasTriggered) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    handleSelect(platform, account.id);
  }, [clearLongPressTimer, handleSelect]);

  const handleAccountPointerLeave = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const closeRemoveDialog = useCallback(() => {
    setIsRemoveDialogOpen(false);
    setAccountPendingRemoval(null);
    clearLongPressTimer();
    if (shouldRestoreAccountModalRef.current) {
      onOpenChange(true);
    }
    shouldRestoreAccountModalRef.current = false;
  }, [clearLongPressTimer, onOpenChange]);

  const handleDialogOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      clearLongPressTimer();
      setAccountPendingRemoval(null);
      setIsRemoveDialogOpen(false);
      setIsFarcasterModalOpen(false);
    }
    onOpenChange(nextOpen);
  }, [clearLongPressTimer, onOpenChange]);

  const handleRemoveAccount = useCallback(async () => {
    if (!accountPendingRemoval || !userId) return;

    try {
      setIsRemovingAccount(true);
      const response = await fetch('/api/social/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socialAccountId: accountPendingRemoval.id,
          platform: accountPendingRemoval.platform,
        }),
      });

      if (!response.ok) {
        const message = await response.text().catch(() => 'Failed to remove account');
        throw new Error(message);
      }

      toast.success(tAccounts('accountRemoved'));
      await fetchAccounts(userId);
      closeRemoveDialog();
    } catch (error) {
      console.error('[AccountSelectionModal] Failed to remove account:', error);
      toast.error(tAccounts('accountRemoveError'));
    } finally {
      setIsRemovingAccount(false);
    }
  }, [accountPendingRemoval, closeRemoveDialog, fetchAccounts, tAccounts, userId]);

  const handleConnect = useCallback((platform: PlatformKey) => {
    if (typeof window === 'undefined') return;

    const redirectMap: Record<PlatformKey, string> = {
      threads: '/api/threads/oauth',
      x: '/api/x/oauth',
      farcaster: '',
    };

    const target = redirectMap[platform];
    if (!target) return;
    window.location.href = target;
  }, []);

  const handleWalletConnectStart = useCallback(() => {
    setIsWalletFlowActive(true);
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    const wasConnected = prevIsConnectedRef.current;

    if (isWalletFlowActive && !wasConnected && isConnected) {
      setIsWalletFlowActive(false);
      if (!open) {
        onOpenChange(true);
      }
    }

    prevIsConnectedRef.current = isConnected;
  }, [isConnected, isWalletFlowActive, onOpenChange, open]);

  useEffect(() => {
    const wasOpen = prevConnectModalOpenRef.current;

    if (isWalletFlowActive && wasOpen && !connectModalOpen && !isConnected) {
      setIsWalletFlowActive(false);
      if (!open) {
        onOpenChange(true);
      }
    }

    prevConnectModalOpenRef.current = connectModalOpen;
  }, [connectModalOpen, isWalletFlowActive, isConnected, onOpenChange, open]);

  useEffect(() => {
    if (!isFarcasterModalOpen) {
      hasProcessedSignInRef.current = false;
      lastProcessedFidRef.current = null;
    }
  }, [isFarcasterModalOpen]);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent hideClose className="max-w-md overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 text-left">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg text-left font-semibold">
              {tAccounts('accountList')}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <WalletConnectButton
                className="shrink-0"
                onOpenConnectModal={handleWalletConnectStart}
              />
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">{tAccounts('close')}</span>
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        <div
          className="px-6 pb-6 space-y-6"
          aria-hidden={connectModalOpen}
        >
          {PLATFORM_KEYS.map((platform) => {
            const platformAccounts = accountsByPlatform[platform];
            const selectedId = selectedAccounts?.[platform];
            return (
              <div key={platform} className="space-y-3">
                <div className="flex gap-2 items-center justify-between">
                  <span className="text-xs font-light text-muted-foreground">
                    {PLATFORM_DISPLAY_NAMES[platform]}
                  </span>
                  <div className="h-px w-full bg-border/60" />
                </div>

                {platformAccounts.length > 0 ? (
                  <div className="space-y-2">
                    {platformAccounts.map((account) => {
                      const isSelected = selectedId === account.id;
                      const icon = PLATFORM_ICON_MAP[account.platform];

                      return (
                        <button
                          type="button"
                          key={account.id}
                          onPointerDown={(event) => handleAccountPointerDown(event, account)}
                          onPointerUp={(event) => handleAccountPointerUp(event, platform, account)}
                          onPointerLeave={handleAccountPointerLeave}
                          onPointerCancel={handleAccountPointerLeave}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleSelect(platform, account.id);
                            }
                          }}
                          className={cn(
                            'flex w-full rounded-full p-1 items-center gap-3 text-left transition',
                            isSelected
                              ? ''
                              : 'hover:bg-muted/60',
                            !isSelected && 'opacity-50 hover:opacity-100'
                          )}
                        >
                          <div className="relative h-10 w-10">
                            <AccountAvatar
                              account={account}
                              className="h-10 w-10 border border-border/40 bg-background"
                            />
                            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-background bg-background">
                              <Image
                                src={icon.src}
                                alt={icon.alt}
                                width={16}
                                height={16}
                                className="h-4.5 w-4.5 object-contain"
                              />
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {account.username || account.social_id}
                            </span>
                          </div>

                          {isSelected ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 bg-background px-4 py-4 text-xs text-muted-foreground">
                    {tAccounts('noAccountsRegistered')}
                  </div>
                )}

                {platform !== 'farcaster' ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex w-full rounded-full bg-muted border-0 items-center gap-2 justify-center"
                    onClick={() => handleConnect(platform)}
                  >
                    <Plus className="h-4 w-4 object-contain" />
                    <span className="text-xs font-medium text-foreground">Connect {PLATFORM_DISPLAY_NAMES[platform]}</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex w-full rounded-full bg-muted border-0 items-center gap-2 justify-center"
                    onClick={handleFarcasterConnectClick}
                    disabled={!userId || isFarcasterPolling}
                  >
                    <Plus className="h-4 w-4 object-contain" />
                    <span className="text-xs font-medium text-foreground">
                      {isFarcasterPolling ? 'Connecting…' : 'Connect Farcaster'}
                    </span>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>

      <Dialog open={isFarcasterModalOpen} onOpenChange={setIsFarcasterModalOpen}>
        <DialogContent className="max-w-sm space-y-4 z-[60]" overlayClassName="z-[60]">
          <DialogHeader>
            <DialogTitle>Connect Farcaster</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Scan the QR code with Warpcast to link your Farcaster account.
          </p>
          <div className="flex justify-center">
            {farcasterUrl ? (
              <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                <QRCode uri={farcasterUrl} size={180} />
              </div>
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            )}
          </div>
          {isFarcasterError && farcasterError ? (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {farcasterError instanceof Error ? farcasterError.message : tAccounts('farcasterSignInError')}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isRemoveDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeRemoveDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tAccounts('removeAccountTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tAccounts('removeAccountDescription', {
                platform: removalPlatformName,
                account: removalAccountLabel,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingAccount} onClick={closeRemoveDialog}>
              {tAccounts('removeAccountCancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemovingAccount}
              onClick={(event) => {
                event.preventDefault();
                handleRemoveAccount();
              }}
            >
              {isRemovingAccount ? tAccounts('removeAccountProcessing') : tAccounts('removeAccountConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

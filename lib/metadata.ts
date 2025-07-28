import { Metadata } from 'next'

const baseUrl = 'https://twyn.sh'
const siteName = 'twyn'

type Locale = 'ko' | 'en'

interface LocalizedContent {
  title: string
  description: string
  keywords?: string[]
}

interface PageMetadata {
  ko: LocalizedContent
  en: LocalizedContent
  path: string
}

export const pageMetadata: Record<string, PageMetadata> = {
  home: {
    ko: {
      title: 'twyn | 스레드에서 더 빠르게 성장하세요',
      description: '스레드에서 더 빠르게 성장하세요. AI가 콘텐츠를 생성하고 최적의 시간에 자동 게시해드립니다.',
      keywords: ['스레드', '소셜미디어', 'AI', '콘텐츠 생성', '자동화', '마케팅', 'threads', 'social media']
    },
    en: {
      title: 'twyn | Grow faster on Threads',
      description: 'Grow faster on Threads with your AI twin. Automated content creation and optimal posting times.',
      keywords: ['threads', 'social media', 'ai', 'content creation', 'automation', 'marketing', 'growth']
    },
    path: '/',
  },
  signin: {
    ko: {
      title: '로그인 | twyn',
      description: 'twyn에 로그인하여 AI 기반 스레드 콘텐츠 관리를 시작하세요.',
      keywords: ['로그인', '가입', '인증']
    },
    en: {
      title: 'Sign In | twyn',
      description: 'Sign in to twyn and start managing your Threads content with AI.',
      keywords: ['login', 'signin', 'authentication']
    },
    path: '/signin',
  },
  onboarding: {
    ko: {
      title: '시작하기 | twyn',
      description: 'twyn 설정을 완료하고 AI 기반 스레드 마케팅을 시작해보세요.',
      keywords: ['시작', '설정', '온보딩']
    },
    en: {
      title: 'Get Started | twyn',
      description: 'Complete your twyn setup and start AI-powered Threads marketing.',
      keywords: ['onboarding', 'setup', 'getting started']
    },
    path: '/onboarding',
  },
  topicFinder: {
    ko: {
      title: '토픽 파인더 | twyn',
      description: 'AI가 트렌딩 토픽을 분석하여 바이럴 가능성이 높은 콘텐츠 아이디어를 제안합니다.',
      keywords: ['토픽 파인더', '콘텐츠 아이디어', '트렌드 토픽', '바이럴 콘텐츠', 'AI 추천']
    },
    en: {
      title: 'Topic Finder | twyn',
      description: 'AI analyzes trending topics to suggest viral content ideas for your Threads.',
      keywords: ['topic finder', 'content ideas', 'trending topics', 'viral content', 'ai suggestions']
    },
    path: '/contents/topic-finder',
  },
  postRadar: {
    ko: {
      title: '포스트 레이더 | twyn',
      description: '인기 있는 스레드 게시물을 분석하고 나만의 스타일로 재가공하여 새로운 콘텐츠를 만들어보세요.',
      keywords: ['포스트 레이더', '콘텐츠 분석', '인기 게시물', '콘텐츠 영감']
    },
    en: {
      title: 'Post Radar | twyn',
      description: 'Analyze popular Threads posts and recreate them in your own style for fresh content.',
      keywords: ['post radar', 'content analysis', 'trending posts', 'content inspiration']
    },
    path: '/contents/post-radar',
  },
  saved: {
    ko: {
      title: '저장된 콘텐츠 | twyn',
      description: '저장한 콘텐츠와 아이디어를 관리하고 언제든지 다시 활용해보세요.',
      keywords: ['저장된 콘텐츠', '콘텐츠 라이브러리', '북마크']
    },
    en: {
      title: 'Saved Content | twyn',
      description: 'Manage your saved content and ideas, ready to use anytime.',
      keywords: ['saved content', 'content library', 'bookmarks']
    },
    path: '/contents/saved',
  },
  draft: {
    ko: {
      title: '드래프트 | twyn',
      description: '작성 중인 콘텐츠를 임시 저장하고 편집하여 완성도 높은 게시물을 만들어보세요.',
      keywords: ['드래프트', '콘텐츠 편집', '작업 중']
    },
    en: {
      title: 'Draft | twyn',
      description: 'Save and edit your content drafts to create polished posts.',
      keywords: ['draft', 'content editing', 'work in progress']
    },
    path: '/contents/draft',
  },
  schedule: {
    ko: {
      title: '스케줄 관리 | twyn',
      description: '콘텐츠 게시 일정을 관리하고 최적의 시간에 자동으로 게시되도록 설정하세요.',
      keywords: ['스케줄', '콘텐츠 캘린더', '자동 게시', '게시 관리']
    },
    en: {
      title: 'Schedule Management | twyn',
      description: 'Manage your content posting schedule and set up automatic publishing at optimal times.',
      keywords: ['schedule', 'content calendar', 'auto posting', 'publishing']
    },
    path: '/schedule',
  },
  scheduleCalendar: {
    ko: {
      title: '캘린더 뷰 | twyn',
      description: '캘린더 형태로 콘텐츠 게시 일정을 한눈에 확인하고 관리하세요.',
      keywords: ['캘린더', '스케줄 뷰', '콘텐츠 계획']
    },
    en: {
      title: 'Calendar View | twyn',
      description: 'View and manage your content posting schedule in calendar format.',
      keywords: ['calendar', 'schedule view', 'content planning']
    },
    path: '/schedule/calendar',
  },
  scheduleList: {
    ko: {
      title: '리스트 뷰 | twyn',
      description: '예정된 게시물을 리스트 형태로 확인하고 세부 내용을 관리하세요.',
      keywords: ['리스트 뷰', '예정된 게시물', '콘텐츠 관리']
    },
    en: {
      title: 'List View | twyn',
      description: 'View scheduled posts in list format and manage details.',
      keywords: ['list view', 'scheduled posts', 'content management']
    },
    path: '/schedule/list',
  },
  statistics: {
    ko: {
      title: '통계 분석 | twyn',
      description: '스레드 계정의 성과를 분석하고 데이터 기반으로 콘텐츠 전략을 개선하세요.',
      keywords: ['분석', '통계', '성과', '인사이트', '데이터 분석']
    },
    en: {
      title: 'Analytics | twyn',
      description: 'Analyze your Threads account performance and improve your content strategy with data insights.',
      keywords: ['analytics', 'statistics', 'performance', 'insights', 'data analysis']
    },
    path: '/statistics',
  },
  comments: {
    ko: {
      title: '댓글 관리 | twyn',
      description: '스레드 게시물의 댓글을 효율적으로 관리하고 팔로워와 소통하세요.',
      keywords: ['댓글', '참여', '커뮤니티 관리']
    },
    en: {
      title: 'Comment Management | twyn',
      description: 'Efficiently manage comments on your Threads posts and engage with followers.',
      keywords: ['comments', 'engagement', 'community management']
    },
    path: '/comments',
  },
  mentions: {
    ko: {
      title: '멘션 관리 | twyn',
      description: '나를 언급한 게시물과 댓글을 한 곳에서 확인하고 빠르게 응답하세요.',
      keywords: ['멘션', '알림', '참여']
    },
    en: {
      title: 'Mention Management | twyn',
      description: 'View posts and comments that mention you in one place and respond quickly.',
      keywords: ['mentions', 'notifications', 'engagement']
    },
    path: '/mentions',
  },
  settings: {
    ko: {
      title: '설정 | twyn',
      description: '계정 정보, 게시 설정, 알림 등 twyn의 모든 설정을 관리하세요.',
      keywords: ['설정', '계정', '환경설정', '구성']
    },
    en: {
      title: 'Settings | twyn',
      description: 'Manage all twyn settings including account info, posting preferences, and notifications.',
      keywords: ['settings', 'account', 'preferences', 'configuration']
    },
    path: '/settings',
  },
  privacy: {
    ko: {
      title: '개인정보처리방침 | twyn',
      description: 'twyn의 개인정보 수집, 이용, 보호에 관한 정책을 확인하세요.',
      keywords: ['개인정보처리방침', '개인정보', '데이터 보호']
    },
    en: {
      title: 'Privacy Policy | twyn',
      description: 'Learn about twyn\'s policies on personal information collection, use, and protection.',
      keywords: ['privacy policy', 'personal information', 'data protection']
    },
    path: '/privacy',
  },
  dataDeletion: {
    ko: {
      title: '데이터 삭제 정책 | twyn',
      description: 'twyn에서 사용자 데이터 삭제 요청 및 처리 절차에 대한 정보를 확인하세요.',
      keywords: ['데이터 삭제', '사용자 권리', '데이터 관리']
    },
    en: {
      title: 'Data Deletion Policy | twyn',
      description: 'Information about user data deletion requests and processing procedures at twyn.',
      keywords: ['data deletion', 'user rights', 'data management']
    },
    path: '/data-deletion-policy',
  }
}

// Detect locale from headers or default to 'ko'
export function detectLocale(request?: Request): Locale {
  if (!request) return 'ko'

  const acceptLanguage = request.headers.get('accept-language') || ''

  // Check if English is preferred
  if (acceptLanguage.includes('en') && !acceptLanguage.includes('ko')) {
    return 'en'
  }

  // Default to Korean
  return 'ko'
}

// Alternative: get locale from pathname
export function getLocaleFromPath(pathname: string): Locale {
  if (pathname.startsWith('/en')) return 'en'
  return 'ko'
}

export function generateMetadata(pageKey: string, locale?: Locale): Metadata {
  const page = pageMetadata[pageKey]
  if (!page) {
    const defaultContent = {
      ko: { title: 'twyn | 스레드에서 더 빠르게 성장하세요', description: 'AI 기반 스레드 마케팅 도구' },
      en: { title: 'twyn | Grow faster on Threads', description: 'AI-powered Threads marketing tool' }
    }
    const content = defaultContent[locale || 'ko']
    return {
      title: content.title,
      description: content.description,
    }
  }

  const currentLocale = locale || 'ko'
  const content = page[currentLocale]
  const url = `${baseUrl}${page.path}`

  const openGraphLocale = currentLocale === 'ko' ? 'ko_KR' : 'en_US'

  return {
    title: content.title,
    description: content.description,
    keywords: content.keywords,
    openGraph: {
      title: content.title,
      description: content.description,
      url,
      siteName,
      images: [
        {
          url: '/opengraph.png',
          width: 1200,
          height: 630,
          alt: content.title,
        },
      ],
      locale: openGraphLocale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
      images: '/opengraph.png',
    },
    alternates: {
      canonical: url,
      languages: {
        'ko': currentLocale === 'ko' ? url : `${baseUrl}/ko${page.path}`,
        'en': currentLocale === 'en' ? url : `${baseUrl}/en${page.path}`,
      },
    },
  }
}
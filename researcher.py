import os
import re
import json
import requests
from pathlib import Path
from functools import lru_cache
from typing import Any, Dict, List, Optional
try:
    from typing import Annotated
    from typing_extensions import TypedDict
except ImportError:
    from typing_extensions import Annotated, TypedDict
from datetime import datetime
from urllib.parse import urlparse, parse_qs

from dotenv import load_dotenv
from langgraph.graph import END, StateGraph

try:
    from tavily import TavilyClient
    import openai
    from textblob import TextBlob
    import nltk
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
except ImportError as exc:
    raise ImportError(
        "Required packages missing. Please install: tavily-python, openai, textblob, nltk, scikit-learn, numpy"
    ) from exc

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env", override=False)

# NLTK 데이터 다운로드 (초기 설정)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

# 타입 정의
class MainKeyword(TypedDict):
    keyword: str
    search_volume: int
    competition_level: str
    cpc_range: Dict[str, float]
    trend_score: float
    relevance_score: float
    regional_data: Dict[str, Any]

class SubKeywordEvaluation(TypedDict):
    keyword: str
    topic_coherence_score: float
    engagement_potential: float
    trend_momentum: float
    competition_advantage: float
    commercial_value: float
    final_score: float
    selection_reason: str

class ContentMetadata(TypedDict):
    content_id: str
    platform: str
    author_info: Dict[str, Any]
    content_type: str
    quality_score: float
    engagement_score: float
    relevance_score: float
    sentiment_score: float
    trend_momentum: float
    content_length: int
    hashtags: List[str]
    mentions: List[str]
    media_type: Optional[str]
    timestamp: datetime
    geographic_data: Optional[Dict[str, Any]]

# 유틸리티 함수들 (먼저 정의)
def _merge_search_results(
    existing: Optional[Dict[str, List[Dict[str, Any]]]],
    new: Optional[Dict[str, List[Dict[str, Any]]]],
) -> Dict[str, List[Dict[str, Any]]]:
    merged: Dict[str, List[Dict[str, Any]]] = {
        platform: list(items) for platform, items in (existing or {}).items()
    }
    if not new:
        return merged

    for platform, items in new.items():
        merged.setdefault(platform, [])
        if items:
            merged[platform].extend(items)
    return merged

def _append_items(existing: Optional[List[Any]], new: Optional[List[Any]]) -> List[Any]:
    combined: List[Any] = list(existing or [])
    if new:
        combined.extend(new)
    return combined

# 기존 ResearchState (호환성 유지)
class ResearchState(TypedDict, total=False):
    """State tracked by the research workflow."""
    topic: str
    keywords: List[str]
    search_queries: Dict[str, str]
    search_results: Annotated[Dict[str, List[Dict[str, Any]]], _merge_search_results]
    summary: str
    references: List[Dict[str, str]]
    errors: Annotated[List[str], _append_items]

# 고도화된 ResearchState
class EnhancedResearchState(TypedDict, total=False):
    # 기존 필드 (호환성 유지)
    topic: str
    keywords: List[str]
    search_queries: Dict[str, str]
    search_results: Annotated[Dict[str, List[Dict[str, Any]]], _merge_search_results]
    summary: str
    references: List[Dict[str, str]]
    errors: Annotated[List[str], _append_items]
    
    # 새로운 키워드 인텔리전스 필드
    main_keyword: MainKeyword
    keyword_breakdown: List[Dict[str, Any]]
    selected_sub_keywords: List[SubKeywordEvaluation]
    keyword_strategy: Dict[str, Any]
    
    # 고도화된 검색 결과 필드
    filtered_results: Dict[str, List[Dict[str, Any]]]
    content_quality_scores: Dict[str, float]
    engagement_metrics: Dict[str, Any]
    trend_analysis: Dict[str, Any]
    
    # 분석 및 인사이트 필드
    sentiment_analysis: Dict[str, Any]
    competitive_analysis: Dict[str, Any]
    actionable_insights: List[str]
    content_recommendations: List[Dict[str, Any]]

def _normalize_topic(state) -> str:
    """주제 정규화 (기존 및 고도화 버전 모두 지원)"""
    topic = state.get("topic") or state.get("input")
    if not topic or not topic.strip():
        raise ValueError("A non-empty `topic` or `input` value is required to start the workflow.")
    return topic.strip()

def _split_keywords(topic: str) -> List[str]:
    """기존 키워드 분할 함수"""
    if "," in topic:
        keywords = [kw.strip() for kw in topic.split(",") if kw.strip()]
    else:
        keywords = [kw.strip() for kw in topic.split() if kw.strip()]
    return keywords or [topic]

def _run_tavily_query(
    query: str,
    *,
    max_results: int = 5,
    include_domains: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """Tavily 검색 실행"""
    client = _get_tavily_client()
    response = client.search(
        query=query,
        max_results=max_results,
        search_depth="advanced",
        include_answer=False,
        include_raw_content=False,
        include_domains=include_domains,
    )
    return response.get("results", [])

@lru_cache
def _get_tavily_client() -> TavilyClient:
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        raise RuntimeError("TAVILY_API_KEY environment variable is not set.")
    return TavilyClient(api_key=api_key)

@lru_cache
def _get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is not set.")
    return openai.OpenAI(api_key=api_key)

# 키워드 인텔리전스 클래스
class KeywordIntelligence:
    def __init__(self):
        self.openai_client = _get_openai_client()
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
    
    def extract_main_keyword(self, topic: str) -> MainKeyword:
        """메인 키워드 추출 및 분석"""
        try:
            # OpenAI를 사용한 키워드 추출 및 분석
            prompt = f"""
            주제: "{topic}"
            
            위 주제에서 가장 핵심적이고 검색량이 많을 것으로 예상되는 메인 키워드를 추출하고 분석해주세요.
            
            다음 형식으로 응답해주세요:
            {{
                "keyword": "추출된 메인 키워드",
                "search_volume": 예상 월간 검색량 (숫자),
                "competition_level": "LOW/MEDIUM/HIGH",
                "relevance_score": 주제 관련성 점수 (0-1),
                "trend_score": 트렌드 점수 (0-100),
                "analysis_reason": "선택 이유"
            }}
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return MainKeyword(
                keyword=result["keyword"],
                search_volume=result["search_volume"],
                competition_level=result["competition_level"],
                cpc_range={"min": 0.5, "max": 2.0},  # 기본값
                trend_score=result["trend_score"],
                relevance_score=result["relevance_score"],
                regional_data={"korea": {"popularity": 85}}
            )
            
        except Exception as e:
            # 폴백: 간단한 키워드 추출
            words = topic.split()
            main_word = max(words, key=len) if words else topic
            
            return MainKeyword(
                keyword=main_word,
                search_volume=1000,
                competition_level="MEDIUM",
                cpc_range={"min": 0.5, "max": 2.0},
                trend_score=70.0,
                relevance_score=0.8,
                regional_data={"korea": {"popularity": 75}}
            )
    
    def generate_keyword_breakdown(self, main_keyword: str, topic: str) -> List[Dict[str, Any]]:
        """키워드 브레이크다운 - 연관 키워드 10개 생성"""
        try:
            prompt = f"""
            메인 키워드: "{main_keyword}"
            원본 주제: "{topic}"
            
            위 메인 키워드를 기반으로 Google 검색에서 연관 검색어로 노출될 수 있거나 
            연관성이 있는 하위 키워드를 정확히 10개 생성해주세요.
            
            다음 조건을 만족해야 합니다:
            1. 메인 키워드와 의미적 연관성이 있어야 함
            2. 실제 사용자가 검색할 법한 자연스러운 키워드
            3. 롱테일 키워드 포함 (3-5단어 조합)
            4. 질문형 키워드 포함 ("어떻게", "왜", "무엇" 등)
            
            JSON 배열 형식으로 응답해주세요:
            [
                {{"keyword": "키워드1", "type": "related/longtail/question", "relevance": 0.9}},
                ...
            ]
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5
            )
            
            keywords = json.loads(response.choices[0].message.content)
            return keywords[:10]  # 정확히 10개만 반환
            
        except Exception as e:
            # 폴백: 기본 키워드 변형 생성
            base_variations = [
                f"{main_keyword} 방법",
                f"{main_keyword} 가이드", 
                f"{main_keyword} 팁",
                f"{main_keyword} 추천",
                f"{main_keyword} 비교",
                f"최고의 {main_keyword}",
                f"{main_keyword} 후기",
                f"{main_keyword} 장단점",
                f"{main_keyword} 선택법",
                f"{main_keyword} 트렌드"
            ]
            
            return [
                {"keyword": kw, "type": "related", "relevance": 0.7}
                for kw in base_variations
            ]
    
    def evaluate_sub_keywords(self, keywords: List[Dict[str, Any]], topic: str, main_keyword: str) -> List[SubKeywordEvaluation]:
        """서브 키워드 평가 및 최대 2개 선별"""
        evaluations = []
        
        for kw_data in keywords:
            keyword = kw_data["keyword"]
            
            # 각 평가 기준별 점수 계산
            topic_coherence = self._calculate_topic_coherence(keyword, topic)
            engagement_potential = self._predict_engagement_potential(keyword)
            trend_momentum = self._analyze_trend_momentum(keyword)
            competition_advantage = self._assess_competition_advantage(keyword)
            commercial_value = self._evaluate_commercial_value(keyword)
            
            # 가중치 적용한 최종 점수 계산
            final_score = (
                topic_coherence * 0.30 +
                engagement_potential * 0.25 +
                trend_momentum * 0.20 +
                competition_advantage * 0.15 +
                commercial_value * 0.10
            )
            
            evaluation = SubKeywordEvaluation(
                keyword=keyword,
                topic_coherence_score=topic_coherence,
                engagement_potential=engagement_potential,
                trend_momentum=trend_momentum,
                competition_advantage=competition_advantage,
                commercial_value=commercial_value,
                final_score=final_score,
                selection_reason=self._generate_selection_reason(keyword, final_score)
            )
            
            evaluations.append(evaluation)
        
        # 점수 기준으로 정렬하고 상위 2개 선택
        evaluations.sort(key=lambda x: x["final_score"], reverse=True)
        return evaluations[:2]
    
    def _calculate_topic_coherence(self, keyword: str, topic: str) -> float:
        """주제 일관성 점수 계산"""
        try:
            # 텍스트 유사도 계산
            texts = [keyword, topic]
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return min(similarity * 1.2, 1.0)  # 약간의 부스팅
        except:
            # 단순 단어 겹침 기반 계산
            keyword_words = set(keyword.lower().split())
            topic_words = set(topic.lower().split())
            overlap = len(keyword_words.intersection(topic_words))
            return min(overlap / max(len(keyword_words), len(topic_words)), 1.0)
    
    def _predict_engagement_potential(self, keyword: str) -> float:
        """engagement 잠재력 예측"""
        # 키워드 특성 기반 engagement 예측
        engagement_indicators = [
            "방법", "가이드", "팁", "추천", "후기", "비교", "순위", "best", "top"
        ]
        
        score = 0.5  # 기본 점수
        for indicator in engagement_indicators:
            if indicator in keyword.lower():
                score += 0.1
        
        # 질문형 키워드는 engagement가 높음
        if any(q in keyword for q in ["어떻게", "왜", "무엇", "언제", "어디서"]):
            score += 0.2
            
        return min(score, 1.0)
    
    def _analyze_trend_momentum(self, keyword: str) -> float:
        """트렌드 모멘텀 분석"""
        # 트렌드 키워드 패턴 분석
        trend_words = ["2024", "최신", "신규", "새로운", "트렌드", "인기", "핫"]
        
        score = 0.6  # 기본 점수
        for word in trend_words:
            if word in keyword:
                score += 0.1
                
        return min(score, 1.0)
    
    def _assess_competition_advantage(self, keyword: str) -> float:
        """경쟁 우위도 평가"""
        # 롱테일 키워드는 경쟁이 낮음
        word_count = len(keyword.split())
        if word_count >= 4:
            return 0.8
        elif word_count == 3:
            return 0.6
        else:
            return 0.4
    
    def _evaluate_commercial_value(self, keyword: str) -> float:
        """상업적 가치 평가"""
        commercial_indicators = [
            "구매", "가격", "비용", "할인", "추천", "순위", "비교", "리뷰", "후기"
        ]
        
        score = 0.3  # 기본 점수
        for indicator in commercial_indicators:
            if indicator in keyword:
                score += 0.15
                
        return min(score, 1.0)
    
    def _generate_selection_reason(self, keyword: str, score: float) -> str:
        """선택 사유 생성"""
        if score >= 0.8:
            return f"'{keyword}'는 높은 주제 관련성과 engagement 잠재력을 보여 최우선 선택되었습니다."
        elif score >= 0.6:
            return f"'{keyword}'는 균형잡힌 성과 지표로 전략적 가치가 높습니다."
        else:
            return f"'{keyword}'는 기본적인 요구사항을 충족하여 선택되었습니다."

# 콘텐츠 필터링 클래스
class ContentFilter:
    def __init__(self):
        self.profile_patterns = [
            r'/profile/', r'/user/', r'/u/', r'/@', r'/about', r'/bio'
        ]
        self.reply_patterns = [
            r'/status/\d+/reply', r'/thread/', r'/comment/', r'/replies'
        ]
        self.spam_keywords = [
            'follow me', 'check bio', 'link in bio', 'dm me', 'subscribe'
        ]
    
    def is_valid_content(self, content: Dict[str, Any]) -> bool:
        """콘텐츠 유효성 검사"""
        url = content.get('url', '')
        text = content.get('content', '') or content.get('snippet', '')
        
        # URL 패턴으로 프로필 페이지 제외
        if self._is_profile_page(url):
            return False
        
        # 하위 쓰레드/댓글 제외
        if self._is_reply_or_comment(url, content):
            return False
        
        # 텍스트 품질 검사
        if not self._meets_quality_threshold(text):
            return False
        
        # 스팸 콘텐츠 제외
        if self._is_spam_content(text):
            return False
        
        return True
    
    def _is_profile_page(self, url: str) -> bool:
        """프로필 페이지 여부 확인"""
        return any(pattern in url.lower() for pattern in self.profile_patterns)
    
    def _is_reply_or_comment(self, url: str, content: Dict[str, Any]) -> bool:
        """답글/댓글 여부 확인"""
        # URL 패턴 확인
        if any(pattern in url.lower() for pattern in self.reply_patterns):
            return True
        
        # 콘텐츠 구조 확인 (답글 특성)
        text = content.get('content', '') or content.get('snippet', '')
        if text.startswith('@') or text.startswith('Re:'):
            return True
        
        return False
    
    def _meets_quality_threshold(self, text: str) -> bool:
        """텍스트 품질 임계값 확인"""
        if not text or len(text.strip()) < 50:
            return False
        
        # 의미있는 단어 비율 확인
        words = text.split()
        if len(words) < 10:
            return False
        
        return True
    
    def _is_spam_content(self, text: str) -> bool:
        """스팸 콘텐츠 여부 확인"""
        text_lower = text.lower()
        spam_count = sum(1 for keyword in self.spam_keywords if keyword in text_lower)
        
        # 스팸 키워드가 2개 이상이면 스팸으로 판단
        return spam_count >= 2
    
    def calculate_content_quality(self, content: Dict[str, Any]) -> float:
        """콘텐츠 품질 점수 계산"""
        text = content.get('content', '') or content.get('snippet', '')
        
        quality_score = 0.0
        
        # 텍스트 길이 점수 (0.3 가중치)
        length_score = min(len(text) / 500, 1.0) * 0.3
        quality_score += length_score
        
        # 언어 품질 점수 (0.2 가중치)
        try:
            blob = TextBlob(text)
            # 문장 수와 단어 수의 비율로 가독성 측정
            sentences = len(blob.sentences)
            words = len(blob.words)
            readability = min(words / max(sentences, 1) / 20, 1.0) * 0.2
            quality_score += readability
        except:
            quality_score += 0.1  # 기본 점수
        
        # 정보 밀도 점수 (0.3 가중치)
        unique_words = len(set(text.lower().split()))
        total_words = len(text.split())
        density = (unique_words / max(total_words, 1)) * 0.3
        quality_score += density
        
        # engagement 지표 점수 (0.2 가중치)
        engagement_indicators = ['?', '!', '#', '@']
        engagement_count = sum(text.count(indicator) for indicator in engagement_indicators)
        engagement_score = min(engagement_count / 10, 1.0) * 0.2
        quality_score += engagement_score
        
        return min(quality_score, 1.0)

# 고급 검색 쿼리 생성기
class AdvancedSearchQuery:
    def generate_queries(self, main_keyword: str, sub_keywords: List[str]) -> Dict[str, List[str]]:
        """고도화된 검색 쿼리 생성"""
        primary_queries = [
            f'"{main_keyword}" -profile -bio -about -"follow me" -"check bio"',
            f'({main_keyword}) AND (viral OR trending OR popular) -reply -comment',
        ]
        
        secondary_queries = []
        for sub_keyword in sub_keywords:
            secondary_queries.append(f'({sub_keyword}) AND ({main_keyword}) -thread/ -status/')
        
        exclusion_patterns = [
            '-"follow me"', '-"check bio"', '-"link in bio"', '-"dm me"',
            '-reply', '-comment', '-thread/', '-status/', '-profile', '-bio'
        ]
        
        quality_filters = [
            'min_length:50', 'has_engagement:true'
        ]
        
        return {
            'primary_queries': primary_queries,
            'secondary_queries': secondary_queries,
            'exclusion_patterns': exclusion_patterns,
            'quality_filters': quality_filters
        }
    
    def optimize_for_platform(self, base_query: str, platform: str) -> str:
        """플랫폼별 쿼리 최적화"""
        if platform == 'threads':
            # Threads 최적화: 원본 게시글 우선
            return f"site:threads.net {base_query} -/reply -/comment"
        elif platform == 'x':
            # X 최적화: 리트윗 제외, 원본 트윗 우선
            return f"(site:x.com OR site:twitter.com) {base_query} -RT -retweet"
        else:
            return base_query

# 기존 기본 워크플로우 함수들 (호환성 유지)
def keyword_planner(state: ResearchState) -> ResearchState:
    """기존 키워드 플래너"""
    topic = _normalize_topic(state)
    keywords = _split_keywords(topic)

    combined_keywords = " ".join(keywords)
    return {
        "topic": topic,
        "keywords": keywords,
        "search_queries": {
            "threads": f"site:threads.net {combined_keywords} reference",
            "x": f"({combined_keywords}) (site:x.com OR site:twitter.com) reference",
        },
    }

def search_threads(state: ResearchState) -> ResearchState:
    """기존 Threads 검색"""
    queries = state.get("search_queries", {})
    query = queries.get("threads")
    results: List[Dict[str, Any]] = []
    errors: List[str] = []
    if query:
        try:
            results = _run_tavily_query(query, include_domains=["threads.com"])
        except Exception as exc:
            errors.append(f"Threads search failed: {exc}")
    else:
        errors.append("Threads search skipped: query missing.")

    updates: ResearchState = {"search_results": {"threads": results}}
    if errors:
        updates["errors"] = errors
    return updates

def search_x(state: ResearchState) -> ResearchState:
    """기존 X 검색"""
    queries = state.get("search_queries", {})
    query = queries.get("x")
    results: List[Dict[str, Any]] = []
    errors: List[str] = []
    if query:
        try:
            results = _run_tavily_query(query, include_domains=["x.com"])
        except Exception as exc:
            errors.append(f"X search failed: {exc}")
    else:
        errors.append("X search skipped: query missing.")

    updates: ResearchState = {"search_results": {"x": results}}
    if errors:
        updates["errors"] = errors
    return updates

def _summarize_platform(platform: str, items: List[Dict[str, Any]]) -> Optional[str]:
    """플랫폼별 요약 생성"""
    if not items:
        return None

    highlights: List[str] = []
    for item in items[:2]:  # grab top highlights
        snippet = item.get("content") or item.get("snippet") or ""
        snippet = " ".join(snippet.split())  # collapse whitespace
        if not snippet:
            snippet = "언급된 게시글에 대한 추가 설명 없음"
        if len(snippet) > 200:
            snippet = snippet[:197].rstrip() + "..."
        highlights.append(snippet)

    platform_label = "Threads" if platform == "threads" else "X"
    return f"{platform_label}: {' / '.join(highlights)}"

def summarize_results(state: ResearchState) -> ResearchState:
    """기존 결과 요약"""
    results = state.get("search_results", {})
    summary_lines: List[str] = []
    references: List[Dict[str, str]] = []

    for platform in ("threads", "x"):
        items = results.get(platform, [])
        summary_line = _summarize_platform(platform, items)
        if summary_line:
            summary_lines.append(summary_line)
        else:
            summary_lines.append(
                "Threads에서 발견된 자료가 없습니다." if platform == "threads" else "X에서 발견된 자료가 없습니다."
            )

        for item in items:
            reference = {
                "platform": "Threads" if platform == "threads" else "X",
                "title": item.get("title") or item.get("url", ""),
                "url": item.get("url", ""),
                "snippet": (item.get("content") or item.get("snippet") or "").strip(),
            }
            references.append(reference)

    if state.get("errors"):
        summary_lines.append("오류: " + " | ".join(state["errors"]))

    state["summary"] = "\n".join(summary_lines)
    state["references"] = references
    return state

# 고도화된 워크플로우 함수들
def extract_main_keyword(state: EnhancedResearchState) -> EnhancedResearchState:
    """메인 키워드 추출"""
    topic = _normalize_topic(state)
    
    try:
        keyword_intelligence = KeywordIntelligence()
        main_keyword = keyword_intelligence.extract_main_keyword(topic)
        
        return {
            "topic": topic,
            "main_keyword": main_keyword,
            "keyword_strategy": {
                "phase": "main_keyword_extracted",
                "confidence": main_keyword["relevance_score"]
            }
        }
    except Exception as e:
        return {
            "topic": topic,
            "errors": [f"Main keyword extraction failed: {str(e)}"]
        }

def generate_keyword_breakdown(state: EnhancedResearchState) -> EnhancedResearchState:
    """키워드 브레이크다운"""
    main_keyword_data = state.get("main_keyword")
    if not main_keyword_data:
        return {"errors": ["Main keyword not found"]}
    
    topic = state.get("topic", "")
    main_keyword = main_keyword_data["keyword"]
    
    try:
        keyword_intelligence = KeywordIntelligence()
        breakdown = keyword_intelligence.generate_keyword_breakdown(main_keyword, topic)
        
        return {
            "keyword_breakdown": breakdown,
            "keyword_strategy": {
                **state.get("keyword_strategy", {}),
                "phase": "breakdown_completed",
                "breakdown_count": len(breakdown)
            }
        }
    except Exception as e:
        return {"errors": [f"Keyword breakdown failed: {str(e)}"]}

def evaluate_sub_keywords(state: EnhancedResearchState) -> EnhancedResearchState:
    """서브 키워드 평가 및 선별"""
    breakdown = state.get("keyword_breakdown", [])
    if not breakdown:
        return {"errors": ["Keyword breakdown not found"]}
    
    topic = state.get("topic", "")
    main_keyword = state.get("main_keyword", {}).get("keyword", "")
    
    try:
        keyword_intelligence = KeywordIntelligence()
        selected_keywords = keyword_intelligence.evaluate_sub_keywords(breakdown, topic, main_keyword)
        
        return {
            "selected_sub_keywords": selected_keywords,
            "keyword_strategy": {
                **state.get("keyword_strategy", {}),
                "phase": "evaluation_completed",
                "selected_count": len(selected_keywords),
                "top_scores": [kw["final_score"] for kw in selected_keywords]
            }
        }
    except Exception as e:
        return {"errors": [f"Sub keyword evaluation failed: {str(e)}"]}

def generate_advanced_queries(state: EnhancedResearchState) -> EnhancedResearchState:
    """고급 검색 쿼리 생성"""
    main_keyword_data = state.get("main_keyword")
    selected_keywords = state.get("selected_sub_keywords", [])
    
    if not main_keyword_data:
        return {"errors": ["Main keyword not found for query generation"]}
    
    main_keyword = main_keyword_data["keyword"]
    sub_keywords = [kw["keyword"] for kw in selected_keywords]
    
    try:
        query_generator = AdvancedSearchQuery()
        query_structure = query_generator.generate_queries(main_keyword, sub_keywords)
        
        # 플랫폼별 최적화된 쿼리 생성
        search_queries = {}
        
        for platform in ['threads', 'x']:
            primary_query = query_structure['primary_queries'][0]
            optimized_query = query_generator.optimize_for_platform(primary_query, platform)
            search_queries[platform] = optimized_query
        
        return {
            "search_queries": search_queries,
            "keyword_strategy": {
                **state.get("keyword_strategy", {}),
                "phase": "queries_generated",
                "query_count": len(search_queries)
            }
        }
    except Exception as e:
        return {"errors": [f"Query generation failed: {str(e)}"]}

def search_threads_enhanced(state: EnhancedResearchState) -> EnhancedResearchState:
    """고도화된 Threads 검색"""
    queries = state.get("search_queries", {})
    query = queries.get("threads")
    results: List[Dict[str, Any]] = []
    errors: List[str] = []
    
    if query:
        try:
            client = _get_tavily_client()
            response = client.search(
                query=query,
                max_results=10,  # 더 많은 결과 수집
                search_depth="advanced",
                include_answer=False,
                include_raw_content=False,
                include_domains=["threads.net"]
            )
            raw_results = response.get("results", [])
            
            # 콘텐츠 필터링 적용
            content_filter = ContentFilter()
            filtered_results = []
            
            for result in raw_results:
                if content_filter.is_valid_content(result):
                    # 품질 점수 계산
                    quality_score = content_filter.calculate_content_quality(result)
                    result['quality_score'] = quality_score
                    result['platform'] = 'threads'
                    filtered_results.append(result)
            
            # 품질 점수 기준으로 정렬
            results = sorted(filtered_results, key=lambda x: x.get('quality_score', 0), reverse=True)[:5]
            
        except Exception as exc:
            errors.append(f"Enhanced Threads search failed: {exc}")
    else:
        errors.append("Threads search skipped: query missing.")

    updates: EnhancedResearchState = {"search_results": {"threads": results}}
    if errors:
        updates["errors"] = errors
    return updates

def search_x_enhanced(state: EnhancedResearchState) -> EnhancedResearchState:
    """고도화된 X 검색"""
    queries = state.get("search_queries", {})
    query = queries.get("x")
    results: List[Dict[str, Any]] = []
    errors: List[str] = []
    
    if query:
        try:
            client = _get_tavily_client()
            response = client.search(
                query=query,
                max_results=10,
                search_depth="advanced",
                include_answer=False,
                include_raw_content=False,
                include_domains=["x.com", "twitter.com"]
            )
            raw_results = response.get("results", [])
            
            # 콘텐츠 필터링 적용
            content_filter = ContentFilter()
            filtered_results = []
            
            for result in raw_results:
                if content_filter.is_valid_content(result):
                    quality_score = content_filter.calculate_content_quality(result)
                    result['quality_score'] = quality_score
                    result['platform'] = 'x'
                    filtered_results.append(result)
            
            results = sorted(filtered_results, key=lambda x: x.get('quality_score', 0), reverse=True)[:5]
            
        except Exception as exc:
            errors.append(f"Enhanced X search failed: {exc}")
    else:
        errors.append("X search skipped: query missing.")

    updates: EnhancedResearchState = {"search_results": {"x": results}}
    if errors:
        updates["errors"] = errors
    return updates

def analyze_engagement_potential(state: EnhancedResearchState) -> EnhancedResearchState:
    """engagement 잠재력 분석"""
    search_results = state.get("search_results", {})
    
    engagement_metrics = {
        "total_content_analyzed": 0,
        "average_quality_score": 0.0,
        "platform_performance": {},
        "content_type_distribution": {},
        "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0}
    }
    
    all_results = []
    for platform, results in search_results.items():
        all_results.extend(results)
        
        if results:
            avg_quality = sum(r.get('quality_score', 0) for r in results) / len(results)
            engagement_metrics["platform_performance"][platform] = {
                "content_count": len(results),
                "average_quality": avg_quality,
                "top_quality_score": max(r.get('quality_score', 0) for r in results)
            }
    
    engagement_metrics["total_content_analyzed"] = len(all_results)
    
    if all_results:
        engagement_metrics["average_quality_score"] = sum(
            r.get('quality_score', 0) for r in all_results
        ) / len(all_results)
        
        # 감정 분석
        for result in all_results:
            text = result.get('content', '') or result.get('snippet', '')
            try:
                blob = TextBlob(text)
                sentiment = blob.sentiment.polarity
                if sentiment > 0.1:
                    engagement_metrics["sentiment_distribution"]["positive"] += 1
                elif sentiment < -0.1:
                    engagement_metrics["sentiment_distribution"]["negative"] += 1
                else:
                    engagement_metrics["sentiment_distribution"]["neutral"] += 1
            except:
                engagement_metrics["sentiment_distribution"]["neutral"] += 1
    
    return {"engagement_metrics": engagement_metrics}

def generate_content_strategy(state: EnhancedResearchState) -> EnhancedResearchState:
    """콘텐츠 전략 및 인사이트 생성"""
    main_keyword = state.get("main_keyword", {})
    selected_keywords = state.get("selected_sub_keywords", [])
    engagement_metrics = state.get("engagement_metrics", {})
    search_results = state.get("search_results", {})
    
    # 액션 가능한 인사이트 생성
    actionable_insights = []
    content_recommendations = []
    
    # 키워드 전략 인사이트
    if main_keyword:
        keyword_name = main_keyword.get("keyword", "")
        trend_score = main_keyword.get("trend_score", 0)
        
        if trend_score > 80:
            actionable_insights.append(
                f"'{keyword_name}' 키워드는 높은 트렌드 점수({trend_score})를 보입니다. 즉시 콘텐츠 제작을 시작하세요."
            )
        elif trend_score > 60:
            actionable_insights.append(
                f"'{keyword_name}' 키워드는 안정적인 트렌드를 보입니다. 지속적인 콘텐츠 전략에 적합합니다."
            )
    
    # 서브 키워드 인사이트
    if selected_keywords:
        top_keyword = selected_keywords[0]
        actionable_insights.append(
            f"최우선 서브 키워드 '{top_keyword['keyword']}'는 {top_keyword['final_score']:.2f} 점수로 선별되었습니다. "
            f"{top_keyword['selection_reason']}"
        )
    
    # engagement 분석 인사이트
    if engagement_metrics:
        avg_quality = engagement_metrics.get("average_quality_score", 0)
        if avg_quality > 0.7:
            actionable_insights.append("시장의 콘텐츠 품질이 높습니다. 차별화된 고품질 콘텐츠가 필요합니다.")
        elif avg_quality < 0.5:
            actionable_insights.append("시장의 콘텐츠 품질이 낮습니다. 품질 개선으로 경쟁 우위를 확보할 수 있습니다.")
        
        # 플랫폼별 성과 분석
        platform_performance = engagement_metrics.get("platform_performance", {})
        if platform_performance:
            best_platform = max(platform_performance.items(), key=lambda x: x[1]["average_quality"])
            actionable_insights.append(
                f"{best_platform[0].title()} 플랫폼에서 가장 높은 품질의 콘텐츠가 발견되었습니다. "
                f"이 플랫폼을 우선적으로 활용하세요."
            )
    
    # 콘텐츠 추천 생성
    if selected_keywords:
        for keyword_data in selected_keywords:
            keyword = keyword_data["keyword"]
            engagement_score = keyword_data["engagement_potential"]
            
            if engagement_score > 0.7:
                content_type = "상호작용형 콘텐츠 (Q&A, 투표, 토론)"
            elif engagement_score > 0.5:
                content_type = "정보 제공형 콘텐츠 (가이드, 팁, 하우투)"
            else:
                content_type = "기본 정보형 콘텐츠 (소개, 설명)"
            
            content_recommendations.append({
                "keyword": keyword,
                "recommended_content_type": content_type,
                "expected_engagement": engagement_score,
                "priority": "high" if engagement_score > 0.7 else "medium"
            })
    
    # 경쟁 분석
    competitive_analysis = {
        "market_saturation": "medium",  # 기본값
        "content_gap_opportunities": [],
        "differentiation_strategies": []
    }
    
    # 콘텐츠 갭 분석
    all_content = []
    for platform_results in search_results.values():
        for result in platform_results:
            content = result.get('content', '') or result.get('snippet', '')
            all_content.append(content.lower())
    
    if all_content:
        # 자주 언급되지 않는 관련 주제 찾기
        common_words = set()
        for content in all_content:
            words = content.split()
            common_words.update(words)
        
        # 잠재적 콘텐츠 갭 식별
        gap_opportunities = [
            "실제 사용자 경험담",
            "단계별 실행 가이드", 
            "비교 분석 콘텐츠",
            "전문가 인터뷰",
            "데이터 기반 인사이트"
        ]
        
        competitive_analysis["content_gap_opportunities"] = gap_opportunities[:3]
        competitive_analysis["differentiation_strategies"] = [
            "독창적인 관점 제시",
            "실용적인 액션 아이템 포함",
            "시각적 요소 강화"
        ]
    
    return {
        "actionable_insights": actionable_insights,
        "content_recommendations": content_recommendations,
        "competitive_analysis": competitive_analysis,
        "keyword_strategy": {
            **state.get("keyword_strategy", {}),
            "phase": "strategy_completed",
            "insights_count": len(actionable_insights),
            "recommendations_count": len(content_recommendations)
        }
    }

def summarize_enhanced_results(state: EnhancedResearchState) -> EnhancedResearchState:
    """고도화된 결과 요약"""
    main_keyword = state.get("main_keyword", {})
    selected_keywords = state.get("selected_sub_keywords", [])
    search_results = state.get("search_results", {})
    actionable_insights = state.get("actionable_insights", [])
    engagement_metrics = state.get("engagement_metrics", {})
    
    summary_lines = []
    references = []
    
    # 키워드 전략 요약
    if main_keyword:
        keyword_name = main_keyword.get("keyword", "")
        search_volume = main_keyword.get("search_volume", 0)
        trend_score = main_keyword.get("trend_score", 0)
        
        summary_lines.append(f"🎯 메인 키워드: '{keyword_name}' (예상 검색량: {search_volume:,}, 트렌드 점수: {trend_score})")
    
    if selected_keywords:
        summary_lines.append("🔍 선별된 서브 키워드:")
        for i, kw in enumerate(selected_keywords, 1):
            summary_lines.append(f"  {i}. '{kw['keyword']}' (점수: {kw['final_score']:.2f})")
    
    # 플랫폼별 검색 결과 요약
    summary_lines.append("\n📊 플랫폼별 분석 결과:")
    
    for platform in ("threads", "x"):
        items = search_results.get(platform, [])
        platform_label = "Threads" if platform == "threads" else "X"
        
        if items:
            avg_quality = sum(item.get('quality_score', 0) for item in items) / len(items)
            summary_lines.append(f"  {platform_label}: {len(items)}개 고품질 콘텐츠 발견 (평균 품질: {avg_quality:.2f})")
            
            # 상위 2개 하이라이트
            for item in items[:2]:
                snippet = item.get("content") or item.get("snippet") or ""
                snippet = " ".join(snippet.split())
                if len(snippet) > 150:
                    snippet = snippet[:147] + "..."
                summary_lines.append(f"    • {snippet}")
        else:
            summary_lines.append(f"  {platform_label}: 관련 콘텐츠를 찾지 못했습니다.")
        
        # 참조 링크 수집
        for item in items:
            reference = {
                "platform": platform_label,
                "title": item.get("title") or item.get("url", ""),
                "url": item.get("url", ""),
                "snippet": (item.get("content") or item.get("snippet") or "").strip(),
                "quality_score": item.get("quality_score", 0)
            }
            references.append(reference)
    
    # engagement 메트릭 요약
    if engagement_metrics:
        total_analyzed = engagement_metrics.get("total_content_analyzed", 0)
        avg_quality = engagement_metrics.get("average_quality_score", 0)
        summary_lines.append(f"\n📈 분석 결과: 총 {total_analyzed}개 콘텐츠 분석, 평균 품질 점수 {avg_quality:.2f}")
        
        sentiment_dist = engagement_metrics.get("sentiment_distribution", {})
        if sentiment_dist:
            positive = sentiment_dist.get("positive", 0)
            neutral = sentiment_dist.get("neutral", 0)
            negative = sentiment_dist.get("negative", 0)
            summary_lines.append(f"  감정 분석: 긍정 {positive}개, 중립 {neutral}개, 부정 {negative}개")
    
    # 핵심 인사이트 요약
    if actionable_insights:
        summary_lines.append("\n💡 핵심 인사이트:")
        for insight in actionable_insights[:3]:  # 상위 3개만 표시
            summary_lines.append(f"  • {insight}")
    
    # 에러 메시지 추가
    if state.get("errors"):
        summary_lines.append("\n⚠️ 처리 중 발생한 이슈:")
        for error in state["errors"]:
            summary_lines.append(f"  • {error}")
    
    return {
        "summary": "\n".join(summary_lines),
        "references": references
    }

# 기존 기본 워크플로우 (호환성 유지)
basic_graph = StateGraph(ResearchState)

basic_graph.add_node("Keyword Planner", keyword_planner)
basic_graph.add_node("Threads Search", search_threads)
basic_graph.add_node("X Search", search_x)
basic_graph.add_node("Summarize", summarize_results)

basic_graph.set_entry_point("Keyword Planner")
basic_graph.add_edge("Keyword Planner", "Threads Search")
basic_graph.add_edge("Keyword Planner", "X Search")
basic_graph.add_edge("Threads Search", "Summarize")
basic_graph.add_edge("X Search", "Summarize")
basic_graph.add_edge("Summarize", END)

# 고도화된 워크플로우
enhanced_graph = StateGraph(EnhancedResearchState)

# 노드 추가
enhanced_graph.add_node("Main Keyword Extractor", extract_main_keyword)
enhanced_graph.add_node("Keyword Breakdown", generate_keyword_breakdown)
enhanced_graph.add_node("Sub Keyword Evaluator", evaluate_sub_keywords)
enhanced_graph.add_node("Advanced Query Generator", generate_advanced_queries)
enhanced_graph.add_node("Enhanced Threads Search", search_threads_enhanced)
enhanced_graph.add_node("Enhanced X Search", search_x_enhanced)
enhanced_graph.add_node("Engagement Analyzer", analyze_engagement_potential)
enhanced_graph.add_node("Strategy Generator", generate_content_strategy)
enhanced_graph.add_node("Enhanced Summarizer", summarize_enhanced_results)

# 워크플로우 연결
enhanced_graph.set_entry_point("Main Keyword Extractor")
enhanced_graph.add_edge("Main Keyword Extractor", "Keyword Breakdown")
enhanced_graph.add_edge("Keyword Breakdown", "Sub Keyword Evaluator")
enhanced_graph.add_edge("Sub Keyword Evaluator", "Advanced Query Generator")
enhanced_graph.add_edge("Advanced Query Generator", "Enhanced Threads Search")
enhanced_graph.add_edge("Advanced Query Generator", "Enhanced X Search")
enhanced_graph.add_edge("Enhanced Threads Search", "Engagement Analyzer")
enhanced_graph.add_edge("Enhanced X Search", "Engagement Analyzer")
enhanced_graph.add_edge("Engagement Analyzer", "Strategy Generator")
enhanced_graph.add_edge("Strategy Generator", "Enhanced Summarizer")
enhanced_graph.add_edge("Enhanced Summarizer", END)

# 앱 컴파일
app = basic_graph.compile()  # 기존 기본 앱 (기본값)
enhanced_app = enhanced_graph.compile()  # 고도화된 앱

# 편의를 위한 별칭
graph = basic_graph  # 기존 호환성
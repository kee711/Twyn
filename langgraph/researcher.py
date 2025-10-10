import os
from pathlib import Path
from functools import lru_cache
from typing import Annotated, Any, Dict, List, Optional, TypedDict

from dotenv import load_dotenv

from langgraph.graph import END, StateGraph

try:
    from tavily import TavilyClient
except ImportError as exc:  # pragma: no cover - import guard
    raise ImportError(
        "tavily package is required. Please add `tavily` to requirements.txt and install dependencies."
    ) from exc

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env", override=False)


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

class ResearchState(TypedDict, total=False):
    """State tracked by the research workflow."""

    topic: str
    keywords: List[str]
    search_queries: Dict[str, str]
    search_results: Annotated[Dict[str, List[Dict[str, Any]]], _merge_search_results]
    summary: str
    references: List[Dict[str, str]]
    errors: Annotated[List[str], _append_items]


def _normalize_topic(state: ResearchState) -> str:
    topic = state.get("topic") or state.get("input")
    if not topic or not topic.strip():
        raise ValueError("A non-empty `topic` or `input` value is required to start the workflow.")
    return topic.strip()


def _split_keywords(topic: str) -> List[str]:
    if "," in topic:
        keywords = [kw.strip() for kw in topic.split(",") if kw.strip()]
    else:
        keywords = [kw.strip() for kw in topic.split() if kw.strip()]
    return keywords or [topic]


@lru_cache
def _get_tavily_client() -> TavilyClient:
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        raise RuntimeError("TAVILY_API_KEY environment variable is not set.")
    return TavilyClient(api_key=api_key)


def _run_tavily_query(
    query: str,
    *,
    max_results: int = 5,
    include_domains: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
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


def keyword_planner(state: ResearchState) -> ResearchState:
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
    queries = state.get("search_queries", {})
    query = queries.get("threads")
    results: List[Dict[str, Any]] = []
    errors: List[str] = []
    if query:
        try:
            results = _run_tavily_query(query, include_domains=["threads.com"])
        except Exception as exc:  # pragma: no cover - runtime safeguard
            errors.append(f"Threads search failed: {exc}")
    else:
        errors.append("Threads search skipped: query missing.")

    updates: ResearchState = {"search_results": {"threads": results}}
    if errors:
        updates["errors"] = errors
    return updates


def search_x(state: ResearchState) -> ResearchState:
    queries = state.get("search_queries", {})
    query = queries.get("x")
    results: List[Dict[str, Any]] = []
    errors: List[str] = []
    if query:
        try:
            results = _run_tavily_query(query, include_domains=["x.com"])
        except Exception as exc:  # pragma: no cover - runtime safeguard
            errors.append(f"X search failed: {exc}")
    else:
        errors.append("X search skipped: query missing.")

    updates: ResearchState = {"search_results": {"x": results}}
    if errors:
        updates["errors"] = errors
    return updates


def _summarize_platform(platform: str, items: List[Dict[str, Any]]) -> Optional[str]:
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


graph = StateGraph(ResearchState)

graph.add_node("Keyword Planner", keyword_planner)
graph.add_node("Threads Search", search_threads)
graph.add_node("X Search", search_x)
graph.add_node("Summarize", summarize_results)

graph.set_entry_point("Keyword Planner")
graph.add_edge("Keyword Planner", "Threads Search")
graph.add_edge("Keyword Planner", "X Search")
graph.add_edge("Threads Search", "Summarize")
graph.add_edge("X Search", "Summarize")
graph.add_edge("Summarize", END)

app = graph.compile()

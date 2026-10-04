import httpx

OPENALEX_URL = "https://api.openalex.org/works"
ARXIV_URL = "http://export.arxiv.org/api/query"


def _reconstruct_abstract(inverted_index: dict | None) -> str:
    if not inverted_index:
        return ""
    positions = [(pos, word) for word, places in inverted_index.items() for pos in places]
    return " ".join(word for _, word in sorted(positions))


def _summarize_work(work: dict) -> dict:
    return {
        "title": work.get("display_name"),
        "year": work.get("publication_year"),
        "doi": work.get("doi"),
        "openalex_id": work.get("id"),
        "cited_by": work.get("cited_by_count"),
        "authors": [a["author"]["display_name"] for a in work.get("authorships", [])[:4]],
        "abstract": _reconstruct_abstract(work.get("abstract_inverted_index"))[:1200],
    }


def search_openalex(query: str, limit: int = 5, since_year: int | None = None) -> list[dict]:
    filters = ["type:article"]
    if since_year:
        filters.append(f"from_publication_date:{since_year}-01-01")
    params = {"search": query, "per-page": limit, "filter": ",".join(filters), "sort": "relevance_score:desc"}
    response = httpx.get(OPENALEX_URL, params=params, timeout=30)
    response.raise_for_status()
    return [_summarize_work(w) for w in response.json()["results"]]

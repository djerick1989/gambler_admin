import json
import os
import time
import urllib.error
import urllib.request

from create_reliable_news import (
    API_BASE,
    DEFAULT_MEDIA_URL,
    NEWS,
    SPANISH_LANGUAGE_ID,
    content_html,
)


def put_json(path, token, body, retries=3):
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(f"{API_BASE}{path}", data=data, headers=headers, method="PUT")
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                payload = json.loads(response.read().decode("utf-8"))
                if not payload.get("status", False):
                    raise RuntimeError(f"API status=false: {payload}")
                return payload
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, RuntimeError):
            if attempt == retries:
                raise
            time.sleep(1.5 * attempt)


def main():
    token = os.environ.get("GAMBLER_ADMIN_TOKEN")
    if not token:
        raise SystemExit("Set GAMBLER_ADMIN_TOKEN before running this script.")

    with open("created_reliable_news.json", encoding="utf-8") as source:
        created = json.load(source)

    ids_by_title = {item["title"]: item["newsId"] for item in created}

    updated = []
    for index, item in enumerate(NEWS, start=1):
        news_id = ids_by_title[item["title"]]
        body = {
            "newsId": news_id,
            "languageId": SPANISH_LANGUAGE_ID,
            "title": item["title"],
            "mediaUrl": DEFAULT_MEDIA_URL,
            "mediaType": 0,
            "contentHtml": content_html(
                item["summary"],
                item["why"],
                item["reality"],
                item["source_name"],
                item["source_url"],
            ),
        }
        put_json("/api/News/updateNews", token, body)
        print(f"[{index:02d}/{len(NEWS)}] News updated: {news_id} - {item['title']}")
        updated.append(news_id)

    print(json.dumps({"updated": len(updated)}, ensure_ascii=False))


if __name__ == "__main__":
    main()

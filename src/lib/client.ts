export function fetchApi(url: string, options?: RequestInit) {
  options = options || {};

  const headers = new Headers(options.headers || {});

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  options.headers = headers;
  options.credentials = "include";

  return fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`, options).then(
    async (res) => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "요청에 실패했습니다.");
      }
      return res.json();
    }
  );
}

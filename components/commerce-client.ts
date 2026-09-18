export async function request<T>(
  url: string,
  method = "GET",
  data?: unknown,
  token?: string,
): Promise<T> {
  const response = await fetch(url, {
    method,
    cache: "no-store",
    headers: {
      ...(data === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { "x-order-token": token } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "请求失败");
  return result;
}

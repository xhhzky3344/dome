"use client";
import { useState, type FormEvent } from "react";
import { request } from "./commerce-client";
export function DemoSubscribe() {
  const [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await request<{ message: string }>(
        "/api/subscriptions",
        "POST",
        { email },
      );
      setMessage(data.message);
      setEmail("");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="commerce-card commerce-fields" onSubmit={submit}>
      <h2>演示订阅 / Demo subscription</h2>
      <p>仅保存邮箱，不发送实际邮件。</p>
      <label>
        邮箱 / Email
        <input
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <button disabled={busy}>保存订阅</button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}

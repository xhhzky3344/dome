"use client";

import { FormEvent, useId, useRef, useState } from "react";
import { useLocale } from "./Locale";

export function InquiryForm({ models = "" }: { models?: string }) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const id = useId();
  const busy = useRef(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [reason, setReason] = useState<"network" | "server" | "invalid">("server");
  const [fields, setFields] = useState({ name: "", email: "", company: "", message: "" });
  const [consent, setConsent] = useState(false);
  const update = (field: keyof typeof fields, value: string) => {
    setFields(current => ({ ...current, [field]: value }));
    if (status === "success") setStatus("idle");
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setStatus("sending");
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);
    try {
      const message = models ? (zh ? "咨询型号：" : "Selected models: ") + models + "\n\n" + fields.message.trim() : fields.message.trim();
      const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fields, name: fields.name.trim(), email: fields.email.trim(), message, consent }), signal: controller.signal });
      if (!response.ok) { setReason(response.status === 400 ? "invalid" : "server"); setStatus("error"); return; }
      setStatus("success");
      setFields({ name: "", email: "", company: "", message: "" });
      setConsent(false);
    } catch {
      setReason("network");
      setStatus("error");
    } finally { window.clearTimeout(timer); busy.current = false; }
  }
  const error = reason === "network"
    ? (zh ? "网络连接中断或请求超时，暂时无法确认是否已提交。内容已保留，请检查网络后重试。" : "The connection was interrupted or timed out. Submission could not be confirmed. Your details are preserved; check your connection before retrying.")
    : reason === "invalid"
      ? (zh ? "请检查姓名、邮箱和需求内容后重试。" : "Please check your name, email and requirements before retrying.")
      : (zh ? "暂时无法发送，填写内容已保留，请稍后重试。" : "We couldn't send your inquiry. Your details are preserved; please try again.");
  return <form className="inquiry-form" onSubmit={submit} aria-busy={status === "sending"}>
    {models && <p className="selected-models">{zh ? "已选型号：" : "Selected models: "}<strong>{models}</strong></p>}
    <p className="demo-banner">{zh ? "演示用途：需求仅保存供后台演示，不承诺实际回复。请勿提交真实敏感信息。" : "Demo only: submissions are stored for demonstration. No actual response is promised."}</p><p className="form-hint">{zh ? "带 * 的项目为必填。" : "Fields marked * are required."}</p>
    <label className="field-label" htmlFor={id + "-name"}>{zh ? "您的姓名 *" : "Your name *"}
      <input id={id + "-name"} required maxLength={120} autoComplete="name" name="name" value={fields.name} onChange={e => update("name", e.target.value)} placeholder={zh ? "例如：王女士" : "e.g. Alex Smith"} disabled={status === "sending"} />
    </label>
    <label className="field-label" htmlFor={id + "-email"}>{zh ? "工作邮箱 *" : "Work email *"}
      <input id={id + "-email"} required type="email" maxLength={254} autoComplete="email" name="email" value={fields.email} onChange={e => update("email", e.target.value)} placeholder="name@company.com" disabled={status === "sending"} />
    </label>
    <label className="field-label" htmlFor={id + "-company"}>{zh ? "公司 / 项目（选填）" : "Company / project (optional)"}
      <input id={id + "-company"} maxLength={200} autoComplete="organization" name="company" value={fields.company} onChange={e => update("company", e.target.value)} placeholder={zh ? "公司名称或项目名称" : "Company or project name"} disabled={status === "sending"} />
    </label>
    <label className="field-label" htmlFor={id + "-message"}>{zh ? "采购需求 *" : "Project requirements *"}
      <textarea id={id + "-message"} required maxLength={10000} name="message" value={fields.message} onChange={e => update("message", e.target.value)} placeholder={zh ? "例如：LH-101，20 件，黄铜色，用于酒店项目。请提供尺寸和报价。" : "e.g. LH-101, 20 pieces, brass finish for a hotel. Please send dimensions and a quote."} disabled={status === "sending"} />
    </label>
    <label className="consent"><input required type="checkbox" name="consent" checked={consent} onChange={e => setConsent(e.target.checked)} disabled={status === "sending"} />{zh ? "我同意使用以上信息回复本次商业询盘。" : "I agree to the use of these details to respond to this business inquiry."}</label>
    <button className="gold" type="submit" disabled={status === "sending"}>{status === "sending" ? (zh ? "发送中…" : "Sending…") : status === "error" ? (zh ? "重新发送" : "Try again") : (zh ? "发送询盘" : "Send inquiry")}</button>
    {status === "error" && <p className="form-error" role="alert">{error}</p>}
    {status === "success" && <p className="form-success" role="status">{zh ? "演示询盘已保存，不承诺实际回复。" : "Your demo inquiry has been saved. No actual response is promised."}</p>}
  </form>;
}

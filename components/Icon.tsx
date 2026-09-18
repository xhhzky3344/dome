import type { SVGProps } from "react";

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: "search" | "menu" | "close" | "arrow" | "check" }) {
  const paths = { search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>, menu: <path d="M4 6h16M4 12h16M4 18h16" />, close: <path d="m6 6 12 12M6 18 18 6" />, arrow: <path d="M5 12h14m-6-6 6 6-6 6" />, check: <path d="m5 12 4 4 10-10" /> };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

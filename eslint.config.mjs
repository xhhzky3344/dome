import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  { ignores: [".next/**", "node_modules/**", "public/**"] },
  {
    rules: {
      // Client-side CMS hydration intentionally receives asynchronous API data in effects.
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
];

export default config;

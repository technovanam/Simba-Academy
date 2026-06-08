import type { Config } from "@react-router/dev/config";

export default {
  // Static client build → upload build/client to cPanel public_html
  ssr: false,
} satisfies Config;

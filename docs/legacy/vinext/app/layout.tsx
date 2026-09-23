import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "老板财富驾驶舱",
  description: "中小微企业老板看得懂、用得上的财富管理系统",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}

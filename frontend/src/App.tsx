import { type MouseEvent, useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import { apiUrl } from "./api";

type User = { displayName: string; email: string };
type AuthResponse = { user?: User | null; redirectTo?: string };

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/auth/me"))
      .then(async (response) => response.ok ? ((await response.json()) as AuthResponse).user ?? null : null)
      .then(setUser).finally(() => setLoading(false));
  }, []);

  async function runAuthAction(action: "login" | "logout") {
    const response = await fetch(apiUrl(`/auth/${action}`), { method: "POST" });
    const payload = (await response.json()) as AuthResponse;
    if (!response.ok) throw new Error("认证操作失败");
    if (payload.redirectTo) {
      window.location.assign(payload.redirectTo);
      return;
    }
    setUser(payload.user ?? null);
  }

  function signIn(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    void runAuthAction("login");
  }

  if (loading) return <main className="loading">正在打开你的财富驾驶舱…</main>;
  if (!user) return <main className="login"><section className="login-card"><div className="login-mark">财</div><p className="eyebrow">老板财富驾驶舱</p><h1>不懂财务，也能管好自己的财富</h1><p className="login-copy">用简单数字看清公司赚不赚钱、现金够不够、谁还欠你钱，以及本周最该做什么。</p><a className="primary big" href="/signin-with-chatgpt?return_to=/" onClick={signIn}>登录并开始使用</a><div className="trust"><span>✓ 每位老板数据独立</span><span>✓ 云端安全保存</span><span>✓ 手机随时查看</span></div></section></main>;
  return <Dashboard user={user} onSignOut={() => void runAuthAction("logout")} />;
}
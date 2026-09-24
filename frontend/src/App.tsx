import { type FormEvent, useCallback, useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import { apiUrl } from "./api";

type User = { id: string; displayName: string; email: string };
type AuthResponse = { authenticated?: boolean; user?: User | null; error?: string };
type AuthMode = "login" | "register";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<"welcome" | "auth">("welcome");
  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(apiUrl("/auth/me"), { credentials: "include" })
      .then(async (response) => response.ok ? ((await response.json()) as AuthResponse).user ?? null : null)
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setScreen("auth");
    setMode("login");
    setError("登录状态已失效，请重新登录");
  }, []);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setPassword("");
    setConfirmPassword("");
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (mode === "register") {
      const nameLength = Array.from(displayName.trim()).length;
      if (nameLength < 2 || nameLength > 30) return setError("昵称长度应为 2~30 个字符");
      if (password !== confirmPassword) return setError("两次输入的密码不一致");
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return setError("密码至少 8 位，并包含字母和数字");
    }

    setSubmitting(true);
    try {
      const response = await fetch(apiUrl(`/auth/${mode}`), {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mode === "register" ? { displayName: displayName.trim(), email, password } : { email, password }),
      });
      const payload = (await response.json()) as AuthResponse;
      if (!response.ok || !payload.user) throw new Error(payload.error || "认证失败，请稍后重试");
      setUser(payload.user);
      setPassword("");
      setConfirmPassword("");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "认证失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  async function logout() {
    const response = await fetch(apiUrl("/auth/logout"), { method: "POST", credentials: "include" });
    if (!response.ok) throw new Error("退出登录失败，请稍后重试");
    setUser(null);
    setScreen("welcome");
    setMode("login");
    setError("");
  }

  if (loading) return <main className="loading">正在打开你的财富驾驶舱…</main>;
  if (user) return <Dashboard user={user} onSignOut={() => void logout()} onUnauthorized={handleUnauthorized} />;

  if (screen === "welcome") {
    return <main className="login"><section className="login-card"><div className="login-mark">财</div><p className="eyebrow">老板财富驾驶舱</p><h1>不懂财务，也能管好自己的财富</h1><p className="login-copy">用简单数字看清公司赚不赚钱、现金够不够、谁还欠你钱，以及本周最该做什么。</p><button className="primary big" type="button" onClick={() => setScreen("auth")}>登录并开始使用</button><div className="trust"><span>✓ 每位老板数据独立</span><span>✓ 云端安全保存</span><span>✓ 手机随时查看</span></div></section></main>;
  }

  return <main className="login"><section className="login-card auth-card"><button className="auth-back" type="button" onClick={() => { setScreen("welcome"); setError(""); }}>← 返回</button><div className="login-mark">财</div><p className="eyebrow">老板财富驾驶舱</p><div className="auth-tabs" role="tablist"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>登录</button><button type="button" className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>注册</button></div><form className="auth-form" onSubmit={submitAuth}>{mode === "register" && <label><span>昵称</span><input value={displayName} onChange={event => setDisplayName(event.target.value)} minLength={2} maxLength={30} autoComplete="name" placeholder="你的称呼" required /></label>}<label><span>邮箱</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="name@example.com" required /></label><label><span>密码</span><div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} minLength={8} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="至少 8 位，包含字母和数字" required /><button type="button" onClick={() => setShowPassword(value => !value)}>{showPassword ? "隐藏" : "显示"}</button></div></label>{mode === "register" && <label><span>确认密码</span><input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} minLength={8} maxLength={128} autoComplete="new-password" placeholder="再次输入密码" required /></label>}{error && <p className="auth-error" role="alert">{error}</p>}<button className="primary" type="submit" disabled={submitting}>{submitting ? "请稍候…" : mode === "login" ? "登录" : "创建账号"}</button></form><p className="auth-switch">{mode === "login" ? "还没有账号？" : "已经有账号？"}<button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "立即注册" : "返回登录"}</button></p></section></main>;
}

import { getChatGPTUser, chatGPTSignInPath } from "./chatgpt-auth";
import Dashboard from "./dashboard";

export default async function Page() {
  const user = await getChatGPTUser();
  if (!user) return <main className="login"><section className="login-card"><div className="login-mark">财</div><p className="eyebrow">老板财富驾驶舱</p><h1>不懂财务，也能管好自己的财富</h1><p className="login-copy">用简单数字看清公司赚不赚钱、现金够不够、谁还欠你钱，以及本周最该做什么。</p><a className="primary big" href={chatGPTSignInPath("/")}>登录并开始使用</a><div className="trust"><span>✓ 每位老板数据独立</span><span>✓ 云端安全保存</span><span>✓ 手机随时查看</span></div></section></main>;
  return <Dashboard user={{ displayName: user.displayName, email: user.email }} />;
}

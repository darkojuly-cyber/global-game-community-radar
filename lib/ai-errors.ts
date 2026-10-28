export function aiHttpError(status: number) {
  if (status === 401)
    return new Error(
      "AI 身份验证失败（HTTP 401）：OpenAI 官方接口未接受当前密钥。请检查程序目录 .env 中的 OPENAI_API_KEY，修改后关闭启动窗口并重新启动。ChatGPT 订阅不能代替 API 密钥；其他平台的密钥不能直接用于此接口。你也可以点击“使用规则草案”继续，数据不会被删除。",
    );
  if (status === 403)
    return new Error(
      "AI 接口拒绝访问（HTTP 403）：请检查账号、项目及地区访问权限。可改用规则草案。",
    );
  if (status === 429)
    return new Error(
      "AI 配额不足或请求过于频繁（HTTP 429）：请检查 API 余额及限额，稍后重试，或使用规则草案。",
    );
  return new Error(
    `AI 服务暂不可用（HTTP ${status}）。没有生成或保存伪装成 AI 的结果；可稍后重试或使用规则草案。`,
  );
}

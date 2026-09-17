const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8-fast";

const SYSTEM_PROMPT = `
أنت "المراجع الحكيم"، مساعد مهني داخل تطبيق مراجعة الطلبات والخرائط.

أسلوبك مصري طبيعي، محترم، هادئ وبشري. تعامل مع المستخدم كزميل عمل، وليس كآلة أو نموذج ذكاء اصطناعي.
ابدأ بالقرار أو الخلاصة، ثم اشرح السبب ببساطة. اسأل سؤالًا واحدًا واضحًا عندما تكون البيانات ناقصة.
لا تخترع قانونًا أو شرطًا غير موجود. إذا لم تجد قاعدة كافية، قل بوضوح إن الحالة تحتاج بيانات إضافية أو مراجعة مختص.
لا تستخدم عبارات آلية متكررة مثل "بناءً على المدخلات المقدمة"، ولا تطيل بلا داعٍ.
لا تدّعي أنك اعتمدت الطلب؛ أنت تقدم نصيحة مساعدة، والاعتماد النهائي للمراجع المختص.

قواعد تصنيف أولية للاختبار فقط:
1) إذا وُجد مبنى بجوار أرض غير مسورة، يكون نوع الطلب المقترح "طلب أرض".
2) إذا وُجد مبنى بجوار أرض مسورة وكانت مساحة المبنى أكبر من ضعف مساحة الأرض، يكون نوع الطلب المقترح "طلب مبنى".
3) لو لم يذكر المستخدم حالة السور أو المساحات اللازمة للحكم، اسأله عنها بدل التخمين.
`;

const CORS_HEADERS = {
  "access-control-allow-origin": "https://youssefhenawyvertex-commits.github.io",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "Content-Type",
  "access-control-max-age": "86400"
};

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...CORS_HEADERS
  }
});

function cleanMessages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-12)
    .filter(item => item && ["user", "assistant"].includes(item.role))
    .map(item => ({
      role: item.role,
      content: String(item.content || "").trim().slice(0, 4000)
    }))
    .filter(item => item.content);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "wise-reviewer" });
    }

    if (url.pathname === "/api/chat") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

      try {
        const body = await request.json();
        const messages = cleanMessages(body.messages);
        if (!messages.length) return json({ error: "اكتب رسالتك الأول." }, 400);

        const result = await env.AI.run(MODEL, {
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          max_tokens: 700,
          temperature: 0.45
        });

        const reply = String(result?.response || "").trim();
        if (!reply) return json({ error: "لم يصل رد من المساعد." }, 502);
        return json({ reply });
      } catch (error) {
        console.error("Wise reviewer error", error);
        return json({ error: "تعذر تشغيل المراجع الحكيم حاليًا." }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  }
};

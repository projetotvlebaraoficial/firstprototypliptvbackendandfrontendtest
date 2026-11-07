<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Public business data (company, plan, categories, FAQ) lives in src/lib/site.ts; it is a stand-in until the database holds it, so pages read from there instead of hardcoding.
- Shared site chrome (header, footer, cookie consent) is mounted once in __root.tsx.
- Subscriber pages live under src/routes/_authenticated (client-only gate); subscription/payment rows are written only server-side (service role), users read their own via RLS.
- Program grid, lessons, live settings and comments live in the database (programs/lessons/site_settings/comments); public pages read them through public server fns in src/lib/content.functions.ts so SSR works without a session.
- Staff = roles admin or admin_chefe (public.is_staff). Only admin_chefe may grant/revoke admin; enforced in src/lib/admin.functions.ts (service role after role check).
- The admin panel (/admin/*) has its own layout; __root hides site header/footer there.

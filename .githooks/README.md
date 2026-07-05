# Git hooks

Tracked git hooks for this repo. Enable them once per clone:

```bash
git config core.hooksPath .githooks
```

## `post-commit`

After every commit, kicks off a Vercel **preview** deploy in the background
(the commit returns instantly). Output is appended to `.vercel/auto-deploy.log`.

- Skip one commit: `AETOS_NO_DEPLOY=1 git commit …`
- Disable entirely: `git config --unset core.hooksPath`
- Deploy to production instead: change `vercel deploy --yes` to
  `vercel deploy --prod --yes` in `post-commit`.

# Contributing to OpenPath

First off — thank you. OpenPath exists to make great learning content easier to make and more fun to consume, and every improvement helps someone's classroom, study group, or kitchen table.

## Ground rules

- **Be kind and assume good intent.** Teachers, students, and parents all use this project.
- **Keep it local-first.** No feature should *require* a cloud service. AI is optional; so is everything else.
- **Privacy is a feature.** If a change sends student data anywhere, it needs a very good reason and a prominent mention in the PR.
- **Never commit secrets.** `.env` is gitignored; use `.env.example` for new variables.

## Development setup

```bash
git clone https://github.com/Markgatcha/openpath.git
cd openpath
pnpm install
pnpm dev
```

## Quality gates

Every PR must pass all four:

```bash
pnpm typecheck   # TypeScript strict, server + client
pnpm lint        # ESLint flat config
pnpm build       # API + web production builds
pnpm test:api    # smoke test against a running server
```

## Commit style

Use short, imperative commit messages with a scope prefix:

```
feat(teacher): add question duplication inside the builder
fix(attempts): grade fill-in answers case-insensitively
docs(readme): document the local AI setup
chore(deps): bump vite to 8.x
```

## Pull requests

1. Fork and branch from `main` (`feat/…`, `fix/…`, `docs/…`)
2. Keep PRs focused — one logical change per PR
3. Describe the *why*, not just the *what*
4. Update README/ROADMAP when behavior changes
5. Add or extend the smoke test when you touch API behavior

## Code conventions

- **Shared types live in `shared/`** — schemas (zod), DTOs, and pure game math. If both sides need it, it belongs there.
- **Server validates everything** — routes parse with zod and return 400 with flattened errors.
- **Client never trusts itself** — XP, streaks, and scores are computed on the server; the client previews only.
- **Components** live in `client/src/components`; pages in `client/src/pages/<role>/`.
- **Tailwind tokens** — use the `@theme` tokens in `client/src/index.css` (brand, ink, gold) instead of ad-hoc colors.

## Reporting bugs

Open an issue with: what you did, what you expected, what happened, and your Node/pnpm versions. Screenshots of the quiz player are always welcome.

## License

By contributing you agree your work is licensed under the project's [MIT License](./LICENSE).

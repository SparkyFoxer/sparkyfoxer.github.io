# Sparky game-history Worker

This Worker polls Sparky's public Lanyard presence once per minute and stores
the active game plus the six most recent completed sessions in Workers KV.

The website reads:

`https://sparky-game-history.sparkyfoxer.workers.dev/game-history`

## First deployment

Run these commands on Fedora:

```bash
cd "$HOME/sparkyfoxer.github.io/Home Projects/ProfileV2/game-history-worker"
npm install
npx wrangler login
npx wrangler kv namespace create GAME_HISTORY
```

Copy the generated namespace ID into `wrangler.jsonc`, replacing:

`REPLACE_WITH_KV_NAMESPACE_ID`

Then validate and deploy:

```bash
npm test
npm run check
npm run deploy
```

Check the public endpoint:

```bash
curl -s \
  "https://sparky-game-history.sparkyfoxer.workers.dev/game-history" |
  python3 -m json.tool
```

The first completed session appears after the Worker sees a game running and
then sees that it has stopped. Games played before deployment cannot be
recovered from Lanyard automatically.

# Angelss Discord Bot System

Multi-bot Discord application with economy, moderation, and ticket support.

## Architecture

```
├── shared/               # Shared code across all bots
│   ├── database/         # MongoDB connection with pool options
│   ├── handlers/         # Command/event loaders + button registry
│   └── utils/            # Helpers (formatting, XP, cooldowns, logger)
├── src/                  # Tickets Bot (ticket/support system)
├── main/src/             # Main Bot (economy, leveling, shop, marriage)
├── moderator/src/        # Moderator Bot (moderation, staff, reports)
├── start-all-bots.js     # Master launcher with auto-restart
└── deploy-commands.js    # Command deployment script
```

## Setup

1. Install dependencies:
```bash
npm install
cd main && npm install && cd ..
cd moderator && npm install && cd ..
```

2. Configure `.env`:
```bash
cp .env.example .env
# Edit .env with your bot tokens and settings
```

3. Deploy commands:
```bash
npm run deploy          # All bots
npm run deploy:main     # Main bot only
npm run deploy:tickets  # Tickets bot only
npm run deploy:moderator # Moderator bot only
```

4. Start all bots:
```bash
npm start
# Or single bot:
npm run start:single
```

## Improvements Applied

### Critical Fixes
- **Auto-restart**: Bots automatically restart on crash with exponential backoff
- **Memory leak fix**: TTL-based `CooldownManager` replaces unbounded `Set`/`Map`
- **Race conditions**: Atomic balance updates in duel/give commands
- **Marriage protection**: Unique MongoDB indexes prevent double-marriage

### Performance
- **MongoDB pool options**: `maxPoolSize`, `serverSelectionTimeoutMS`, retry settings
- **XP formula**: O(1) closed-form instead of O(n) loop for `totalXpForLevel()`
- **Duel cleanup**: Periodic job expires stale pending duels
- **Command indexes**: Optimized MongoDB indexes for top/balance queries

### Security
- **Rate limiting**: Cooldowns on economy commands (duel, coinflip, give)
- **Input validation**: Discord snowflake validators on all ID fields
- **Balance checks**: `$gte` queries prevent negative balance race conditions
- **Max values**: Economy commands have max amount limits

### Developer Experience
- **Shared package**: DRY code via `shared/` module
- **ESLint**: Code quality rules configured
- **Deploy script**: Separate command deployment (not on every boot)
- **Logger**: Structured logging with timestamps

### Features
- **/help command**: Added to Main and Moderator bots
- **Atomic transfers**: Give command uses single-query balance check
- **Duel pot fix**: Winner receives both stakes (2x amount)

## Commands

### Main Bot
| Command | Description |
|---------|-------------|
| `/balance` | Check your balance |
| `/coinflip <amount>` | Coin flip game |
| `/duel <user> <amount>` | Challenge a user |
| `/give <user> <amount>` | Transfer coins |
| `/timely` | Claim daily coins |
| `/shop` | Browse shop |
| `/inventory` | View your items |
| `/marry <user>` | Propose marriage |
| `/profile` | View profile |
| `/top` | Leaderboards |
| `/help` | List all commands |

### Moderator Bot
| Command | Description |
|---------|-------------|
| `/action` | Moderation actions |
| `/clear <amount>` | Bulk delete messages |
| `/staff` | Staff management |
| `/report` | File a report |
| `/points` | Staff points |
| `/top` | Staff leaderboards |
| `/help` | List all commands |

### Tickets Bot
| Command | Description |
|---------|-------------|
| `/tickets setup` | Create ticket panel |
| `/помощь` | Help |

## Configuration

See `.env.example` for all available options.

## License

ISC

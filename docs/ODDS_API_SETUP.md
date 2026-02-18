# Odds API Setup Guide

## Getting Your API Key

1. Sign up for a free account at https://the-odds-api.com/
2. Navigate to your dashboard
3. Copy your API key
4. Add to `.env`:
   ```bash
   ODDS_API_KEY="your_actual_api_key_here"
   ```

## How It Works

The Scoregenix platform fetches odds from The Odds API for all active sports. Odds are:

- **Auto-fetched** during game syncs (every hour via cron)
- **Manually refreshable** via "Refresh Odds" button in bet modal
- **Bulk fetchable** via "Fetch All Odds" button in admin dashboard

## Supported Sports

- NFL, NBA, MLB, NHL, MLS (professional)
- NCAAF, NCAAB (college)

## Rate Limits

- Free tier: 500 requests/month
- Each sport fetch = 1 request
- Automatic 5-minute cooldown per sport prevents excessive requests

## Troubleshooting

### "Odds not available"
- Vegas typically posts odds 1-3 days before games
- Try clicking "Check for Odds Now" closer to game time

### "Failed to refresh odds"
- Check `ODDS_API_KEY` in `.env` is set correctly
- Verify API key at https://the-odds-api.com/account
- Check console logs for detailed error messages

### Team matching issues
- Odds API and ESPN may use different team names
- System uses fuzzy matching and normalization
- Check console for "No match found" warnings

## Monitoring

Check server console for emoji-decorated logs:
- ✅ = Success
- ❌ = Failure

Each log shows games updated and any errors.

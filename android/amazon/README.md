# ORVUNO Amazon Appstore build

This is the Amazon-specific Android wrapper for ORVUNO. It uses Amazon Appstore SDK 3.0.9 and Amazon IAP. Stripe/Braintree are blocked by the web store-payment policy when ORVUNO runs as a native store app.

## Already wired

- Package/Application ID: `de.nadena.orvuno`
- Amazon Appstore SDK: `3.0.9`
- Amazon `ResponseReceiver` in AndroidManifest.xml
- Amazon App Tester / Appstore package queries
- Native JavaScript bridge: `OrvunoAmazonIap`
- Purchase callbacks forwarded to ORVUNO web UI
- Server-side Amazon RVS verification through Supabase Edge Function `world-amazon-iap`
- Server-side idempotent fulfillment through PostgreSQL function `fulfill_amazon_purchase`
- `notifyFulfillment(FULFILLED)` is sent only after ORVUNO server verification/credit succeeds
- Amazon purchase recovery through `getPurchaseUpdates(false)`

## Required Amazon console values before release build

1. Download the app public key from Amazon Developer Console and save it locally as:
   `app/src/main/assets/AppstoreAuthenticationKey.pem`
   Do not commit this file to Git.
2. Configure Supabase secret `AMAZON_RVS_SHARED_SECRET` with the Amazon developer shared key.
3. For App Tester/RVS sandbox testing set `AMAZON_RVS_MODE=sandbox`; for publication use `AMAZON_RVS_MODE=production`.
4. Create these Amazon IAP SKUs as **Consumable** items (same IDs, case-sensitive):
   - `coins_100` — EUR 0.99
   - `coins_550` — EUR 4.99
   - `coins_1200` — EUR 9.99
   - `coins_2600` — EUR 19.99
   - `coins_6000` — EUR 39.99
   - `coins_13000` — EUR 79.99
   - `coins_26000` — EUR 149.99
   - `coins_50000` — EUR 249.99
   - `premium_4w` — EUR 3.99
   - `premium_3m` — EUR 9.99
   - `premium_6m` — EUR 17.99
   - `premium_12m` — EUR 29.99

Premium packages are deliberately consumables because ORVUNO currently sells fixed-duration, repeatable premium extensions rather than auto-renewing subscriptions.

## Build

Open `android/amazon` in Android Studio, add the Amazon public key asset, sync Gradle, then build a signed release APK. Increase `versionCode` for every Amazon resubmission.

The wrapper starts `https://orvuno-worldproject.vercel.app/?app=amazon`, which makes the web layer select Amazon IAP and remove external checkout providers from the app UI.

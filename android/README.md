# ORVUNO Android / Google Play

Feste Daten für die Android-Version:

- App-Name: ORVUNO
- Paketname / Application ID: `de.nadena.orvuno`
- Start-URL: `https://orvuno-worldproject.vercel.app/`
- Manifest: `https://orvuno-worldproject.vercel.app/manifest.webmanifest`
- Nächstes Update: `1.0.1`
- Nächster Version Code: `2`
- Release-Kanal: Google Play – geschlossener Test
- Wrapper: Trusted Web Activity (TWA) mit Bubblewrap

## Bubblewrap

ORVUNO ist bereits als Web-App/PWA aufgebaut. Für Google Play wird eine Trusted Web Activity mit Bubblewrap verwendet. Die Website bleibt die eigentliche Spielanwendung; die Android-App ist der verifizierte Wrapper.

Initialisierung:

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://orvuno-worldproject.vercel.app/manifest.webmanifest
```

Beim nächsten Google-Play-Update mindestens diese Werte verwenden:

- Application name: `ORVUNO`
- Package ID: `de.nadena.orvuno`
- Version name: `1.0.1`
- Version code: `2`
- Host: `orvuno-worldproject.vercel.app`
- Start URL: `/`

Danach:

```bash
bubblewrap build
```

Die für Google Play bestimmte Datei heißt anschließend üblicherweise `app-release-bundle.aab`.

## Upload-Key

Für das Update muss derselbe Upload-Key/Keystore verwendet werden wie beim ersten Google-Play-Build. Keystore und Passwörter niemals in GitHub committen.

## Digital Asset Links

Damit ORVUNO ohne Browserleiste als verifizierte Trusted Web Activity startet, muss folgende Datei ausgeliefert werden:

`https://orvuno-worldproject.vercel.app/.well-known/assetlinks.json`

Sie muss den Paketnamen `de.nadena.orvuno` und den SHA-256-Fingerprint des App-Signing-Zertifikats aus Google Play enthalten.

## Updates

Für jedes neue Android-Bundle muss `versionCode` erhöht werden (2, 3, 4, ...). Die Web-App selbst kann weiterhin unabhängig über den bestehenden Deploy aktualisiert werden.

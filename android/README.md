# ORVUNO Android / Google Play

Feste Daten für die Android-Version:

- App-Name: ORVUNO
- Paketname / Application ID: `de.nadena.orvuno`
- Start-URL: `https://orvuno-worldproject.vercel.app/`
- Manifest: `https://orvuno-worldproject.vercel.app/manifest.webmanifest`
- Version: `1.0.0`
- Version Code: `1`
- Release-Kanal zunächst: Google Play – geschlossener Test
- Wrapper: Trusted Web Activity (TWA) mit Bubblewrap

## Bubblewrap

ORVUNO ist bereits als Web-App/PWA aufgebaut. Für Google Play wird eine Trusted Web Activity mit Bubblewrap verwendet. Die Website bleibt die eigentliche Spielanwendung; die Android-App ist der verifizierte Wrapper.

Initialisierung:

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://orvuno-worldproject.vercel.app/manifest.webmanifest
```

Beim Assistenten mindestens diese Werte verwenden:

- Application name: `ORVUNO`
- Package ID: `de.nadena.orvuno`
- Version name: `1.0.0`
- Version code: `1`
- Host: `orvuno-worldproject.vercel.app`
- Start URL: `/`

Danach:

```bash
bubblewrap build
```

Die für Google Play bestimmte Datei heißt anschließend üblicherweise `app-release-bundle.aab`.

## Upload-Key

Beim ersten Build wird ein Keystore/Upload-Key erzeugt oder ausgewählt. Keystore und Passwörter niemals in GitHub committen. Für spätere Updates muss derselbe Upload-Key weiterverwendet werden.

## Digital Asset Links

Damit ORVUNO ohne Browserleiste als verifizierte Trusted Web Activity startet, muss nach Feststehen des Zertifikat-Fingerprints folgende Datei ausgeliefert werden:

`https://orvuno-worldproject.vercel.app/.well-known/assetlinks.json`

Sie muss den Paketnamen `de.nadena.orvuno` und den SHA-256-Fingerprint des App-Signing-Zertifikats aus Google Play enthalten.

Der endgültige Fingerprint wird nach dem ersten Upload in der Play Console unter App-Integrität / App-Signatur übernommen. Deshalb wird vor dem Upload kein erfundener Fingerprint eingetragen.

## Updates

Für jedes neue Android-Bundle muss `versionCode` erhöht werden (2, 3, 4, ...). Die Web-App selbst kann weiterhin unabhängig über den bestehenden Deploy aktualisiert werden.

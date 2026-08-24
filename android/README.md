# ORVUNO Android / Google Play / Amazon Appstore

Feste Daten für die Android-Version:

- App-Name: ORVUNO
- Paketname / Application ID: `de.nadena.orvuno`
- Web-Basis: `https://orvuno-worldproject.vercel.app/`
- Manifest: `https://orvuno-worldproject.vercel.app/manifest.webmanifest`
- Version: `1.0.0`
- Version Code: `1`
- Release-Kanal zunächst: Google Play – geschlossener Test
- Wrapper: Trusted Web Activity (TWA) mit Bubblewrap

## App-Erkennung und Registrierung

Die Store-App darf neue Accounts direkt freischalten, ohne dass der Spieler zuerst eine Registrierungs-/Bestätigungsmail anklicken muss. Die normale Website behält dagegen die E-Mail-Bestätigung.

Für eine eindeutige Store-Kennung sollten die Wrapper folgende Start-URLs verwenden:

- Google Play: `https://orvuno-worldproject.vercel.app/?orvuno_app=android&orvuno_store=google`
- Amazon Appstore: `https://orvuno-worldproject.vercel.app/?orvuno_app=android&orvuno_store=amazon`

Die Kennung wird beim ersten Start lokal gespeichert. Zusätzlich erkennt ORVUNO Android-Standalone/TWA-Starts als App, damit bereits gebaute Wrapper mit der bisherigen Start-URL `/` weiterhin funktionieren.

## Bubblewrap / Google Play

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
- Start URL: `/?orvuno_app=android&orvuno_store=google`

Danach:

```bash
bubblewrap build
```

Die für Google Play bestimmte Datei heißt anschließend üblicherweise `app-release-bundle.aab`.

## Amazon Appstore

Für die Amazon-Ausgabe wird derselbe Webstand verwendet. Der Android-Wrapper soll als Start-URL `/?orvuno_app=android&orvuno_store=amazon` verwenden. Store-spezifische Bezahlmodule werden getrennt von der Google-Play-Version behandelt; die Account-Registrierung verhält sich in beiden Android-Store-Versionen gleich.

## Upload-Key

Beim ersten Build wird ein Keystore/Upload-Key erzeugt oder ausgewählt. Keystore und Passwörter niemals in GitHub committen. Für spätere Updates muss derselbe Upload-Key weiterverwendet werden.

## Digital Asset Links

Damit ORVUNO ohne Browserleiste als verifizierte Trusted Web Activity startet, muss nach Feststehen des Zertifikat-Fingerprints folgende Datei ausgeliefert werden:

`https://orvuno-worldproject.vercel.app/.well-known/assetlinks.json`

Sie muss den Paketnamen `de.nadena.orvuno` und den SHA-256-Fingerprint des App-Signing-Zertifikats aus Google Play enthalten.

Der endgültige Fingerprint wird nach dem ersten Upload in der Play Console unter App-Integrität / App-Signatur übernommen. Deshalb wird vor dem Upload kein erfundener Fingerprint eingetragen.

## Updates

Für jedes neue Android-Bundle muss `versionCode` erhöht werden (2, 3, 4, ...). Die Web-App selbst kann weiterhin unabhängig über den bestehenden Deploy aktualisiert werden.

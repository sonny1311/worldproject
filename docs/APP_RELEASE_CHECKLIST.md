# ORVUNO – App- und Play-Store-Release-Checkliste

## Bereits im Webprojekt vorbereitet

- Mobile Viewport inklusive `viewport-fit=cover`.
- Safe-Area-Unterstützung für Android-Geräte mit Displayausschnitt/Systemleisten.
- Touch-taugliche Basisregeln und mobile Dialogbegrenzung.
- Installierbares Web-App-Manifest.
- Netzwerk-vor-Cache-Service-Worker; Spielstände, Supabase, API- und Zahlungsaufrufe werden nicht gecacht.
- `AppPlatformBridge` als definierte Schnittstelle für Android-Back-Button und späteren nativen Rewarded-Ad-Provider.
- Zahlungsanbieter sind vom normalen Betriebswechsel getrennt.
- Stripe-Testintegration und serverseitige Zahlungsprüfung sind vorbereitet; keine Production-Secrets im Client oder Repository.

## Vor dem Android-Build

1. ORVUNO auf der endgültigen HTTPS-Domain bereitstellen und alle Supabase-/CORS-/Redirect-URLs auf diese Domain prüfen.
2. Gesamtes Spiel auf Smartphone und Tablet testen: Navigation, Dialoge, Tastatur, Scrollen, Quer-/Hochformat und Android-Zurück.
3. Endgültige App-ID/Package-ID festlegen und danach nicht mehr leichtfertig ändern.
4. App-Icon, Adaptive Icon und Store-Grafiken in den von Google Play verlangten Größen erstellen.
5. Native Android-Hülle festlegen. Für ORVUNO ist wegen AdMob und nativen Plattformfunktionen ein Capacitor-/Android-Wrapper sinnvoller als eine reine Browser-Verknüpfung.
6. Aktuell von Google Play verlangtes Target SDK unmittelbar vor dem Release prüfen und einstellen.

## AdMob

- Erst im Android-Wrapper integrieren.
- Während Entwicklung ausschließlich Google-AdMob-Testanzeigen/Testgeräte verwenden.
- Rewarded Ads über `window.orvunoAppBridge.registerRewardedAdProvider(...)` an die vorhandene Spiellogik anbinden.
- Eine Belohnung darf erst nach bestätigtem Reward-Callback vergeben werden.
- Abbruch, fehlende Anzeige und SDK-Fehler dürfen keine Belohnung auslösen.
- Vor Produktion Consent/Datenschutz und erforderliche Google-Play-Datensicherheitsangaben prüfen.

## Stripe / Echtgeld

- Bis zur finalen Abnahme nur Testmodus.
- Secret Key und Webhook Secret ausschließlich serverseitig/Supabase Secrets speichern.
- Preise und Leistungen serverseitig aus dem Produktkatalog bestimmen.
- Webhook-Signatur und Idempotenz beibehalten.
- Erfolg, Abbruch, Fehler, Reload, wiederholten Webhook und Doppel-Klick testen.
- Vor Live-Schaltung prüfen, welche Zahlungsarten nach den dann geltenden Google-Play-Richtlinien innerhalb der Android-App zulässig sind. Web-Shop und Android-In-App-Kauf nicht ungeprüft gleich behandeln.

## Pflicht-Regressionsrunde vor Upload

- Registrierung/Login/Logout und F5/Neustart.
- Betrieb 1 ↔ vorhandener Betrieb 2 wechseln: niemals Zahlungsdialog.
- Neuen kostenpflichtigen Betrieb bewusst kaufen: Checkout nur nach expliziter Kaufaktion.
- Firmenkonto und Coins nach Neustart korrekt.
- Einkauf → Lieferung → Lager → Produktion → Fertigware → Kundenauftrag → Zahlung.
- Grundstück, Gebäude, Maschinen, Bautrupps und Ausbau.
- Premium und Coins inklusive Fehlzahlung/Abbruch.
- Rewarded Ads ohne Mehrfachbelohnung.
- Offline/Online-Wechsel ohne Spielstandverlust.
- Android-Zurück schließt zuerst den obersten Dialog statt die App überraschend zu beenden.

## Google Play

- Store-Eintrag, Datenschutzerklärung, Datensicherheit, Inhaltsfreigabe und Werbeangaben fertigstellen.
- Internen Test zuerst verwenden.
- Falls das verwendete private Entwicklerkonto unter die Google-Testpflicht fällt: geschlossenen Test mit mindestens 12 dauerhaft angemeldeten Testern über 14 aufeinanderfolgende Tage durchführen und anschließend Produktionszugriff beantragen.
- Testerfeedback und gefundene Fehler dokumentieren und vor dem Produktionsantrag sichtbar bearbeiten.
- Release erst nach kompletter Zahlungs-, Persistenz-, Sicherheits- und Mobil-Regressionsrunde freigeben.

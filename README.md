# Conway Presentation · V0.2 (Vortrag am 09.12.2026)

Unabhängige Node.js-Anwendung für einen synchronisierten Live-Vortrag über Emergenz und Conway's Game of Life. **Ohne Datenbank und ohne externe Node-Pakete.** V0.1 ist weiterhin im Git-Verlauf sowie als eigenständige Offline-Datei erhalten. V0.2 ersetzt die bisherige Online-Version nach Freigabe durch den Moderator.

## Lokal starten

Node.js 20 oder neuer:

```bash
npm test
npm start
```

- Moderator: `http://localhost:8080/`
- Fester Zuschauerlink: `http://localhost:8080/live`
- Render-Live-Link (nach dem Deployment): `https://conwaypresentation.onrender.com/live`

Der eingebundene QR-Code zeigt bewusst auf die **Produktiv-URL auf Render** und nicht auf `localhost`. Bei Änderung des Hostnamens muss `public/qr-live.svg` mit der neuen URL neu generiert werden (z. B. mit Python `qrcode`).

## Ablauf

1. Der Moderator öffnet `/` und klickt **Präsentation als Moderator starten**. Der Moderator-Schlüssel wird nur im Browser gespeichert; die Teilnehmer erhalten ihn nicht.
2. Zuschauer öffnen `/live`, entweder über Link oder QR-Code. Das geht auch **vor** dem eigentlichen Vortrag. Sie warten dort automatisch auf die Simulation. Der Link bleibt bei erneuter Sitzung unverändert.
3. Die Geräte können unabhängig Hell-/Dunkelmodus, Zoom und Vollbild verwenden. Die Zuschauer sehen Generation, lebende Zellen und Rastergröße auch auf Tablets und schmalen Smartphone-Displays; die Regelparameter bleiben vollständig ausgeblendet.
4. Der Moderator schaltet zwischen fünf vorbereiteten Leveln. **Jeder Levelwechsel setzt die Welt auf ihren definierten Startzustand und Generation 0 zurück.**
5. Zum Platzieren: Simulation pausieren, Muster wählen, auf das Raster tippen. „Einzelzelle“ schaltet Zellen einzeln an/aus. Rechtsklick entfernt ein platziertes Muster. Kurzbefehle: Leertaste Start/Pause, `N` Einzelschritt, `1`–`5` Levelwechsel.
6. Regienotizen und konkrete Regeln sind nur in der Moderatoroberfläche sichtbar. Beim Finale wird der veränderte Geburtswert über den kompakten Zuschauerstream nicht übertragen.

## Level

| Nr. | Name | Größe | Vorbereitung | Regel | Gen./s | Zellalter |
|----:|------|-------|---------------|-------|-------:|-----------|
| 1 | Conway Rules | 7×7 | Leer, Musterbibliothek für Block/Bienenstock/Blinker/Beacon | B3/S23 | 2 | Nein |
| 2 | Gleiter & Knall | 50×50 | Gleiter oben links, `Knall` aus der Original-AyG-Patternbibliothek | B3/S23 | 4 | Nein |
| 3 | Gleiterkanone | 100×100 | Gosper-Gleiterkanone links oben, schießt nach rechts unten | B3/S23 | 10 | Nein |
| 4 | Zufallswelt | 100×100 | Reproduzierbarer Zufallsseed; neue Welt per Würfel-Button | B3/S23 | 8 | Ja |
| 5 | Das letzte Experiment | 100×100 | Eine einzelne Zelle in der Mitte | **B1/S23** | **5 (3–7)** | Ja |

Die Altersfarbe verläuft von Weiß über Gold bis Rot auf dunklem Hintergrund. Auf hellem Hintergrund ist die Startfarbe für die Ablesbarkeit dunkel. Das Alter (0–255) zählt aufeinanderfolgende lebendige Generationen; die Farben ändern nicht die Überlebensregeln.

## Verbindung und Ausfallsicherheit

- **Feste Zuschaueradresse:** `/live`, unabhängig von zufälligen Sitzungscodes. Die Zuschauer-SSE-Verbindung meldet automatisch den aktuellen Zustand, auch wenn Zuschauer bereits vor dem Moderator verbunden sind.
- **Live-Verbindungsprüfung:** Der Server sendet im Abstand von 15 Sekunden ein SSE-Heartbeat. Wenn WLAN/Hotspot kurz ausfällt, verbindet sich `EventSource` automatisch erneut. Bei einem Neustart des Servers bleiben die Zuschauerseiten unter `/live` und warten auf die nächste Präsentation; ein geöffnetes Moderatorgerät versucht, eine verlorene Sitzung neu aufzubauen.
- **Wichtig für Render Free:** Der kostenlose Dienst *kann* bei Inaktivität einschlafen oder unabhängig neu gestartet werden; SSE und Heartbeats erhöhen die Chance, dass bei offenen Geräten eine Verbindung bestehen bleibt, sind aber keine absolute Garantie. Ein Neustart setzt die RAM-Simulation zurück; die Zuschaueradresse bleibt stabil. Vor Ort unbedingt mit allen Geräten testen.
- **Einzelgerät-Fallback:** `Conway-Offline-V0.2.html` kann lokal im Browser ohne Server geöffnet werden. Es enthält die fünf Level und das Alterungsmodell, synchronisiert aber keine Tablets. `Conway-Offline-V0.1.html` bleibt zusätzlich erhalten.
- Der Server erlaubt 24 direkte Sitzungsstreams plus bis zu 32 feste Zuschauerstreams. Die Live-SSE-Verbindung überträgt pro Zelle nur ein Byte für Zustand/Alter als Base64, um bei 100×100 und höheren Geschwindigkeiten das Datenvolumen zu reduzieren. Es können trotzdem Bandbreite und CPU zum Engpass werden.
- Optional für zusätzlich geschützten Präsentationsstart: `PRESENTATION_ADMIN_KEY` als Umgebungsvariable auf Render setzen. Beim Start wird der Schlüssel vom Moderator abgefragt. Ohne diese Variable kann vor dem ersten Start nach einem Server-Neustart jede Person mit Zugang zur Startseite Moderator werden. Ein laufender Live-Raum ist gegen eine zweite unberechtigte Übernahme geschützt.

## Vorbereitungen für den Vortragstag

1. V0.2 auf einem separaten Branch und lokal prüfen, anschließend den freigegebenen Stand nach `main` übernehmen.
2. Für die Live-Adresse eine HTTPS-Render-Instanz starten und QR-Code mit dem Xiaomi 13T scannen.
3. Zuschaueransicht **vorher** auf zwei Tablets öffnen; beide sollten in den Wartezustand gelangen und nach Moderatorstart automatisch Generation 0 anzeigen.
4. Moderator startet Level 5, setzt eine Generation fort (1 → 8 Zellen), variiert Geschwindigkeit, schaltet eine Sitzung neu; Zuschauer bleiben unter `/live`.
5. Den Hell-/Dunkelmodus auf beiden Tablets unabhängig testen.
6. WLAN/Hotspot- und Energiespareinstellungen der Geräte prüfen. Offline-V0.2 als Notfallvariante speichern.

## Deployment auf Render

Wie bei V0.1: Node-Webservice, Build `npm install --ignore-scripts`, Start `npm start`, Health Check `/health`. Für Test-Deployments nicht versehentlich den bestehenden produktiven Service auf V0.2 umstellen, solange die neue Version nicht vor Ort getestet ist.

## Tests

```bash
npm test
```

Tests decken die alten V0.1-Funktionen, fünf Level, das Original-Knall-Muster, Gleiterkanone, Zellalter, B1/S23 und acht Live-Zuschauer mit Sitzungstausch ab. Ein visueller Endgerätetest bleibt notwendig.

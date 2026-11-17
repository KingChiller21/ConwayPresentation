# Conway Presentation · V0.1

Unabhängige Vortragsanwendung (09.12.2026). Node.js >=20, kein externes Paket, keine Datenbank.

## Start am PC (Entwicklung)

```bash
npm test
npm start
```

Browser: http://localhost:8080. Die Anwendung ist nicht automatisch aus dem Internet erreichbar. Für die Online-Version muss sie gehostet werden.

## Online-Hosting (Render)

1. Eigenes GitHub-Repository anlegen und die Dateien aus diesem ZIP hochladen. Das Unity-Repository und die bisher veröffentlichte Website unverändert lassen.
2. Auf Render eine Web Service-Instanz mit diesem Repository verbinden (oder das enthaltene `render.yaml` als Blueprint nutzen).
3. Node-Runtime, Build `npm install --ignore-scripts`, Start `npm start`, Health Check `/health`. Eine Instanz genügt; PORT wird vom Hoster gesetzt.
4. Die vom Anbieter zugewiesene HTTPS-Adresse öffnen. Keine Anmeldung der Zuschauer nötig; keine Installation auf den Tablets.

Tarif, Verfügbarkeit und etwaige Kosten beim Hostinganbieter prüfen. Kostenloses Hosting kann nach Inaktivität in einen Ruhezustand wechseln. Vor dem Vortrag rechtzeitig öffnen und die vollständige Strecke testen. Neustart des Webservers löscht laufende Sitzungen (RAM); Moderator muss eine neue Sitzung eröffnen. Kein horizontales Scaling in V0.1.

## Nutzung

- Moderator: Präsentation starten. Teilnehmerlink kopieren bzw. Sitzungscode teilen.
- Zuschauer: Link öffnen oder auf Startseite Code eingeben. Zuschauer besitzen keinen Steuerungsschlüssel.
- Start/Pause, Einzelschritt, Reset, Leeren, Tempo 1–15 Gen/s und fünf vorbereitete Demonstrationen. Antippen im Pausemodus schaltet Zellen um. Reset für Zufall erstellt eine neue Zufallsbelegung.
- Feste, tote Ränder, B3/S23, parallele Aktualisierung. Block, Blinker, Gleiter und zufälliges Feld.
- Hell/Dunkel, zentraler Zoom und ggf. Vollbild sind lokal. Zuschauer erhalten vollständige Zellzustände per SSE, beim Wiederverbinden den aktuellen Zustand. Der Browser hält den Moderatorschlüssel lokal; die Einladungs-URL enthält nur den Sitzungscode.
- Offline-Datei `Conway-Offline-V0.1.html` ist separat nutzbar; keine Internetverbindung oder Synchronisierung. Am besten vorab auf dem Tablet öffnen/testen.

## Grenzen der ersten Version

Sitzungscodes sind zufällig, nicht als private Authentifizierung gedacht: Wer den Zuschauerlink besitzt, kann zuschauen. Nur der Moderatorenschlüssel erlaubt Änderungen. V0.1 begrenzt auf 32 Sitzungen mit je 24 zeitgleich verbundenen Browsern. Keine dauerhafte Speicherung, keine QR-Generierung, kein freies Verschieben der Zoom-Ansicht. Anzeige, Netzwerk und Hotspot in der tatsächlichen Vortragsumgebung sind noch zu testen. Die Demo mit Zufallsbelegung ist nicht deterministisch reproduzierbar. Für den Vortrag einen passenden Seed festlegen.

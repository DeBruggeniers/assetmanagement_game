# De Assetmanagement Game - Noordzeeland Draait Door

**Versie 0.34** | Serious game over organisatieontwikkeling en assetmanagement in de fictieve provincie Noordzeeland.

## Open de game

[Start De Assetmanagement Game - Noordzeeland Draait Door](https://debruggeniers.github.io/assetmanagement_game/)

> De bovenstaande link werkt zodra GitHub Pages voor deze repository is ingeschakeld.

## Spelopzet

- 10 jaren met elk 1 volledige PDCA-cyclus.
- 7 ontwikkelpaden; jaarlijks maximaal 3 ontwikkelprojecten.
- 3 teams met maatschappelijke prestaties, financiële reserve en score.
- Interactief speelbord met Bram, gebeurtenissen en de effecten van Do en Act.

## Publicatie via GitHub Pages

Ga in deze repository naar **Settings → Pages**, kies bij **Build and deployment** als bron **Deploy from a branch**, selecteer **main** en **/(root)** en sla de instellingen op.

De broncode voor deze zelfstandige browserversie staat in [index.html](index.html). Bij een wijziging van dit bestand wordt de site opnieuw gepubliceerd.

## Let op: zelfstandige game

Dit is de **lokale browserversie** die op één apparaat werkt, inclusief wisselen tussen de spelleider en drie teams. De spelstand staat in de browser van dat apparaat.

Voor gelijktijdige deelname op meerdere apparaten is een afzonderlijke Node.js-server nodig met een gedeelde spelstand en toegangscontrole. GitHub Pages kan die server niet draaien.

Deze openbare versie bevat scenario-informatie in de broncode. Gebruik hem niet als beveiligde competitieomgeving waar spelers geen toegang mogen hebben tot verborgen scenario-inhoud.

## Nieuwe versies

Bewaar voor nieuwe releases een back-up, vervang vervolgens `index.html` en werk het versienummer in dit bestand bij.


## Cloudflare multiplayer (voorbereid, nog niet live)

De nieuwe [multiplayerinterface](multiplayer/index.html) is toegevoegd en geeft na inrichting van Cloudflare toegang aan de spelleider en drie teams. De frontend bevat **geen verborgen scenario-informatie**. De spelengine en docentinhoud komen in een afgeschermde Cloudflare Worker met een eigen D1-database.

**De Cloudflare Worker en D1-database moeten nog in Cloudflare worden aangemaakt.** Daarna hoeft alleen de Worker-URL in [`multiplayer/config.js`](multiplayer/config.js) te worden ingevuld. De backendcode is bewust niet in deze openbare repository opgenomen. De huidige hoofdversie (`index.html`) blijft voorlopig de zelfstandig speelbare 0.34 en is niet geschikt als afgeschermde multiplayeromgeving, omdat daarin scenario-inhoud in de browser is opgenomen.

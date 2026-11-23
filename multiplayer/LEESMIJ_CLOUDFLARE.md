# De Assetmanagement Game - Noordzeeland Draait Door - Cloudflare multiplayer

Dit is de publieke interface voor de multiplayer-versie. De game gebruikt GitHub Pages voor de website en Cloudflare Workers + D1 voor de gezamenlijke spelstand.

De multiplayerwebsite gebruikt de Worker-URL uit `config.js`.

De spelleider start een sessie met een beheercode die uitsluitend als Cloudflare Secret is opgeslagen. De vier teams gebruiken vaste toegangscodes: `MT1` voor De Bruggenbouwers, `MT2` voor De Wegwijzers, `MT3` voor De Betonbazen en `MT4` voor De Waterwachten. De spelengine en verborgen scenario-informatie worden alleen in de afgeschermde Cloudflare Worker gebruikt, niet in deze openbare map.

De bronbestanden voor Cloudflare worden apart als backendpakket geleverd en mogen niet in deze publieke repository worden geplaatst.

Na deployment vul je in `config.js` alleen `window.TYCOON_API_BASE = 'https://...workers.dev';` in. De Worker staat CORS-verzoeken toe vanaf `https://debruggeniers.github.io`.

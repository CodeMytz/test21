# ⚔️ Sasniedz 21 — Blockchain duelis (1. grupa)
## Site : https://test21-5137.onrender.com/
Divu spēlētāju spēle uz **Ethereum Sepolia** testtīkla. Spēlētāji pārmaiņus pieskaita kopējai summai **1, 2 vai 3**.
Uzvar tas, kurš summu **precīzi** sasniedz līdz mērķim (15–31, parasti 21). Gājiens, kas summu pārsniegtu virs mērķa, tiek noraidīts.

> Tikai publiskais Sepolia testtīkls un testa ETH. Nekādu īstu līdzekļu vai personas datu.

## Ātrās instrukcijas

```bash
cd frontend && npm install
cd ../backend && npm install
npm test
npm run deploy:sepolia
npm run serve
```

`npm run serve` (mapē `backend`) palaiž serveri, kas pasniedz **tikai mapi `frontend/`** (Svelte pirmkods tiek kompilēts lidojumā) uz http://localhost:8080. Serveris nevar nolasīt neko ārpus `frontend/`, tai skaitā `.env` un `backend/`.

Pirms `deploy:sepolia` ieraksti `PRIVATE_KEY` failā `.env`. Pēc izvietošanas lapa automātiski zina līguma adresi (nav jābūvē no jauna). Svelte izstrādei un pārbūvei:

```bash
cd frontend
npm install
npm run dev      # izstrādes serveris ar karsto pārlādi
npm run build    # pārbūvē public/ no src/
```

Sīkāk zemāk.

## Projekta struktūra

```
reach21/
├── .env                          # RPC + testa maka atslēga (NETIEK publicēts GitHub)
├── .gitignore
├── index.html                    # pāradresē uz public/ (GitHub Pages)
├── README.md
├── frontend/                     # Svelte 5 + Vite pirmkods
│   ├── package.json
│   ├── vite.config.js            # būvē uz ../public
│   ├── index.html
│   ├── static/                   # kopē uz public/ būvēšanas laikā
│   │   ├── abi.json
│   │   ├── config.json           # līguma adrese (raksta deploy skripts)
│   │   └── Game.sol
│   └── src/
│       ├── main.js
│       ├── App.svelte
│       ├── app.css
│       ├── lib/store.svelte.js   # MetaMask, ethers.js, līguma izsaukumi, stāvoklis
│       └── components/           # Header, CreateGame, JoinGame, MyGames, GameRow,
│                                 # Board, History, TxCard
├── public/                       # ← sagatavotā vietne, ko publicē GitHub Pages
│   ├── index.html
│   ├── assets/ (js, css)
│   ├── abi.json, config.json, Game.sol
└── backend/                      # Hardhat: līgums, testi, izvietošana
    ├── contracts/Game.sol        # viedais līgums Reach21 (Solidity)
    ├── test/Reach21.test.js
    ├── scripts/deploy.js         # izvieto Sepolia un ieraksta config.json + abi.json
    ├── scripts/verify.js         # (izvēles) Etherscan verifikācija
    ├── scripts/sync-abi.js       # atjauno ABI pēc līguma izmaiņām
    ├── server.js                 # pasniedz tikai mapi frontend/ (npm run serve)
    ├── hardhat.config.js
    └── package.json
```

> Viedais līgums vienmēr ir Solidity (to nevar rakstīt Svelte). Viss lietotāja interfeiss ir Svelte komponentēs.
> **Svarīgi par GitHub:** augšupielādē visu, **izņemot `.env`** un `node_modules` (to jau aizsargā `.gitignore`).
> Mape `public/` jau satur sagatavoto (nobūvēto) vietni, tāpēc GitHub Pages darbojas bez papildu soļiem.

## Spēles noteikumi (izstrādāti grupā)

| Jautājums | Mūsu lēmums |
|---|---|
| Mērķis | Izveidotājs izvēlas **15–31** (noklusējums 21) |
| Gājiens | Drīkst pieskaitīt **1, 2 vai 3** |
| Kurš sāk | Mača izveidotājs (1. spēlētājs) |
| Pārsniegšana | Gājiens, kas summu paceltu virs mērķa, **tiek noraidīts** (`require`) |
| Uzvara | Kurš summu precīzi sasniedz līdz mērķim |
| Revanšs | Jauns mačs (poga "Revanšs"); uzvaru statistika `wins` paliek |
| Aizķeršanās | Ja pretinieks 24 h nedara gājienu, otrs var pieprasīt uzvaru (`claimTimeout`) |
| Atcelšana | Izveidotājs var atcelt maču, kamēr neviens nav pievienojies |

Aizliegtās darbības: gājiens ārpus kārtas, gājiens 0 vai >3, summas pārsniegšana, spēle pret sevi, pievienošanās pilnam macam, gājieni pēc uzvaras.

### Ko glabā blokķēde, ko — HTML
- **Blokķēdē (līgumā):** abas spēlētāju adreses, summa, kārtas īpašnieks, statuss (`enum GameStatus`), mērķis, uzvarētājs, pēdējais gājiens, `wins` un `gamesPlayed` (`mapping(address => uint)`), maču saraksts katram spēlētājam.
- **HTML/JS pusē:** tikai attēlojums, pogu stāvoklis, paziņojumi un pēdējā atvērtā mača ID (`localStorage`). Pēc pārlādes viss stāvoklis tiek **nolasīts no blokķēdes**.

### Līguma saskarne

```
createGame(uint8 target) → gameId
joinGame(uint256 gameId)
makeMove(uint256 gameId, uint8 amount)
cancelGame(uint256 gameId)
claimTimeout(uint256 gameId)
getGame(uint256 gameId) → Game
getPlayerGames(address) → uint256[]
wins(address) / gamesPlayed(address) / gameCount()

events: GameCreated, GameStarted, MoveMade, GameFinished, GameCancelled
```

Solidity elementi: `require()`, `enum GameStatus`, `events`, `mapping(address => wins)`, `modifier exists`.

## Darba gaita (soli pa solim)

### 1. Sagatavošana
- MetaMask ar atsevišķu **testa kontu**, tīkls **Sepolia**, daži testa ETH (faucet).
- Instalē [Node.js](https://nodejs.org) 18+.

### 2. Uzstādi atkarības un izpildi testus (Remix VM aizvietotājs — lokāls Hardhat tīkls)
```bash
cd backend
npm install
npm test
```
Gaidāmais rezultāts: **21 tests izpildīts**, tai skaitā 3 obligātie testi (zemāk).

### 3. Aizpildi `.env`
`.env` atrodas projekta saknē (blakus `README.md`) un satur trīs rindas:

```
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=
ETHERSCAN_API_KEY=
```

- `SEPOLIA_RPC_URL`: jau aizpildīts ar bezmaksas publisko Sepolia RPC. Vari aizstāt ar savu Alchemy vai Infura adresi.
- `PRIVATE_KEY`: **testa** maka privātā atslēga, 64 heksadecimāli simboli, ar vai bez `0x`. MetaMask: trīs punkti pie konta, Account details, Show private key. Izmanto tikai speciāli testam izveidotu kontu bez īstiem līdzekļiem. Kontam jābūt Sepolia ETH (faucet).
- `ETHERSCAN_API_KEY`: nav obligāts; vajadzīgs tikai `npm run verify:sepolia`. Bezmaksas atslēga: etherscan.io/myapikey.

Rindā nedrīkst būt atstarpju ap `=` un pēdiņu. Failu nekad nepublicē GitHub.

### 4. Izvieto līgumu Sepolia
```bash
cd backend
npm run deploy:sepolia
```
Skripts pārbauda, ka tīkls ir Sepolia (chainId 11155111), izvieto līgumu, izdrukā **adresi** un **Etherscan saites**,
un pats ieraksta `config.json`, `abi.json`, `Game.sol` gan mapē `frontend/static`, gan `public`.
Pieraksti adresi un deploy darījuma saiti (nepieciešams nodošanai).

Neobligāti: `npm run verify:sepolia` — pirmkods kļūst redzams Etherscan.

### 5. Pārbaudi lapu lokāli
```bash
cd frontend && npm install
cd ../backend
npm run serve        # atver http://localhost:8080
```
Serveris pasniedz tikai mapi `frontend/`. Ports maināms: `PORT=3000 npm run serve`.

Alternatīva ar Vite tieši: `cd frontend && npm run dev` (parasti http://localhost:5173).

Atver ar diviem dažādiem MetaMask kontiem (piem., divi pārlūka profili) un izspēlē spēli.
Pirms publicēšanas GitHub Pages palaid `cd frontend && npm run build`, lai atjaunotu `public/`.

### 6. Publicē GitHub Pages
1. Izveido **publisku** GitHub repozitoriju un augšupielādē projektu (bez `.env`).
2. **Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/ (root)` → Save.** Saknes `index.html` pāradresē uz mapi `public/`, tāpēc nekas nav jāpārvieto.
3. Publiskā adrese: `https://LIETOTAJS.github.io/REPOZITORIJS/` (pāradresē uz `/public/`). Spēles lapas tiešā adrese: `.../REPOZITORIJS/public/`.
4. Pārbaudi no cita pārlūka, ka lapa strādā (Vite ir iestatīts ar relatīviem ceļiem `./assets/...`, `./abi.json`, `./config.json`).

### Publicēšana Render.com (alternatīva GitHub Pages)

Izvēlies **Static Site** (ieteicams): backend uz Render nav vajadzīgs, jo līgums jau ir izvietots Sepolia.

1. Augšupielādē projektu GitHub (bez `.env`) un Render nospied **New → Static Site**, izvēlies repozitoriju.
2. Iestatījumi:
   - **Root Directory:** atstāj tukšu
   - **Build Command:** `cd frontend && npm install --include=dev && npm run build`
   - **Publish Directory:** `public`
3. **Environment:** pievieno `NODE_VERSION` = `20`. `.env` mainīgie Render nav jāpievieno (frontend neizmanto noslēpumus).
4. Nospied **Create Static Site**. Pēc būvēšanas adrese būs `https://NOSAUKUMS.onrender.com`.

Vai izmanto **New → Blueprint**: Render pats nolasa failu `render.yaml` no repozitorija saknes.

Svarīgi: `frontend/static/config.json` jābūt ar tavu līguma adresi pirms commit, jo būvēšanas laikā tas tiek nokopēts uz `public/`.

Ja tomēr vēlies **Web Service** (`backend/server.js`): Build Command `cd frontend && npm install --include=dev && cd ../backend && npm install`, Start Command `cd backend && node server.js` (Render pats iestata `PORT`). Tas palaiž izstrādes serveri, tāpēc Static Site ir labāka izvēle.

### 7. Gala tests publiskajā URL
Atver GitHub Pages URL → pieslēdz 1. un 2. maku → pārliecinies, ka MetaMask ir uz Sepolia → izspēlē maču → pārlādē lapu (stāvoklis atkal nolasās no blokķēdes) → atver darījumus un līgumu Etherscan.

### 8. Demonstrācija (6–8 min)
Skat. sadaļu "Demonstrācijas scenārijs" zemāk.

## Obligātie testi (3)

| # | Veids | Ko pārbauda | Rezultāts |
|---|---|---|---|
| 1 | Pozitīvs | Divi konti izspēlē spēli līdz uzvarai (7 gājieni × 3 = 21); `wins`, `gamesPlayed`, notikumi | ✔ |
| 2 | Negatīvs | Nepareizais konts (Bobs ārpus kārtas, trešais konts, pirms pievienošanās) mēģina iet → `Nav tava karta` / `Spele nenotiek` | ✔ |
| 3 | Negatīvs | Gājiens 0, 4, 255 vai tāds, kas pārsniedz mērķi → `Gajiens jabut 1-3` / `Parsniedz merki` | ✔ |

Papildus: mērķa robežas (14/32), neeksistējošs mačs, spēle pret sevi, pilns mačs, atcelšana, timeout, revanšs ar saglabātu statistiku, vairāki mači vienlaikus.

## Demonstrācijas scenārijs

| Laiks | Ko parādīt | Atbildīgais |
|---|---|---|
| ~1 min | Spēles ideja, noteikumi, uzvaras kritērijs, lomas | Spēles dizaina pārstāvis |
| ~2 min | `Game.sol`: stāvoklis, `makeMove` ar `require`, vismaz viena aizsardzības pārbaude | Solidity izstrādātājs |
| ~2 min | Publiskā GitHub Pages spēle, maks, gājiens un MetaMask apstiprinājums | Frontend izstrādātājs |
| ~1 min | Etherscan darījums un stāvoklis pēc pārlādes | Testētājs |
| ~1–2 min | **Aizliegtais mēģinājums** (sk. zemāk), ierobežojumi, jautājumi | Visi |

**Aizliegtā mēģinājuma demonstrēšana:** lapā atver **"Demonstrācijas režīms"**, atķeksē opciju un nospied "Sūtīt savu skaitli" (piem., 5) vai izmanto pretinieka maku ārpus kārtas.
Darījums nonāk Etherscan kā neizdevies (revert) — pierādījums, ka noteikumus nodrošina līgums, nevis JavaScript.

Minimums: divi maki secīgi veic gājienus, lapā redzams uzvarētājs, Etherscan redzami vismaz **divi gājienu darījumi**.

## Nodošanas veidne

```
Grupa: 1
Spēles nosaukums: Sasniedz 21 — Blockchain duelis
Dalībnieku lomas: [spēles dizains / Solidity / frontend / testi un dokumentācija]
GitHub repozitorijs: https://github.com/...
Spēles publiskā lapa: https://...github.io/.../
Sepolia līgums: 0x...
Etherscan darījums: https://sepolia.etherscan.io/tx/0x...
Kas darbojas: divu maku spēle, kārtu secība, mērķa pārbaude, uzvarētājs, statistika, revanšs, timeout, atcelšana
Kas vēl nedarbojas / ierobežojumi: [aizpildīt pēc gala testa]; gaidošo maču saraksts skenē tikai pēdējos 30 maču
Kādi 3 testi izpildīti: pozitīvs (pilna spēle), negatīvs (nepareizais konts), negatīvs (pārsniegts skaits/mērķis)
```

## Ierobežojumi
- Līgums nav auditēts; paredzēts mācībām un testnetam.
- Gājienu vēsture tiek ielasīta no notikumiem (`MoveMade`); ja publiskais RPC ierobežo žurnālu diapazonu, vēsture var nebūt redzama, bet stāvoklis vienmēr tiek nolasīts tieši no līguma.
- `claimTimeout` izmanto bloka laiku (`block.timestamp`), tāpēc ir neliela neprecizitāte (sekundes).

## Izmantotie rīki (AI atklāsme)
Šī projekta kodu ģenerēja mākslīgā intelekta asistents (Claude, Anthropic). Grupai pašai jāizskaidro kods, jāizpilda testi un jāparāda, kāpēc noteikumi strādā.
Pārbaudīts: Solidity līgums kompilēts ar solc 0.8.24 un izturējis 21 Hardhat testu. **Jāizdara pašiem:** izvietošana Sepolia ar savu testa maku, GitHub Pages publicēšana un gala tests ar diviem makiem.

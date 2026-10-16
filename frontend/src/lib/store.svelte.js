import { ethers } from "ethers";

const SEPOLIA_ID = 11155111n;
const SEPOLIA_HEX = "0xaa36a7";
const READ_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
export const EXPLORER = "https://sepolia.etherscan.io";
export const STATUS_LABEL = ["—", "Gaida spēlētāju", "Notiek", "Pabeigts", "Atcelts"];
export const STATUS_CLASS = ["", "warn", "ok", "", "off"];
export const ZERO = ethers.ZeroAddress;
const LAST_GAME_KEY = "reach21:lastGame";
const POLL_MS = 6000;
const LIST_SCAN = 30;

export const short = (a) => (a && a !== ZERO ? a.slice(0, 6) + "…" + a.slice(-4) : "–");
export const same = (a, b) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
export const txUrl = (h) => `${EXPLORER}/tx/${h}`;

let abi = null;
let readProvider = null;
let browserProvider = null;
let signer = null;
let reader = null;
let writer = null;
let pollTimer = null;
let started = false;

export const app = $state({
  cfg: null,
  banner: null,
  bannerErr: false,
  netText: "Nav pieslēgts",
  netClass: "off",
  account: null,
  connected: false,
  busy: false,
  tx: null,
  currentId: null,
  game: null,
  history: [],
  historyError: false,
  openGames: [],
  myGames: [],
  myWins: "–",
  myPlayed: "–",
  wins1: "–",
  wins2: "–",
  turnTimeout: 86400,
  now: Math.floor(Date.now() / 1000),
  demo: false,
});

function setBanner(msg, isErr = false) {
  app.banner = msg;
  app.bannerErr = isErr;
}

function setTx(state, msg, hash) {
  app.tx = { state: state || "", msg, hash: hash || null };
}

function prettyError(e) {
  if (!e) return "Nezināma kļūda";
  if (e.code === "ACTION_REJECTED" || e.code === 4001) return "Tu noraidīji darījumu MetaMask.";
  const r = e.revert?.args?.[0] || e.reason;
  if (r) return `Līgums noraidīja darbību: ${r}`;
  const nested = e.info?.error?.message || e.error?.message;
  return (nested || e.shortMessage || e.message || String(e)).slice(0, 300);
}

export async function init() {
  if (started) return;
  started = true;
  try {
    const [c, a] = await Promise.all([
      fetch("./config.json", { cache: "no-store" }).then((r) => r.json()),
      fetch("./abi.json", { cache: "no-store" }).then((r) => r.json()),
    ]);
    app.cfg = c;
    abi = a;
  } catch (e) {
    setBanner("Neizdevās ielādēt config.json / abi.json. Atver lapu caur HTTPS (GitHub Pages) vai lokālu serveri, nevis kā failu.", true);
    return;
  }

  if (!app.cfg.address || !ethers.isAddress(app.cfg.address)) {
    setBanner("Līgums vēl nav izvietots: config.json nav derīgas adreses. Izpildi `npm run deploy:sepolia` mapē backend.", true);
    return;
  }

  readProvider = new ethers.JsonRpcProvider(READ_RPC, 11155111, {
    staticNetwork: ethers.Network.from(11155111),
  });
  reader = new ethers.Contract(app.cfg.address, abi, readProvider);
  try {
    app.turnTimeout = Number(await reader.TURN_TIMEOUT());
  } catch (_) {}

  window.addEventListener("hashchange", () => {
    const m = location.hash.match(/game=(\d+)/);
    if (m && Number(m[1]) !== app.currentId) openGame(Number(m[1]));
  });

  const m = location.hash.match(/game=(\d+)/);
  const startId = m ? Number(m[1]) : Number(localStorage.getItem(LAST_GAME_KEY) || 0);
  if (startId > 0) await openGame(startId);
  loadLists();

  if (window.ethereum) {
    try {
      const accs = await window.ethereum.request({ method: "eth_accounts" });
      if (accs && accs.length) await connect();
    } catch (_) {}
  }
}

async function ensureSepolia() {
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (BigInt(chainId) === SEPOLIA_ID) return true;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_HEX }],
    });
    return true;
  } catch (err) {
    if (err && err.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_HEX,
              chainName: "Sepolia",
              nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: [READ_RPC],
              blockExplorerUrls: [EXPLORER],
            },
          ],
        });
        return true;
      } catch (_) {
        return false;
      }
    }
    return false;
  }
}

export async function connect() {
  if (!window.ethereum) {
    setBanner("Nepieciešams MetaMask. Instalē paplašinājumu no metamask.io un pārlādē lapu.", true);
    return;
  }
  if (!app.cfg?.address || !abi) return;
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const ok = await ensureSepolia();
    if (!ok) {
      app.netText = "Nepareizs tīkls";
      app.netClass = "off";
      setBanner("Lūdzu, pārslēdz MetaMask uz Sepolia testtīklu (chainId 11155111).", true);
      return;
    }
    browserProvider = new ethers.BrowserProvider(window.ethereum);
    const net = await browserProvider.getNetwork();
    if (net.chainId !== SEPOLIA_ID) throw new Error("Lūdzu, pārslēdz MetaMask uz Sepolia");
    signer = await browserProvider.getSigner();
    app.account = await signer.getAddress();
    writer = new ethers.Contract(app.cfg.address, abi, signer);
    reader = new ethers.Contract(app.cfg.address, abi, browserProvider);
    app.connected = true;
    app.netText = "Sepolia ✓";
    app.netClass = "ok";
    setBanner(null);

    window.ethereum.removeAllListeners?.("accountsChanged");
    window.ethereum.removeAllListeners?.("chainChanged");
    window.ethereum.on?.("accountsChanged", () => location.reload());
    window.ethereum.on?.("chainChanged", () => location.reload());

    await loadLists();
    if (app.currentId) await refreshGame(true);
  } catch (e) {
    setBanner(prettyError(e), true);
  }
}

async function sendTx(label, fn) {
  if (!writer) {
    setBanner("Vispirms pieslēdz MetaMask.", true);
    return null;
  }
  let tx;
  app.busy = true;
  try {
    setTx("wait", `Gaida apstiprinājumu MetaMask… (${label})`);
    tx = await fn();
    setTx("wait", "Darījums nosūtīts, gaida apstiprinājumu blokķēdē…", tx.hash);
    const rc = await tx.wait();
    setTx("ok", `✓ Darījums apstiprināts blokā ${rc.blockNumber}.`, tx.hash);
    return rc;
  } catch (e) {
    const hash = tx?.hash || e.receipt?.hash || e.transaction?.hash;
    if (hash && (e.code === "CALL_EXCEPTION" || e.receipt)) {
      setTx("bad", "✗ Līgums noraidīja darījumu (revert). Tas ir redzams Etherscan kā neizdevies.", hash);
    } else {
      setTx("bad", "✗ " + prettyError(e), hash);
    }
    return null;
  } finally {
    app.busy = false;
    if (app.currentId) await refreshGame(true);
    await loadLists();
  }
}

function idFromLogs(receipt, eventName) {
  for (const log of receipt.logs) {
    try {
      const p = writer.interface.parseLog(log);
      if (p && p.name === eventName) return Number(p.args[0]);
    } catch (_) {}
  }
  return null;
}

export async function createGame(target) {
  if (!Number.isInteger(target) || target < 15 || target > 31) {
    setTx("bad", "Mērķim jābūt veselam skaitlim no 15 līdz 31.");
    return;
  }
  const rc = await sendTx("Izveido maču…", () => writer.createGame(target));
  if (rc) {
    const id = idFromLogs(rc, "GameCreated");
    if (id) await openGame(id);
  }
}

export async function rematch() {
  if (!app.game) return;
  const target = app.game.target;
  const rc = await sendTx("Revanšs…", () => writer.createGame(target));
  if (rc) {
    const id = idFromLogs(rc, "GameCreated");
    if (id) await openGame(id);
  }
}

export async function joinGame(id) {
  if (!Number.isInteger(id) || id < 1) {
    setTx("bad", "Ievadi derīgu mača ID.");
    return;
  }
  const rc = await sendTx(`Pievienojas maču #${id}…`, () => writer.joinGame(id));
  if (rc) await openGame(id);
}

export async function makeMove(amount, forced) {
  if (!app.currentId) return;
  const id = app.currentId;
  const opts = forced ? { gasLimit: 120000 } : {};
  await sendTx(`Gājiens +${amount}…`, () => writer.makeMove(id, amount, opts));
}

export async function cancelGame() {
  const id = app.currentId;
  await sendTx("Atceļ maču…", () => writer.cancelGame(id));
}

export async function claimTimeout() {
  const id = app.currentId;
  await sendTx("Pieprasa uzvaru…", () => writer.claimTimeout(id));
}

async function fetchGame(id) {
  const g = await reader.getGame(id);
  return {
    id: Number(id),
    player1: g.player1,
    player2: g.player2,
    turn: g.turn,
    winner: g.winner,
    lastMover: g.lastMover,
    target: Number(g.target),
    total: Number(g.total),
    lastMove: Number(g.lastMove),
    status: Number(g.status),
    lastActionAt: Number(g.lastActionAt),
  };
}

export async function openGame(id) {
  app.currentId = id;
  localStorage.setItem(LAST_GAME_KEY, String(id));
  history.replaceState(null, "", "#game=" + id);
  await refreshGame(true);
  clearInterval(pollTimer);
  pollTimer = setInterval(() => refreshGame(false), POLL_MS);
}

export async function refreshGame(withHistory) {
  const id = app.currentId;
  if (!id || !reader) return;
  let g;
  try {
    g = await fetchGame(id);
  } catch (e) {
    app.game = null;
    app.currentId = null;
    clearInterval(pollTimer);
    setTx("bad", `Mačs #${id} netika atrasts vai nevar nolasīt: ${prettyError(e)}`);
    return;
  }
  app.now = Math.floor(Date.now() / 1000);
  app.game = g;
  try {
    const w1 = await reader.wins(g.player1);
    app.wins1 = String(w1);
    app.wins2 = g.player2 !== ZERO ? String(await reader.wins(g.player2)) : "–";
  } catch (_) {}
  if (withHistory) await loadHistory(g);
  if (app.account) loadMyStats();
}

async function loadHistory(g) {
  try {
    const f = reader.filters.MoveMade(g.id);
    const from = app.cfg.deployBlock && app.cfg.deployBlock > 0 ? app.cfg.deployBlock : 0;
    const events = await reader.queryFilter(f, from, "latest");
    app.history = events.map((ev) => ({
      player: ev.args[1],
      amount: Number(ev.args[2]),
      newTotal: Number(ev.args[3]),
      hash: ev.transactionHash,
    }));
    app.historyError = false;
  } catch (e) {
    app.history = [];
    app.historyError = true;
  }
}

async function loadMyStats() {
  try {
    const [w, p] = await Promise.all([reader.wins(app.account), reader.gamesPlayed(app.account)]);
    app.myWins = String(w);
    app.myPlayed = String(p);
  } catch (_) {}
}

export async function loadLists() {
  if (!reader) return;
  try {
    const count = Number(await reader.gameCount());
    const ids = [];
    for (let i = count; i >= 1 && ids.length < LIST_SCAN; i--) ids.push(i);
    const games = await Promise.all(ids.map((i) => fetchGame(i).catch(() => null)));
    app.openGames = games.filter((g) => g && g.status === 1 && !same(g.player1, app.account));
  } catch (_) {
    app.openGames = [];
  }
  if (!app.account) {
    app.myGames = [];
    return;
  }
  try {
    const ids = (await reader.getPlayerGames(app.account)).map(Number).reverse().slice(0, 15);
    const games = await Promise.all(ids.map((i) => fetchGame(i).catch(() => null)));
    app.myGames = games.filter(Boolean);
    loadMyStats();
  } catch (_) {
    app.myGames = [];
  }
}

export async function copyLink() {
  const url = location.origin + location.pathname + "#game=" + app.currentId;
  try {
    await navigator.clipboard.writeText(url);
    setTx("ok", "Saite nokopēta: " + url);
  } catch (_) {
    setTx("", "Kopē manuāli: " + url);
  }
}

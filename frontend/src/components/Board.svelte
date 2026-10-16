<script>
  import {
    app,
    short,
    same,
    ZERO,
    STATUS_LABEL,
    STATUS_CLASS,
    makeMove,
    cancelGame,
    claimTimeout,
    rematch,
    copyLink,
    refreshGame,
  } from "../lib/store.svelte.js";
  import History from "./History.svelte";

  let customAmt = $state(5);

  const g = $derived(app.game);
  const mine = $derived(!!g && g.status === 2 && same(g.turn, app.account));
  const isPlayer = $derived(!!g && (same(g.player1, app.account) || same(g.player2, app.account)));
  const canTimeout = $derived(
    !!g && g.status === 2 && isPlayer && !same(g.turn, app.account) && app.now >= g.lastActionAt + app.turnTimeout
  );
  const percent = $derived(g ? Math.min(100, (g.total / g.target) * 100) : 0);

  const turn = $derived.by(() => {
    if (!g) return { text: "", cls: "" };
    if (g.status === 1) return { text: `Gaida otru spēlētāju (mača ID: ${g.id})`, cls: "" };
    if (g.status === 2) {
      if (!app.account) return { text: `Kārta: ${short(g.turn)} (pieslēdzies, lai spēlētu)`, cls: "theirs" };
      return mine
        ? { text: "Tava kārta! Izvēlies +1, +2 vai +3.", cls: "mine" }
        : { text: "Pretinieka kārta…", cls: "theirs" };
    }
    if (g.status === 3) {
      const iWon = same(g.winner, app.account);
      const text = iWon
        ? "🏆 Tu uzvarēji!"
        : `Uzvarētājs: ${short(g.winner)}${isPlayer ? " — šoreiz zaudēji." : ""}`;
      return { text, cls: "done" };
    }
    return { text: "Mačs atcelts.", cls: "" };
  });

  const canSend = $derived(app.connected && !!g && g.status === 2 && !app.busy);

  function legal(amt) {
    return mine && g.total + amt <= g.target;
  }
</script>

{#if g}
  <section class="card board" aria-live="polite">
    <div class="boardhead">
      <h2>
        Mačs #{g.id}
        <span class="badge {STATUS_CLASS[g.status]}">{STATUS_LABEL[g.status]}</span>
      </h2>
      <button class="btn small" onclick={() => refreshGame(true)}>↻ Atjaunot</button>
    </div>

    <div class="players">
      <div
        class="player"
        class:turn={g.status === 2 && same(g.turn, g.player1)}
        class:win={g.status === 3 && same(g.winner, g.player1)}
      >
        <span class="muted small">1. spēlētājs (sāk)</span>
        <b title={g.player1}>
          {short(g.player1)}{#if same(g.player1, app.account)}<span class="you">TU</span>{/if}
        </b>
        <span class="small">Uzvaras: <b>{app.wins1}</b></span>
      </div>
      <div class="vs">VS</div>
      <div
        class="player"
        class:turn={g.status === 2 && same(g.turn, g.player2)}
        class:win={g.status === 3 && same(g.winner, g.player2)}
      >
        <span class="muted small">2. spēlētājs</span>
        <b title={g.player2}>
          {g.player2 !== ZERO ? short(g.player2) : "gaida…"}{#if same(g.player2, app.account)}<span class="you">TU</span>{/if}
        </b>
        <span class="small">Uzvaras: <b>{app.wins2}</b></span>
      </div>
    </div>

    <div class="total">
      <div class="bignum">{g.total}<small> / {g.target}</small></div>
      <div class="track"><div class="fill" style="width: {percent}%"></div></div>
      <p class="turn {turn.cls}">{turn.text}</p>
      {#if g.lastMove > 0}
        <p class="small muted">Pēdējais gājiens: {short(g.lastMover)} pieskaitīja +{g.lastMove}</p>
      {/if}
    </div>

    <div class="moves">
      {#each [1, 2, 3] as amt}
        <button
          class="mv"
          disabled={!canSend || (!app.demo && !legal(amt))}
          onclick={() => makeMove(amt, app.demo)}
        >
          +{amt}
        </button>
      {/each}
    </div>

    <div class="actions">
      {#if canTimeout}
        <button class="btn" disabled={app.busy} onclick={claimTimeout}>Pieprasīt uzvaru (pretinieks kavē)</button>
      {/if}
      {#if g.status === 1 && same(g.player1, app.account)}
        <button class="btn" disabled={app.busy} onclick={cancelGame}>Atcelt maču</button>
      {/if}
      {#if g.status === 3 && isPlayer}
        <button class="btn primary" disabled={app.busy} onclick={rematch}>🔁 Revanšs (jauns mačs)</button>
      {/if}
      <button class="btn small" onclick={copyLink}>📋 Kopēt saiti uz šo maču</button>
    </div>

    <details class="demo">
      <summary>Demonstrācijas režīms (aizliegtu gājienu mēģinājums)</summary>
      <label class="check">
        <input type="checkbox" bind:checked={app.demo} />
        Atļaut sūtīt arī aizliegtus gājienus (darījums nonāks Etherscan kā neizdevies)
      </label>
      <div class="row">
        <input type="number" min="0" max="255" inputmode="numeric" aria-label="Savs skaitlis" bind:value={customAmt} />
        <button class="btn" disabled={!canSend || !app.demo} onclick={() => makeMove(Number(customAmt), true)}>
          Sūtīt savu skaitli
        </button>
      </div>
      <p class="small muted">
        Režīmā tiek iestatīts fiksēts gas limits, tāpēc MetaMask neaptur darījumu pirms nosūtīšanas. Līgums to
        noraida (revert), bet noraidītais darījums ir redzams Etherscan.
      </p>
    </details>

    <History />
  </section>
{/if}

<script>
  import { app, connect, short } from "../lib/store.svelte.js";
</script>

<header class="topbar">
  <div class="wrap bar">
    <div class="brand">⚔️ Sasniedz&nbsp;21 <span class="chip">Sepolia testnet</span></div>
    <div class="walletbox">
      <span class="badge {app.netClass}">{app.netText}</span>
      {#if app.account}
        <span class="acct" title={app.account}>{short(app.account)}</span>
      {/if}
      <button class="btn primary" onclick={() => connect()} disabled={app.connected || !app.cfg?.address}>
        {app.connected ? "Pieslēgts" : "Pieslēgt MetaMask"}
      </button>
    </div>
  </div>
</header>

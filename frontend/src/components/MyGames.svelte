<script>
  import { app, openGame } from "../lib/store.svelte.js";
  import GameRow from "./GameRow.svelte";
</script>

<section class="card">
  <h2>Mani mači</h2>
  <ul class="list">
    {#if !app.account}
      <li class="muted small">Pieslēdzies, lai redzētu savus maču…</li>
    {:else}
      {#each app.myGames as g (g.id)}
        <GameRow {g} label="Atvērt" onaction={() => openGame(g.id)} />
      {:else}
        <li class="muted small">Tev vēl nav maču.</li>
      {/each}
    {/if}
  </ul>
  <div class="stats">
    <div><span class="muted small">Manas uzvaras</span><b>{app.myWins}</b></div>
    <div><span class="muted small">Pabeigtie mači</span><b>{app.myPlayed}</b></div>
  </div>
</section>

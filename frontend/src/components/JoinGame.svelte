<script>
  import { app, joinGame, loadLists } from "../lib/store.svelte.js";
  import GameRow from "./GameRow.svelte";

  let joinId = $state("");
</script>

<section class="card">
  <h2>2. Pievienoties</h2>
  <div class="row">
    <input type="number" min="1" placeholder="Mača ID" inputmode="numeric" bind:value={joinId} />
    <button class="btn" disabled={!app.connected || app.busy} onclick={() => joinGame(Number(joinId))}>
      Pievienoties
    </button>
  </div>
  <h3>Gaidošie mači</h3>
  <ul class="list">
    {#each app.openGames as g (g.id)}
      <GameRow {g} label="Pievienoties" disabled={!app.connected || app.busy} onaction={() => joinGame(g.id)} />
    {:else}
      <li class="muted small">Pašlaik nav gaidošu maču.</li>
    {/each}
  </ul>
  <button class="btn small" onclick={loadLists}>↻ Atjaunot sarakstus</button>
</section>

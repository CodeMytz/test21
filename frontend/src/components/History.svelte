<script>
  import { app, short, same, txUrl } from "../lib/store.svelte.js";
</script>

<h3>Gājienu vēsture</h3>
<ol class="history">
  {#each app.history as h, i (h.hash + i)}
    <li>
      {short(h.player)} {same(h.player, app.account) ? "(tu) " : ""}+{h.amount} → {h.newTotal}
      <a href={txUrl(h.hash)} target="_blank" rel="noopener">tx ↗</a>
      {#if app.game && h.newTotal === app.game.target}
        <span class="fin"> 🏁 uzvara</span>
      {/if}
    </li>
  {:else}
    <li class="muted small">
      {app.historyError
        ? "Vēsturi nevar ielādēt (RPC ierobežojums). Spēles stāvoklis augstāk tiek nolasīts tieši no līguma."
        : "Nav gājienu."}
    </li>
  {/each}
</ol>

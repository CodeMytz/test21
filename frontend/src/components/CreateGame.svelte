<script>
  import { app, createGame } from "../lib/store.svelte.js";

  let target = $state(21);
</script>

<section class="card">
  <h2>1. Jauna spēle</h2>
  <label class="field">
    Mērķa skaitlis (15–31)
    <input type="number" min="15" max="31" inputmode="numeric" bind:value={target} />
  </label>
  <button class="btn primary" disabled={!app.connected || app.busy} onclick={() => createGame(Number(target))}>
    Izveidot maču
  </button>
  <p class="small muted">Tu kļūsti par 1. spēlētāju un sāc pirmais. Otram makam jāpievienojas.</p>
</section>

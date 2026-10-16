<script>
  import { app, txUrl } from "../lib/store.svelte.js";
</script>

<section class="card txcard {app.tx.state}">
  <h3>Darījuma statuss</h3>
  <p id="txMsg">{app.tx.msg}</p>
  {#if app.tx.hash}
    <p><a href={txUrl(app.tx.hash)} target="_blank" rel="noopener">Skatīt Etherscan</a></p>
  {/if}
</section>

<script>
  import { STATUS_LABEL, ZERO, short } from "../lib/store.svelte.js";

  let { g, label, onaction, disabled = false } = $props();
</script>

<li>
  <div class="meta">
    <b>#{g.id} · mērķis {g.target}</b>
    <span class="muted small">
      {STATUS_LABEL[g.status]} · {short(g.player1)}{g.player2 !== ZERO ? " vs " + short(g.player2) : ""}
    </span>
  </div>
  <button class="btn small" {disabled} onclick={onaction}>{label}</button>
</li>

<script>
  import { onMount } from "svelte";
  import { app, init, EXPLORER } from "./lib/store.svelte.js";
  import Header from "./components/Header.svelte";
  import CreateGame from "./components/CreateGame.svelte";
  import JoinGame from "./components/JoinGame.svelte";
  import MyGames from "./components/MyGames.svelte";
  import Board from "./components/Board.svelte";
  import TxCard from "./components/TxCard.svelte";

  onMount(init);
</script>

<Header />

<main class="wrap">
  {#if app.banner}
    <div class="banner" class:err={app.bannerErr}>{app.banner}</div>
  {/if}

  <section class="card intro">
    <h1>Blockchain duelis</h1>
    <p>
      Divi spēlētāji pārmaiņus pieskaita kopējai summai <b>1, 2 vai 3</b>. Uzvar tas, kurš summu
      <b>precīzi</b> sasniedz līdz mērķim (parasti 21). Gājienu, kas summu pārsniegtu virs mērķa,
      līgums noraida. Visi noteikumi tiek pārbaudīti viedajā līgumā, nevis šajā lapā.
    </p>
    <p class="small muted">
      Tikai Ethereum Sepolia testtīkls un testa ETH. Neizmanto īstus līdzekļus.
      {#if app.cfg?.address}
        <a href="{EXPLORER}/address/{app.cfg.address}" target="_blank" rel="noopener">Līgums Etherscan ↗</a> ·
      {/if}
      <a href="./Game.sol" target="_blank" rel="noopener">Game.sol</a>
    </p>
  </section>

  <div class="grid">
    <CreateGame />
    <JoinGame />
    <MyGames />
  </div>

  {#if app.game}
    <Board />
  {/if}

  {#if app.tx}
    <TxCard />
  {/if}
</main>

<footer class="footer">
  <div class="wrap small">
    Mācību projekts · Ethereum Sepolia (chainId 11155111) · Solidity ^0.8.24 · Svelte · ethers.js v6 ·
    Spēles stāvoklis tiek glabāts blokķēdē un nolasīts no jauna pēc lapas pārlādes.
  </div>
</footer>

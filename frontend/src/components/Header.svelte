<script>
  import { onMount } from "svelte";
  import { app, connect, short } from "../lib/store.svelte.js";
  import { theme, initTheme, toggleTheme } from "../lib/theme.svelte.js";

  onMount(initTheme);
</script>

<header class="topbar">
  <div class="wrap bar">
    <div class="brand">Sasniedz&nbsp;21</div>
    <div class="walletbox">
      <span class="badge {app.netClass}">{app.netText}</span>
      {#if app.account}
        <span class="acct" title={app.account}>{short(app.account)}</span>
      {/if}
      <button
        class="iconbtn"
        onclick={toggleTheme}
        aria-label={theme.mode === "dark" ? "Ieslēgt gaišo režīmu" : "Ieslēgt tumšo režīmu"}
        title={theme.mode === "dark" ? "Gaišais režīms" : "Tumšais režīms"}
      >
        {#if theme.mode === "dark"}
          <!-- light mode icon -->
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M8 22H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M5 19H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M2 16H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M12 6C8.68629 6 6 8.68629 6 12C6 13.5217 6.56645 14.911 7.5 15.9687H16.5C17.4335 14.911 18 13.5217 18 12C18 8.68629 15.3137 6 12 6Z" stroke="currentColor" stroke-width="1.5"></path>
            <path d="M12 2V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
            <path d="M22 12L21 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
            <path d="M3 12L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
            <path d="M19.0708 4.92969L18.678 5.32252" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
            <path d="M5.32178 5.32227L4.92894 4.92943" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
          </svg>
        {:else}
          <!-- dark mode icon -->
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M2 12C2 6.47715 6.47715 2 12 2C12.4627 2 12.5392 2.69347 12.1432 2.93276C10.2594 4.07105 9 6.13845 9 8.5C9 12.0899 11.9101 15 15.5 15C17.8615 15 19.9289 13.7406 21.0672 11.8568C21.3065 11.4608 22 11.5373 22 12C22 13.1377 21.81 14.231 21.46 15.25H22C22.4142 15.25 22.75 15.5858 22.75 16C22.75 16.4142 22.4142 16.75 22 16.75H2C1.58579 16.75 1.25 16.4142 1.25 16C1.25 15.5858 1.58579 15.25 2 15.25H2.53998C2.18999 14.231 2 13.1377 2 12Z" fill="currentColor"></path>
            <path d="M5 18.25C4.58579 18.25 4.25 18.5858 4.25 19C4.25 19.4142 4.58579 19.75 5 19.75H19C19.4142 19.75 19.75 19.4142 19.75 19C19.75 18.5858 19.4142 18.25 19 18.25H5Z" fill="currentColor"></path>
            <path d="M8 21.25C7.58579 21.25 7.25 21.5858 7.25 22C7.25 22.4142 7.58579 22.75 8 22.75H16C16.4142 22.75 16.75 22.4142 16.75 22C16.75 21.5858 16.4142 21.25 16 21.25H8Z" fill="currentColor"></path>
            <path d="M19.9001 2.30719C19.7392 1.8976 19.1616 1.8976 19.0007 2.30719L18.5703 3.40247C18.5212 3.52752 18.4226 3.62651 18.298 3.67583L17.2067 4.1078C16.7986 4.26934 16.7986 4.849 17.2067 5.01054L18.298 5.44252C18.4226 5.49184 18.5212 5.59082 18.5703 5.71587L19.0007 6.81115C19.1616 7.22074 19.7392 7.22074 19.9001 6.81116L20.3305 5.71587C20.3796 5.59082 20.4782 5.49184 20.6028 5.44252L21.6941 5.01054C22.1022 4.849 22.1022 4.26934 21.6941 4.1078L20.6028 3.67583C20.4782 3.62651 20.3796 3.52752 20.3305 3.40247L19.9001 2.30719Z" fill="currentColor"></path>
            <path d="M16.0328 8.12967C15.8718 7.72009 15.2943 7.72009 15.1333 8.12967L14.9764 8.52902C14.9273 8.65407 14.8287 8.75305 14.7041 8.80237L14.3062 8.95987C13.8981 9.12141 13.8981 9.70107 14.3062 9.86261L14.7041 10.0201C14.8287 10.0694 14.9273 10.1684 14.9764 10.2935L15.1333 10.6928C15.2943 11.1024 15.8718 11.1024 16.0328 10.6928L16.1897 10.2935C16.2388 10.1684 16.3374 10.0694 16.462 10.0201L16.8599 9.86261C17.268 9.70107 17.268 9.12141 16.8599 8.95987L16.462 8.80237C16.3374 8.75305 16.2388 8.65407 16.1897 8.52902L16.0328 8.12967Z" fill="currentColor"></path>
          </svg>
        {/if}
      </button>
      <button class="btn primary" onclick={() => connect()} disabled={app.connected || !app.cfg?.address}>
        {app.connected ? "Pieslēgts" : "Pieslēgt MetaMask"}
      </button>
    </div>
  </div>
</header>

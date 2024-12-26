<script lang="ts">
  import viteLogo from "/vite.svg";
  import { actions } from "./starknet";

  // let points = $state(0);
  let gudTransaction = $state(false);
</script>

<main>
  <div>
    <div>
      <button onclick={actions.startGame}>Start Game</button>
      <button onclick={actions.guessShort}>Guess Short</button>
      <button onclick={actions.guessLong}>Guess Long</button>
      <button onclick={actions.resetGame}>Reset Game</button>
    </div>
  </div>
</main>

<!-- <style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style> -->

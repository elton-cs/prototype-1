<script lang="ts">
  import { RpcProvider, Contract, AccountInterface } from "starknet";
  import { onMount } from "svelte";
  import Controller, { type SessionPolicies } from "@cartridge/controller";

  const rpcUrl = "https://api.cartridge.gg/x/squares/katana";
  const providerKatanaDev = new RpcProvider({
    nodeUrl: rpcUrl,
  });

  const actionsContractAddr =
    "0x04c45dc7c2bdadba03d4ca3e5897c107427ed95f82a467d72c273c88dc48a21a";
  let mainContractClass: any;
  let mainContract: Contract;

  const policies: SessionPolicies = {
    contracts: {
      "0x04c45dc7c2bdadba03d4ca3e5897c107427ed95f82a467d72c273c88dc48a21a": {
        name: "Main",
        methods: [
          {
            name: "Start Game",
            entrypoint: "start_game",
          },
          {
            name: "End Game",
            entrypoint: "end_game",
          },
          {
            name: "Flip Square",
            entrypoint: "flip_square",
          },
          {
            name: "Get Game Updates",
            entrypoint: "get_game_updates",
          },
          {
            name: "Read List Lengths",
            entrypoint: "read_list_lengths",
          },
          {
            name: "Enter Square One",
            entrypoint: "enter_square_one",
          },
          {
            name: "Enter Square Two",
            entrypoint: "enter_square_two",
          },
          {
            name: "Exit Square",
            entrypoint: "exit_square",
          },
        ],
      },
    },
  };

  const controller = new Controller({
    rpc: rpcUrl,
    policies,
  });
  let connectedController: Controller | undefined = $state(undefined);
  let controllerUsername: string | undefined = $state(undefined);
  let executeAccount: AccountInterface | undefined = $state(undefined);
  let loading: boolean = $state(false);

  let myWalletAddress: string | undefined = $state(undefined);
  let myWalletAddressFelt: BigInt | undefined = $state(undefined);

  let transactionList: string[] = $state([]);
  // let updatedPoints: BigInt = $state(0n);
  // let previousPoints: BigInt = $state(0n);
  // let pointsAsUSD: string = $derived(
  //   (Number(updatedPoints) / 1000000).toFixed(2),
  // );
  // let priceDirection: "up" | "down" | null = $state(null);

  let updatedTick: BigInt = $state(0n);
  let previousTick: BigInt = $state(0n);

  let squareOneLength: BigInt = $state(0n);
  let squareTwoLength: BigInt = $state(0n);
  let bombaTick: BigInt = $state(0n);
  let playerSquare: BigInt = $state(0n);

  onMount(async () => {
    mainContractClass = await providerKatanaDev.getClassAt(actionsContractAddr);

    if (await controller.probe()) {
      // auto connect
      await connectController();
      if (executeAccount) {
        myWalletAddress = executeAccount.address;
        myWalletAddressFelt = BigInt(myWalletAddress);
      }
    }
    loading = false;

    // Set up interval for updating tick
    const interval = setInterval(() => {
      if (executeAccount && mainContract) {
        // void updateGameState();
      }
    }, 100);

    // Clean up interval when component unmounts
    // return () => clearInterval(interval);
  });

  // $effect(() => {
  //   if (transactionList.length > 0 && executeAccount && mainContract) {
  //     void updateTick();
  //   }
  // }, [transactionList]);

  // async function updatePoints() {
  //   if (executeAccount && mainContract) {
  //     const latestTx = transactionList[transactionList.length - 1];
  //     const tx = await providerKatanaDev.getTransaction(latestTx);
  //     previousPoints = updatedPoints;
  //     updatedPoints = await mainContract.get_points(executeAccount.address);

  //     // Set price direction for animation
  //     if (updatedPoints > previousPoints) {
  //       priceDirection = "up";
  //     } else if (updatedPoints < previousPoints) {
  //       priceDirection = "down";
  //     }

  //     // Reset direction after animation
  //     setTimeout(() => {
  //       priceDirection = null;
  //     }, 1000);
  //   }
  // }

  // async function updateTick() {
  //   if (executeAccount && mainContract) {
  //     const latestTx = transactionList[transactionList.length - 1];
  //     const tx = await providerKatanaDev.getTransaction(latestTx);
  //     previousTick = updatedTick;
  //     updatedTick = await mainContract.read_tick();
  //   }
  // }

  async function updateGameState() {
    if (executeAccount && mainContract && myWalletAddressFelt) {
      const myCall = mainContract.populate("get_game_updates", [
        myWalletAddressFelt,
      ]);
      let result = await mainContract.get_game_updates(myWalletAddress);
      console.log(result);
      squareOneLength = result[0];
      squareTwoLength = result[1];
      bombaTick = result[2];
      playerSquare = result[3];
    }
  }

  // All functions
  async function connectController() {
    try {
      const res = await controller.connect();
      if (res) {
        connectedController = controller;
        executeAccount = controller.account;
        controllerUsername = await controller.username();
        mainContract = new Contract(
          mainContractClass.abi,
          actionsContractAddr,
          executeAccount,
        );
        if (executeAccount) {
          mainContract.connect(executeAccount);
          myWalletAddress = executeAccount.address;
          updatedTick = await mainContract.read_tick();
          previousTick = updatedTick;
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  function disconnectController() {
    controller.disconnect();
    connectedController = undefined;
    controllerUsername = undefined;
  }

  async function startGame() {
    if (!executeAccount) return;
    try {
      const result = await executeAccount.execute([
        {
          contractAddress: actionsContractAddr,
          entrypoint: "start_game",
          calldata: [],
        },
      ]);
      transactionList.push(result.transaction_hash);
    } catch (e) {
      console.log(e);
    }
  }

  async function endGame() {
    if (!executeAccount) return;
    try {
      const result = await executeAccount.execute([
        {
          contractAddress: actionsContractAddr,
          entrypoint: "end_game",
          calldata: [],
        },
      ]);
      transactionList.push(result.transaction_hash);
    } catch (e) {
      console.log(e);
    }
  }

  async function flipSquare() {
    if (!executeAccount) return;
    try {
      const result = await executeAccount.execute([
        {
          contractAddress: actionsContractAddr,
          entrypoint: "flip_square",
          calldata: [],
        },
      ]);
      transactionList.push(result.transaction_hash);
    } catch (e) {
      console.log(e);
    }
  }

  // async function executeStartGame() {
  //   if (!executeAccount) return;
  //   try {
  //     const result = await executeAccount.execute([
  //       {
  //         contractAddress: actionsContractAddr,
  //         entrypoint: "start_game",
  //         calldata: [],
  //       },
  //     ]);
  //     transactionList.push(result.transaction_hash);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // async function enterSquareOne() {
  //   if (!executeAccount) return;
  //   try {
  //     const result = await executeAccount.execute([
  //       {
  //         contractAddress: actionsContractAddr,
  //         entrypoint: "enter_square_one",
  //         calldata: [],
  //       },
  //     ]);
  //     transactionList.push(result.transaction_hash);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // async function enterSquareTwo() {
  //   if (!executeAccount) return;
  //   try {
  //     const result = await executeAccount.execute([
  //       {
  //         contractAddress: actionsContractAddr,
  //         entrypoint: "enter_square_two",
  //         calldata: [],
  //       },
  //     ]);
  //     transactionList.push(result.transaction_hash);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // async function exitSquare() {
  //   if (!executeAccount) return;
  //   try {
  //     const result = await executeAccount.execute([
  //       {
  //         contractAddress: actionsContractAddr,
  //         entrypoint: "exit_square",
  //         calldata: [],
  //       },
  //     ]);
  //     transactionList.push(result.transaction_hash);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // async function executeStartGame() {
  //   if (!executeAccount) return;
  //   try {
  //     const result = await executeAccount.execute([
  //       {
  //         contractAddress: actionsContractAddr,
  //         entrypoint: "start_game",
  //         calldata: [],
  //       },
  //     ]);
  //     transactionList.push(result.transaction_hash);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // async function executeGamble(guess: boolean) {
  //   if (!executeAccount) return;
  //   try {
  //     const result = await executeAccount.execute([
  //       {
  //         contractAddress: actionsContractAddr,
  //         entrypoint: "gamble",
  //         calldata: [guess],
  //       },
  //     ]);
  //     transactionList.push(result.transaction_hash);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // async function executeResetGame() {
  //   if (!executeAccount) return;
  //   try {
  //     const result = await executeAccount.execute([
  //       {
  //         contractAddress: actionsContractAddr,
  //         entrypoint: "reset_game",
  //         calldata: [],
  //       },
  //     ]);
  //     transactionList.push(result.transaction_hash);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }
</script>

<main>
  <div class="container">
    <div class="connect-wrapper">
      {#if !connectedController}
        <button class="connect-btn" onclick={connectController}>Connect</button>
      {:else}
        <button class="connect-btn" onclick={disconnectController}>
          Disconnect ({controllerUsername})
        </button>
        <div class="wallet-address">
          {myWalletAddress
            ? myWalletAddress.slice(0, 6) + "..." + myWalletAddress.slice(-4)
            : ""}
        </div>
      {/if}
    </div>

    <div class="game-controls">
      <!-- <button onclick={executeStartGame}>Start Game</button> -->
      <button onclick={flipSquare}>Flip Square</button>
    </div>
    <div class="game-controls">
      <button onclick={startGame}>Start Game</button>
      <button onclick={endGame}>End Game</button>

      <button onclick={updateGameState}>Update Game State</button>
    </div>

    <p class="tick-display">Bomba Tick: {bombaTick}</p>
    <p class="tick-display">Square One Length: {squareOneLength}</p>
    <p class="tick-display">Square Two Length: {squareTwoLength}</p>
    <p class="tick-display">Player Square: {playerSquare}</p>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
  }

  .container {
    width: 100vw;
    height: 100vh;
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
    position: relative;
  }

  .connect-wrapper {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .game-controls {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 5rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: none;
    background: #3b82f6;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover {
    background: #2563eb;
  }

  .tick-display {
    text-align: center;
    margin-top: 2rem;
    font-size: 1.2rem;
  }

  .wallet-address {
    color: #666;
    font-size: 0.875rem;
    font-family: monospace;
  }

  @media (max-width: 640px) {
    .game-controls {
      flex-direction: column;
      align-items: stretch;
      margin-top: 4rem;
    }

    button {
      width: 100%;
    }

    .connect-wrapper {
      width: calc(100% - 2rem);
      position: fixed;
      top: 1rem;
    }

    .connect-btn {
      width: 100%;
    }
  }
</style>

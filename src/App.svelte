<script lang="ts">
  import { RpcProvider, Contract, AccountInterface } from "starknet";
  import { onMount } from "svelte";
  import Controller, { type SessionPolicies } from "@cartridge/controller";
  import { fade, fly } from "svelte/transition";
  import { spring } from "svelte/motion";

  const rpcUrl = "https://api.cartridge.gg/x/tenpercent/katana";
  const providerKatanaDev = new RpcProvider({
    nodeUrl: rpcUrl,
  });

  const mainContractAddr =
    "0x5fe3cd9b8a92c16fee81e08579cc87c1328aa9a375b7d1f472ee183af4e12b8";
  let mainContractClass: any;
  let mainContract: Contract;

  const policies: SessionPolicies = {
    contracts: {
      "0x5fe3cd9b8a92c16fee81e08579cc87c1328aa9a375b7d1f472ee183af4e12b8": {
        name: "Main",
        methods: [
          {
            name: "Start Game",
            entrypoint: "start_game",
          },
          {
            name: "Gamble",
            entrypoint: "gamble",
          },
          {
            name: "Reset Game",
            entrypoint: "reset_game",
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

  let transactionList: string[] = $state([]);
  let updatedPoints: BigInt = $state(0n);
  let previousPoints: BigInt = $state(0n);
  let pointsAsUSD: string = $derived(
    (Number(updatedPoints) / 1000000).toFixed(2),
  );
  let priceDirection: "up" | "down" | null = $state(null);

  onMount(async () => {
    mainContractClass = await providerKatanaDev.getClassAt(mainContractAddr);

    if (await controller.probe()) {
      // auto connect
      await connectController();
    }
    loading = false;
  });

  $effect(() => {
    if (transactionList.length > 0 && executeAccount && mainContract) {
      void updatePoints();
    }
  });

  async function updatePoints() {
    if (executeAccount && mainContract) {
      const latestTx = transactionList[transactionList.length - 1];
      const tx = await providerKatanaDev.getTransaction(latestTx);
      previousPoints = updatedPoints;
      updatedPoints = await mainContract.get_points(executeAccount.address);

      // Set price direction for animation
      if (updatedPoints > previousPoints) {
        priceDirection = "up";
      } else if (updatedPoints < previousPoints) {
        priceDirection = "down";
      }

      // Reset direction after animation
      setTimeout(() => {
        priceDirection = null;
      }, 1000);
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
          mainContractAddr,
          executeAccount,
        );
        if (executeAccount) {
          mainContract.connect(executeAccount);
          updatedPoints = await mainContract.get_points(executeAccount.address);
          previousPoints = updatedPoints;
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

  async function executeStartGame() {
    if (!executeAccount) return;
    try {
      const result = await executeAccount.execute([
        {
          contractAddress: mainContractAddr,
          entrypoint: "start_game",
          calldata: [],
        },
      ]);
      transactionList.push(result.transaction_hash);
    } catch (e) {
      console.log(e);
    }
  }

  async function executeGamble(guess: boolean) {
    if (!executeAccount) return;
    try {
      const result = await executeAccount.execute([
        {
          contractAddress: mainContractAddr,
          entrypoint: "gamble",
          calldata: [guess],
        },
      ]);
      transactionList.push(result.transaction_hash);
    } catch (e) {
      console.log(e);
    }
  }

  async function executeResetGame() {
    if (!executeAccount) return;
    try {
      const result = await executeAccount.execute([
        {
          contractAddress: mainContractAddr,
          entrypoint: "reset_game",
          calldata: [],
        },
      ]);
      transactionList.push(result.transaction_hash);
    } catch (e) {
      console.log(e);
    }
  }
</script>

<main>
  <div class="trading-platform">
    <nav class="header">
      {#if loading}
        <div class="loading">
          <span class="loader"></span>
          <p>Loading casino...</p>
        </div>
      {:else if connectedController}
        <div class="user-info">
          <span class="welcome"
            >🎰 Welcome High Roller, {controllerUsername}</span
          >
          <button class="disconnect-btn" onclick={disconnectController}>
            <i class="fas fa-sign-out-alt"></i>
            Disconnect
          </button>
        </div>
      {:else}
        <button class="connect-btn" onclick={connectController}>
          <i class="fas fa-coins"></i>
          Buy In
        </button>
      {/if}
    </nav>

    {#if connectedController}
      <div class="trading-container">
        <div class="account-info">
          <div class="balance-card">
            <h1
              class="balance"
              class:up={priceDirection === "up"}
              class:down={priceDirection === "down"}
            >
              {pointsAsUSD} <span class="currency">$FAKE</span>
            </h1>
          </div>

          <div class="controls">
            <button class="control-btn start" onclick={executeStartGame}>
              <i class="fas fa-dice"></i>
              New Game
            </button>
            <button class="control-btn reset" onclick={executeResetGame}>
              <i class="fas fa-redo"></i>
              Reset Game
            </button>
          </div>
        </div>

        <div class="trading-actions">
          <button class="trade-btn short" onclick={() => executeGamble(false)}>
            <i class="fas fa-arrow-down"></i>
            Short
          </button>
          <button class="trade-btn long" onclick={() => executeGamble(true)}>
            <i class="fas fa-arrow-up"></i>
            Long
          </button>
        </div>
      </div>

      <style>
        .trading-platform {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(145deg, #2d1f3d, #1a1a1a);
          border-radius: 12px;
          color: #fff;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .header {
          padding: 1rem;
          border-bottom: 1px solid #4a3664;
          margin-bottom: 2rem;
        }

        .loading {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .loader {
          width: 20px;
          height: 20px;
          border: 3px solid #4a3664;
          border-top: 3px solid #ffd700;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .user-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .welcome {
          font-size: 1.2rem;
          color: #ffd700;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        .connect-btn,
        .disconnect-btn {
          background: linear-gradient(145deg, #4a3664, #2d1f3d);
          color: #fff;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .connect-btn:hover {
          background: linear-gradient(145deg, #ffd700, #ffb700);
          color: #1a1a1a;
          transform: translateY(-2px);
        }

        .disconnect-btn:hover {
          background: linear-gradient(145deg, #ff4444, #cc0000);
          transform: translateY(-2px);
        }

        .trading-container {
          padding: 2rem;
        }

        .balance-card {
          background: linear-gradient(145deg, #4a3664, #2d1f3d);
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .label {
          color: #ffd700;
          font-size: 0.9rem;
        }

        .balance {
          font-size: 3rem;
          margin: 1rem 0;
          color: #ffd700;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
          transition: all 0.3s ease;
        }

        .balance.up {
          color: #00ff88;
          transform: scale(1.05);
          animation: pulse-green 1s ease;
        }

        .balance.down {
          color: #ff4444;
          transform: scale(0.95);
          animation: pulse-red 1s ease;
        }

        .currency {
          font-size: 1.5rem;
          color: #888;
        }

        .controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .control-btn {
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s;
        }

        .start {
          background: linear-gradient(145deg, #ffd700, #ffb700);
          color: #1a1a1a;
        }

        .reset {
          background: linear-gradient(145deg, #4a3664, #2d1f3d);
          color: #fff;
        }

        .trading-actions {
          display: flex;
          gap: 2rem;
          justify-content: center;
        }

        .trade-btn {
          padding: 1.5rem 3rem;
          border: none;
          border-radius: 8px;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          width: 250px;
          position: relative;
          overflow: hidden;
        }

        .short {
          background: linear-gradient(145deg, #ff4444, #cc0000);
          color: #fff;
        }

        .long {
          background: linear-gradient(145deg, #00ff88, #00cc66);
          color: #1a1a1a;
        }

        .trade-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .trade-btn:active {
          transform: translateY(-2px);
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse-green {
          0% {
            text-shadow: 0 0 10px rgba(0, 255, 136, 0);
          }
          50% {
            text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
          }
          100% {
            text-shadow: 0 0 10px rgba(0, 255, 136, 0);
          }
        }

        @keyframes pulse-red {
          0% {
            text-shadow: 0 0 10px rgba(255, 68, 68, 0);
          }
          50% {
            text-shadow: 0 0 20px rgba(255, 68, 68, 0.5);
          }
          100% {
            text-shadow: 0 0 10px rgba(255, 68, 68, 0);
          }
        }
      </style>
    {/if}
  </div>
</main>

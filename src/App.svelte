<script lang="ts">
  import { RpcProvider, Contract, AccountInterface } from "starknet";
  import { onMount } from "svelte";
  import Controller, { type SessionPolicies } from "@cartridge/controller";

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
  let pointsAsUSD: string = $derived(
    (Number(updatedPoints) / 1000000).toFixed(2),
  );

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
      updatedPoints = await mainContract.get_points(executeAccount.address);
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
          <p>Loading platform...</p>
        </div>
      {:else if connectedController}
        <div class="user-info">
          <span class="welcome">Welcome, {controllerUsername}</span>
          <button class="disconnect-btn" onclick={disconnectController}>
            <i class="fas fa-sign-out-alt"></i>
            Disconnect
          </button>
        </div>
      {:else}
        <button class="connect-btn" onclick={connectController}>
          <i class="fas fa-wallet"></i>
          Connect Wallet
        </button>
      {/if}
    </nav>

    {#if connectedController}
      <div class="trading-container">
        <div class="account-info">
          <div class="balance-card">
            <span class="label">Available Balance</span>
            <h1 class="balance">
              {pointsAsUSD} <span class="currency">$FAKE</span>
            </h1>
          </div>

          <div class="controls">
            <button class="control-btn start" onclick={executeStartGame}>
              <i class="fas fa-play"></i>
              Start Trading
            </button>
            <button class="control-btn reset" onclick={executeResetGame}>
              <i class="fas fa-redo"></i>
              Reset
            </button>
          </div>
        </div>

        <div class="trading-actions">
          <button class="trade-btn short" onclick={() => executeGamble(false)}>
            <i class="fas fa-arrow-down"></i>
            Short Position
          </button>
          <button class="trade-btn long" onclick={() => executeGamble(true)}>
            <i class="fas fa-arrow-up"></i>
            Long Position
          </button>
        </div>
      </div>

      <style>
        .trading-platform {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background: #1a1a1a;
          border-radius: 12px;
          color: #fff;
        }

        .header {
          padding: 1rem;
          border-bottom: 1px solid #333;
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
          border: 3px solid #333;
          border-top: 3px solid #fff;
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
          color: #00ff88;
        }

        .connect-btn,
        .disconnect-btn {
          background: #2d2d2d;
          color: #fff;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .connect-btn:hover {
          background: #00ff88;
          color: #1a1a1a;
        }

        .disconnect-btn:hover {
          background: #ff4444;
        }

        .trading-container {
          padding: 2rem;
        }

        .balance-card {
          background: #2d2d2d;
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .label {
          color: #888;
          font-size: 0.9rem;
        }

        .balance {
          font-size: 3rem;
          margin: 1rem 0;
          color: #00ff88;
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
          transition: all 0.2s;
        }

        .start {
          background: #00ff88;
          color: #1a1a1a;
        }

        .reset {
          background: #2d2d2d;
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
          transition: all 0.2s;
          width: 250px;
        }

        .short {
          background: #ff4444;
          color: #fff;
        }

        .long {
          background: #00ff88;
          color: #1a1a1a;
        }

        .trade-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      </style>
    {/if}
  </div>
</main>

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
  <div>
    <div>
      {#if loading}
        <p>Loading</p>
      {:else if connectedController}
        <p>Welcome back {controllerUsername}!</p>
        <button onclick={disconnectController}>Disconnect</button>
      {:else}
        <button onclick={connectController}>Connect</button>
      {/if}
    </div>
    {#if connectedController}
      <p></p>
      <div>
        <button onclick={executeStartGame}>Start Game</button>
        <button onclick={executeResetGame}>Reset Game</button>
      </div>
      <h1>{pointsAsUSD} $FAKE</h1>
      <div>
        <button onclick={() => executeGamble(false)}>Guess Short</button>
        <button onclick={() => executeGamble(true)}>Guess Long</button>
      </div>
    {/if}
  </div>
</main>

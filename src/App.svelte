<script lang="ts">
  import {
    Account,
    RpcProvider,
    Contract,
    json,
    type BigNumberish,
    type Uint256,
    cairo,
  } from "starknet";
  import { onMount } from "svelte";
  import Controller from "@cartridge/controller";

  const rpcUrl = "https://api.cartridge.gg/x/tenpercent/katana";

  const providerKatanaDev = new RpcProvider({
    nodeUrl: rpcUrl,
  });

  const userPK1 =
    "0x3e3979c1ed728490308054fe357a9f49cf67f80f9721f44cc57235129e090f4";
  const userAddr1 =
    "0x6677fe62ee39c7b07401f754138502bab7fac99d2d3c5d37df7d1c6fab10819";
  const acc1 = new Account(providerKatanaDev, userAddr1, userPK1);

  // const userPK2 =
  //   "0x1c9053c053edf324aec366a34c6901b1095b07af69495bffec7d7fe21effb1b";
  // const userAddr2 =
  //   "0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7";
  // const acc2 = new Account(providerKatanaDev, userAddr2, userPK2);

  const controller = new Controller({ rpc: rpcUrl });
  let controllerUsername: string | undefined = $state(undefined);
  let controllerAccount: Controller | undefined = $state(undefined);
  let loading: boolean = $state(false);

  let updatedPoints: BigInt = $state(0n);

  const mainContractAddr =
    "0x5fe3cd9b8a92c16fee81e08579cc87c1328aa9a375b7d1f472ee183af4e12b8";
  let mainContractClass: any;
  let mainContract: Contract;

  onMount(async () => {
    mainContractClass = await providerKatanaDev.getClassAt(mainContractAddr);
    mainContract = new Contract(mainContractClass.abi, mainContractAddr, acc1);
    mainContract.connect(acc1);
    const connectedAddress = acc1.address;
    console.log(`Account ${connectedAddress}: Connected to main contract`);
    updatedPoints = await mainContract.get_points(connectedAddress);

    if (await controller.probe()) {
      // auto connect
      await connectController();
    }
    loading = false;
  });

  let pointsAsUSD: string = $derived(
    (Number(updatedPoints) / 1000000).toFixed(2),
  );

  async function connectController() {
    try {
      const res = await controller.connect();
      if (res) {
        controllerAccount = controller;
        controllerUsername = await controller.username();
      }
    } catch (e) {
      console.log(e);
    }
  }

  function disconnectController() {
    controller.disconnect();
    controllerAccount = undefined;
    controllerUsername = undefined;
  }

  async function startGame() {
    const t1 = await mainContract.start_game();
    await providerKatanaDev.waitForTransaction(t1.transaction_hash);
    const updated_points: bigint = await mainContract.get_points(acc1.address);
    updatedPoints = updated_points;
  }

  async function guessShort() {
    const t1 = await mainContract.gamble(false);
    const updated_points: BigInt = await mainContract.get_points(acc1.address);
    updatedPoints = updated_points;
  }

  async function guessLong() {
    const t1 = await mainContract.gamble(true);
    const updated_points: BigInt = await mainContract.get_points(acc1.address);
    updatedPoints = updated_points;
  }

  async function resetGame() {
    const t1 = await mainContract.reset_game();
    await providerKatanaDev.waitForTransaction(t1.transaction_hash);
    const updated_points: bigint = await mainContract.get_points(acc1.address);
    updatedPoints = updated_points;
  }
</script>

<main>
  <div>
    <div>
      {#if loading}
        <p>Loading</p>
      {:else if controllerAccount}
        <p>Welcome back {controllerUsername}!</p>
        <button onclick={disconnectController}>Disconnect</button>
      {:else}
        <button onclick={connectController}>Connect</button>
      {/if}
    </div>
    <h1>{pointsAsUSD} $FAKE</h1>
    <div>
      <button onclick={startGame}>Start Game</button>
      <button onclick={guessShort}>Guess Short</button>
      <button onclick={guessLong}>Guess Long</button>
      <button onclick={resetGame}>Reset Game</button>
    </div>
  </div>
</main>

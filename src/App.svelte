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

  const providerKatanaDev = new RpcProvider({
    nodeUrl: "https://api.cartridge.gg/x/tenpercent/katana",
  });

  const privateKey =
    "0x3e3979c1ed728490308054fe357a9f49cf67f80f9721f44cc57235129e090f4";
  const accountAddress =
    "0x6677fe62ee39c7b07401f754138502bab7fac99d2d3c5d37df7d1c6fab10819";
  const account = new Account(providerKatanaDev, accountAddress, privateKey);

  const wallet2privateKey =
    "0x1c9053c053edf324aec366a34c6901b1095b07af69495bffec7d7fe21effb1b";
  const wallet2address =
    "0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7";
  const account2 = new Account(
    providerKatanaDev,
    wallet2address,
    wallet2privateKey,
  );

  const addressMainContract =
    "0x5fe3cd9b8a92c16fee81e08579cc87c1328aa9a375b7d1f472ee183af4e12b8";
  // const compiledMainContract = compiledContract;

  let mainContractClass: any;
  let mainContract: Contract;
  onMount(async () => {
    mainContractClass = await providerKatanaDev.getClassAt(addressMainContract);
    mainContract = new Contract(
      mainContractClass.abi,
      addressMainContract,
      account,
    );
    mainContract.connect(account);
    console.log("Account connected to contract");
  });

  let updatedPoints: BigInt = $state(0n);

  async function startGame() {
    const t1 = await mainContract.start_game();
    const t1hash = await providerKatanaDev.waitForTransaction(
      t1.transaction_hash,
    );
    const updated_points: bigint =
      await mainContract.get_points(accountAddress);
    console.log(t1, t1hash, updated_points);
  }

  async function guessShort() {
    const t1 = await mainContract.gamble(false);
    const t1hash = await providerKatanaDev.waitForTransaction(
      t1.transaction_hash,
    );
    const updated_points: BigInt =
      await mainContract.get_points(accountAddress);
    console.log(t1, t1hash, updated_points);
  }

  async function guessLong() {
    const t1 = await mainContract.gamble(true);
    const t1hash = await providerKatanaDev.waitForTransaction(
      t1.transaction_hash,
    );
    const updated_points: BigInt =
      await mainContract.get_points(accountAddress);
    console.log(t1, t1hash, updated_points);
  }

  async function resetGame() {
    const t1 = await mainContract.reset_game();
    const t1hash = await providerKatanaDev.waitForTransaction(
      t1.transaction_hash,
    );
    const updated_points: bigint =
      await mainContract.get_points(accountAddress);
    console.log(t1, t1hash, updated_points);
  }
</script>

<main>
  <div>
    <h1>Points: {updatedPoints}</h1>
    <div>
      <button onclick={startGame}>Start Game</button>
      <button onclick={guessShort}>Guess Short</button>
      <button onclick={guessLong}>Guess Long</button>
      <button onclick={resetGame}>Reset Game</button>
    </div>
  </div>
</main>

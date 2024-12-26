import { Account, RpcProvider, Contract, json, type BigNumberish } from 'starknet';
import { compiledContract } from './compiled_contract';

const privateKey = '0x3e3979c1ed728490308054fe357a9f49cf67f80f9721f44cc57235129e090f4';
const accountAddress = '0x6677fe62ee39c7b07401f754138502bab7fac99d2d3c5d37df7d1c6fab10819';

const providerKatanaDev = new RpcProvider({
    nodeUrl: 'https://api.cartridge.gg/x/tenpercent/katana'
});
const account = new Account(providerKatanaDev, accountAddress, privateKey);

const addressMainContract = '0x5fe3cd9b8a92c16fee81e08579cc87c1328aa9a375b7d1f472ee183af4e12b8';
const compiledMainContract = compiledContract;
const mainContract = new Contract(compiledMainContract.abi, addressMainContract, account);
mainContract.connect(account);

export const actions = {
    startGame: async () => {
        try {
            const t1 = await mainContract.start_game();
            const t1hash = await providerKatanaDev.waitForTransaction(t1.transaction_hash);
            console.log(t1, t1hash);
            return {
                success: true,
                transaction: {
                    transaction: t1,
                    hash: t1hash
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error
            };
        }
    },
    guessShort: async () => {
        try {
            const t1 = await mainContract.gamble(false);
            const t1hash = await providerKatanaDev.waitForTransaction(t1.transaction_hash);
            console.log(t1, t1hash);
            return {
                success: true,
                transaction: {
                    transaction: t1,
                    hash: t1hash
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error
            };
        }
    },
    guessLong: async () => {
        try {

            const t1 = await mainContract.gamble(true);
            const t1hash = await providerKatanaDev.waitForTransaction(t1.transaction_hash);
            console.log(t1, t1hash);
            return {
                success: true,
                transaction: {
                    transaction: t1,
                    hash: t1hash
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error
            };
        }
    },
    resetGame: async () => {
        try {
            const t1 = await mainContract.reset_game();
            const t1hash = await providerKatanaDev.waitForTransaction(t1.transaction_hash);
            console.log(t1, t1hash);
            return {
                success: true,
                transaction: {
                    transaction: t1,
                    hash: t1hash
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error
            };
        }
    },
}
import SDK_NODE from "weavedb-sdk-node"
import { Contract, ethers } from "ethers"
import abi from "@/lib/NFT.json"

const contractTxId = process.env.NEXT_PUBLIC_WEAVEDB_CONTRACT_TX_ID

export default async (req, res) => {
  try {
    const { params, nftContractAddr, chainId } = JSON.parse(req.body)
    const signerAddress = params?.query[0]?.user_address

    const provider = new ethers.JsonRpcProvider(
      chainId === 80001
        ? process.env.MUMBAI_RPC_URL
        : chainId === 137
        ? process.env.MATIC_RPC_URL
        : chainId === 1
        ? process.env.ETH_RPC_URL
        : process.env.ETH_RPC_URL
    )

    const address = ethers.getAddress(signerAddress)
    const nftBalance = await new Contract(
      nftContractAddr,
      abi,
      provider
    ).balanceOf(address)

    const sdk = new SDK_NODE({
      contractTxId: contractTxId,
    })
    await sdk.initializeWithoutWallet()

    const _nftBalance = Number(nftBalance)
    const tx = await sdk.relay(params.jobID, params, _nftBalance, {
      jobID: params.jobID,
      privateKey: process.env.RELAYER_PRIVATEKEY,
    })

    if (tx.error) {
      res
        .status(200)
        .json({ success: false, error: tx.error, nftBalance: _nftBalance })
    }
    res.status(200).json({ success: true, tx: tx, nftBalance: _nftBalance })
  } catch (e) {
    res.status(200).json({ success: false, error: e })
  }
}

const { ethers } = require("ethers");
const db = require("../models/index.js");
const TradingInfo = db.tradnigInfos;
const WalletTable = db.wallets;

module.exports = {
  async startTrading(req, res) {
    try {
      const { token, buyAmount, sellAmount, frequency, walletId, status, slippage } = req.body;

      const staredTrading = await TradingInfo.findAll({
        where: {
          status: true
        }
      });

      if (staredTrading.length !== 0) {
        return res.status(401).json({ message: 'Trading already started', error: 'Trading already started', staredTrading: staredTrading });
      }

      await WalletTable.update({ active: false }, {
        where: {
          active: true
        }
      });
      await WalletTable.update({ active: true }, {
        where: {
          id: walletId
        }
      });



      const newTradingInfo = {
        token: token,
        buyAmount: buyAmount,
        sellAmount: sellAmount,
        frequency: frequency,
        slippage: slippage,
        walletId: walletId,
        status: status
      }

      await TradingInfo.create(newTradingInfo);

      const currentTrading = await TradingInfo.findOne({
        where: {
          status: true
        }
      })

      res.status(200).json({ message: 'Trading Started!', currentTrading: currentTrading });
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': error });
    }
  },
  async getTradingStatus(req, res) {
    try {
      const staredTrading = await TradingInfo.findOne({
        order: [['createdAt', 'DESC']], // Replace 'createdAt' with your desired column
      });

      if (staredTrading === null) {
        res.status(300).json({ message: 'Started trading does not exist', currentTrading: staredTrading });
        return
      }

      const wallet = await WalletTable.findOne(
        {
          where: {
            id: parseInt(staredTrading.walletId)
          }
        });
      const walletAddress = (wallet.address).replace(/^"|"$/g, '');
      
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_ENDPOINT);
      const wei = await provider.getBalance(walletAddress);
      const eth = ethers.utils.formatEther(wei);

      res.status(200).json({ message: 'Trading Started!', currentTrading: staredTrading, selectedWallet: btoa(JSON.stringify(wallet)), balance: eth });
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': error });
    }
  },
  async stopTrading(req, res) {
    try {
      await TradingInfo.update({ status: false }, {
        where: {
          status: true
        }
      });

      const latestInfo = await TradingInfo.findOne(
        {
          order: [['createdAt', 'DESC']],
        }
      )

      res.status(200).json({ message: 'Trading Stopd!', latestInfo: latestInfo });
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': error });
    }
  },
}
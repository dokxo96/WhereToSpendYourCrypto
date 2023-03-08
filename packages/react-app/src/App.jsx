import { Button, Col, Menu, Row } from "antd";
import "./dist/output.css";
import "antd/dist/antd.css";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  // useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch, useLocation } from "react-router-dom";

import {
  Account,
  Contract,
  Faucet,
  GasGauge,
  Header,
  Ramp,
  ThemeSwitch,
  NetworkDisplay,
  FaucetHint,
  NetworkSwitch,
} from "./components";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
import { getRPCPollTime, Transactor, Web3ModalSetup } from "./helpers";
import { useStaticJsonRPC, useGasPrice } from "./hooks";
import MapView from "./components/map.component";
import axios from "axios";

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Alchemy.com & Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const initialNetwork = NETWORKS._AuroraTestnet; // <------- select your target frontend network (localhost, goerli, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = true; // toggle burner wallet feature
const USE_NETWORK_SELECTOR = false;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];
export const pinJSONToIPFS = async JSONBody => {
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
  return axios
    .post(url, JSONBody, {
      headers: {
        pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
        pinata_secret_api_key: process.env.REACT_APP_PINATA_API_SECRET,
      },
    })
    .then(function (response) {
      console.log("🪲 ~ file: form.createbusiness.jsx:14 ~ response:", response);
      return {
        success: true,
        pinataUrl: response.data.IpfsHash,
        //    pinataUrl: "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash
      };
    })
    .catch(function (error) {
      console.log("🪲 ~ file: form.createbusiness.jsx:22 ~ pinJSONToIPFS ~ error:", error);
      console.log(error);
      return {
        success: false,
        message: error.message,
      };
    });
};
function App(props) {
  // specify all the chains your app is available on. Eg: ['localhost', 'mainnet', ...otherNetworks ]
  // reference './constants.js' for other networks
  const networkOptions = [initialNetwork.name, "mainnet", "goerli"];

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const [tx, setTx] = useState({});

  const location = useLocation();

  const targetNetwork = NETWORKS[selectedNetwork];

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);

  const mainnetProvider = useStaticJsonRPC(providers, localProvider);

  // Sensible pollTimes depending on the provider you are using
  const localProviderPollingTime = getRPCPollTime(localProvider);
  const mainnetProviderPollingTime = getRPCPollTime(mainnetProvider);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider, mainnetProviderPollingTime);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "FastGasPrice", localProviderPollingTime);
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider, USE_BURNER_WALLET);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;
  console.log("🪲 ~ file: App.jsx:162 ~ App ~ selectedChainId:", selectedChainId);

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  //const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address, localProviderPollingTime);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address, mainnetProviderPollingTime);

  // const contractConfig = useContractConfig();

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  // useOnBlock(mainnetProvider, () => {
  //   console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  // });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(
    mainnetContracts,
    "DAI",
    "balanceOf",
    ["0x34aA3F359A9D614239015126635CE7732c18fDF3"],
    mainnetProviderPollingTime,
  );

  // keep track of a variable from the contract in the local React state:
  //const purpose = useContractReader(readContracts, "YourContract", "purpose", [], localProviderPollingTime);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:", addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
    localChainId,
    myMainnetDAIBalance,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    //const provider = await web3Modal.connect();
    const provider = await web3Modal.requestProvider();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
    //automatically connect if it is a safe app
    const checkSafeApp = async () => {
      if (await web3Modal.isSafeApp()) {
        loadWeb3Modal();
      }
    };
    checkSafeApp();
  }, [loadWeb3Modal]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;
  const [_form, set_form] = useState({
    b_name: "",
    b_description: "",
    b_latitude: "",
    b_longitude: "",
    b_status: "Active",
    b_pinata_url: "",
  });

  const createJson = async () => {
    let business_info = {
      id: 0,
      description: _form.b_description,
      latitude: _form.b_latitude,
      longitude: -_form.b_longitude,
      status: true,
    };

    var data = JSON.stringify({
      pinataOptions: {
        cidVersion: 1,
      },
      pinataMetadata: {
        name: _form.name,
        keyvalues: {
          customKey: "customValue",
        },
      },
      pinataContent: {
        business_info: business_info,
      },
    });

    let retu = await pinJSONToIPFS(data);
    console.log("🪲 ~ file: form.createbusiness.jsx:94 ~ createJson ~ retu:", retu);

    set_form({ ..._form, b_pinata_url: retu.pinataUrl });

    let Coincontract = contractConfig.deployedContracts[selectedChainId][0].contracts.WTSYC;
    console.log("🪲 ~ file: App.jsx:331 ~ createJson ~ Coincontract:", Coincontract);

    // // * Get the current provider
    let provider = new ethers.providers.Web3Provider(window.ethereum);
    // // * Create a new instance of the contract from the ABI,address and the provider
    let cointossContract = new ethers.Contract(Coincontract.address, Coincontract.abi, provider);
    // // * get the current signer
    let signer = provider.getSigner();
    // // * connect the contract and the signer
    let cointossContractWithSigner = cointossContract.connect(signer);
    // // * use the instance connected with the signer to call the wager method.
    // /**
    //  * @param wagetInputs.face : is the value for coin(1) or tail(0)
    //  * @param wagetInputs.tokenAddress : is the token's address
    //  * @param wagetInputs.tokenAmount: is the amount for the bet
    //  * */
    console.log("calling the mint method", await signer.getAddress());

    let res = await cointossContractWithSigner
      .CreateBusiness(await signer.getAddress(), retu.pinataUrl, {
        value: 0,
        gasLimit: 2e7,
      })
      .then(response => {
        console.log("🪲 ~ file: App.jsx:172 ~ PlayWager ~ response", response);
      })
      .catch(error => {
        console.log("Oh, no! We encountered an error: ", error);
      });
  };

  const CreateBusinessmet = async uri => {
    // * recover the ABI from the JSON
    let Coincontract = contractConfig.deployedContracts[selectedChainId].AuroraTestnet.contracts["WTSYC"];
    // // * Get the current provider
    let provider = new ethers.providers.Web3Provider(window.ethereum);
    // // * Create a new instance of the contract from the ABI,address and the provider
    let cointossContract = new ethers.Contract(Coincontract.address, Coincontract.abi, provider);
    // // * get the current signer
    let signer = provider.getSigner();
    // // * connect the contract and the signer
    let cointossContractWithSigner = cointossContract.connect(signer);
    // // * use the instance connected with the signer to call the wager method.
    // /**
    //  * @param wagetInputs.face : is the value for coin(1) or tail(0)
    //  * @param wagetInputs.tokenAddress : is the token's address
    //  * @param wagetInputs.tokenAmount: is the amount for the bet
    //  * */
    let res = await cointossContractWithSigner
      .CreateBusiness(signer.getAddress, uri, {
        value: 0,
        gasLimit: 2e7,
      })
      .then(response => {
        console.log("🪲 ~ file: App.jsx:172 ~ PlayWager ~ response", response);

        setTx(response.hash);
      })
      .catch(error => {
        console.log("Oh, no! We encountered an error: ", error);
      });

    // console.log("🪲 ~ file: App.jsx:168 ~ result ~ Account:", address);
  };
  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header>
        {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flex: 1 }}>
            {USE_NETWORK_SELECTOR && (
              <div style={{ marginRight: 20 }}>
                <NetworkSwitch
                  networkOptions={networkOptions}
                  selectedNetwork={selectedNetwork}
                  setSelectedNetwork={setSelectedNetwork}
                />
              </div>
            )}
            <Account
              useBurner={USE_BURNER_WALLET}
              address={address}
              localProvider={localProvider}
              userSigner={userSigner}
              mainnetProvider={mainnetProvider}
              price={price}
              web3Modal={web3Modal}
              loadWeb3Modal={loadWeb3Modal}
              logoutOfWeb3Modal={logoutOfWeb3Modal}
              blockExplorer={blockExplorer}
            />
          </div>
        </div>
      </Header>
      {yourLocalBalance.lte(ethers.BigNumber.from("0")) && (
        <FaucetHint localProvider={localProvider} targetNetwork={targetNetwork} address={address} />
      )}
      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        USE_NETWORK_SELECTOR={USE_NETWORK_SELECTOR}
      />
      <Menu style={{ textAlign: "center", marginTop: 20 }} selectedKeys={[location.pathname]} mode="horizontal">
        <Menu.Item key="/">
          <Link to="/">App Home</Link>
        </Menu.Item>
        <Menu.Item key="/Createbussines">
          <Link to="/Createbussines">Create Bussines</Link>
        </Menu.Item>

        <Menu.Item key="/debug">
          <Link to="/debug">Debug Contracts</Link>
        </Menu.Item>
        <Menu.Item key="/wtsyc">
          <Link to="/wtsyc">Debug wtsyc</Link>
        </Menu.Item>

        {/* <Menu.Item key="/subgraph">
          <Link to="/subgraph">Subgraph</Link>
        </Menu.Item> */}
      </Menu>

      <Switch>
        <Route exact path="/">
          {/* pass in any web3 props to this Home component. For example, yourLocalBalance */}
          <MapView />
        </Route>

        <Route exact path="/Createbussines">
          {/* pass in any web3 props to this Home component. For example, yourLocalBalance */}
          <div className="flex flex-row ">
            <MapView />
            <div className="justify-center ml-10 mt-5">
              <h1 className="text-3xl  text-white font-bold">Create a new business</h1>

              <form className="flex flex-col gap-4">
                <input
                  className="bg-transparent w-[240px] h-10 border-1 text-white"
                  value={_form.b_name}
                  onChange={e => {
                    set_form({ ..._form, b_name: e.target.value });
                  }}
                  placeholder="name"
                />
                <input
                  className="bg-transparent w-[240px] h-10 border-1 text-white"
                  value={_form.b_description}
                  onChange={e => {
                    set_form({ ..._form, b_description: e.target.value });
                  }}
                  placeholder="description"
                />
                <input
                  className="bg-transparent w-[240px] h-10 border-1 text-white"
                  value={_form.b_latitude}
                  onChange={e => {
                    set_form({ ..._form, b_latitude: e.target.value });
                  }}
                  placeholder="latitude"
                />
                <input
                  className="bg-transparent w-[240px] h-10 border-1 text-white"
                  value={_form.b_longitude}
                  onChange={e => {
                    set_form({ ..._form, b_longitude: e.target.value });
                  }}
                  placeholder="longitude"
                />
              </form>
              <button onClick={createJson}> Create new businnes</button>

              <div>
                Your transaction has is : <a href={"https://explorer.testnet.aurora.dev/tx/" + tx}>{tx}</a>
              </div>
            </div>
          </div>

          {/* <BusinessForm/> */}
        </Route>
        <Route exact path="/debug">
          {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}

          <Contract
            name="YourContract"
            price={price}
            signer={userSigner}
            provider={localProvider}
            address={address}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />
        </Route>
        <Route exact path="/wtsyc">
          {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}

          <Contract
            name="WTSYC"
            price={price}
            signer={userSigner}
            provider={localProvider}
            address={address}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />
        </Route>

        {/* <Route path="/subgraph">
          <Subgraph
            subgraphUri={props.subgraphUri}
            tx={tx}
            writeContracts={writeContracts}
            mainnetProvider={mainnetProvider}
          />
        </Route> */}
      </Switch>

      <ThemeSwitch />

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>

          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col>
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              /*  if the local provider has a signer, let's show the faucet:  */
              faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default App;

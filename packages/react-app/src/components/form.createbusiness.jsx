import React, { useState } from "react";
import axios from "axios";

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

// probably we need to change value={toAddress} to address={toAddress}

/** 
  ~ What it does? ~

  Displays an address input with QR scan option

  ~ How can I use? ~

  <AddressInput
    autoFocus
    ensProvider={mainnetProvider}
    placeholder="Enter address"
    value={toAddress}
    onChange={setToAddress}
  />

  ~ Features ~

  - Provide ensProvider={mainnetProvider} and your address will be replaced by ENS name
              (ex. "0xa870" => "user.eth") or you can enter directly ENS name instead of address
  - Provide placeholder="Enter address" value for the input
  - Value of the address input is stored in value={toAddress}
  - Control input change by onChange={setToAddress}
                          or onChange={address => { setToAddress(address);}}
**/
export default function Createbussines(props) {
  //  const {  onChange } = props;

  const [_form, set_form] = useState({
    b_name: "",
    b_description: "",
    b_latitude: "",
    b_longitude: "",
    b_status: "Active",
  });

  const createJson = async () => {
    let business_info = {
      id: 0,
      description: "A colonial restaurant",
      latitude: 21.48532677351019,
      longitude: -104.88325874347564,
    };

    var data = JSON.stringify({
      pinataOptions: {
        cidVersion: 1,
      },
      pinataMetadata: {
        name: "WTSYC",
        keyvalues: {
          customKey: "customValue",
        },
      },
      pinataContent: {
        business_info: business_info,
      },
    });

    await pinJSONToIPFS(data);
  };

  return (
    <div className="justify-center">
      <h1 className="text-3xl  text-red-600 font-bold underline">Hello world!</h1>

      <button onClick={createJson}> create json</button>
    </div>
  );
}

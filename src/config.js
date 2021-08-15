export const INFURA_ENDPOINT = "https://polygon-mainnet.infura.io/v3/29d79f756f474f069045693aff06873e"

export const UPLD_REGISTRY_ADDRESS = "0xFFadfF3B730EACD6545B826E257a92315faBA5eb"

export const UPLD_REGISTRY_ABI = [
			{
				"inputs": [
					{
						"internalType": "string",
						"name": "channelCid",
						"type": "string"
					}
				],
				"name": "addChannel",
				"outputs": [],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "",
						"type": "address"
					}
				],
				"name": "channelOwnership",
				"outputs": [
					{
						"internalType": "string",
						"name": "",
						"type": "string"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "string",
						"name": "videoCid",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "channelCid",
						"type": "string"
					}
				],
				"name": "uploadVideo",
				"outputs": [],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "string",
						"name": "videoCid",
						"type": "string"
					}
				],
				"name": "verifyVideo",
				"outputs": [
					{
						"internalType": "bool",
						"name": "",
						"type": "bool"
					}
				],
				"stateMutability": "view",
				"type": "function"
			}
		]

export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBRbpFvplB3HDuDtrViBV0ksMfI6JASZ6k",
    authDomain: "upld-53741.firebaseapp.com",
    databaseURL: "https://upld-53741-default-rtdb.firebaseio.com",
    projectId: "upld-53741",
    storageBucket: "upld-53741.appspot.com",
    messagingSenderId: "590652541610",
    appId: "1:590652541610:web:482f3953acedcfbfd4ded3",
    measurementId: "G-8HCXX3E651"
  };

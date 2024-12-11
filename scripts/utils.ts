import axios from 'axios';
import {ethers} from 'hardhat'
import { BytesLike, BigNumberish } from "ethers";

interface FeedValue {
  data: string;
  timestamp: number;
}

interface Feed {
  key: string;
  value: FeedValue;
  merkleProofs: string[];
}

interface Signature {
  R: string;
  S: string;
  V: number;
}

interface Calldata {
  merkleRoot: string;
  signatures: Signature[];
  feeds: Feed[];
}

export interface UpdateResponse {
  calldata: Calldata;
  error: string;
}

function decodeBase64ToBytes32(base64: string): string {
  const buffer = Buffer.from(base64, 'base64');
  return ethers.hexlify(buffer);
}

function decodeBase64(base64: string): string {
  const buffer = Buffer.from(base64, 'base64');
  const value = buffer.readBigUInt64BE(buffer.length - 8);
  return (value).toString();
}

async function fetchData(url: string): Promise<UpdateResponse> {
  try {
    const response = await axios.get<UpdateResponse>(url);
    const data = response.data;
    data.calldata.feeds = data.calldata.feeds.map(feed => ({
      ...feed,
      value: {
        ...feed.value,
        data: decodeBase64(feed.value.data)
      }
    }));
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    } else {
      console.error('Unknown error:', error);
    }
    throw error;
  }
}

interface SignatureStruct {
  r: BytesLike;
  s: BytesLike;
  v: number;
}

export interface VerifyPriceArgs {
  merkleRoot: BytesLike;
  merkleProof: BytesLike[];
  signatures: SignatureStruct[];
  dataKey: BytesLike;
  price: BigNumberish;
  timestamp: BigNumberish;
}

const FinalizedSnapUrl = "https://pricefeed.entangle.fi";
const FinalizedSourceID = "prices-feed1";

export async function fetchVerifyArgs(asset: string): Promise<VerifyPriceArgs> {
  // Prepare URL
  const url = new URL(`${FinalizedSnapUrl}/spotters/${FinalizedSourceID}`);
  url.searchParams.append('assets', asset);

  // Make the request to finalized-data-snap
  const updateRes = await fetchData(url.href);

  if (updateRes.calldata.feeds.length === 0) {
    throw new Error('No feeds found');
  }

  // Unpack response
  const feed = updateRes.calldata.feeds[0];
  const merkleRoot = updateRes.calldata.merkleRoot;
  const merkleProof = feed.merkleProofs.map(decodeBase64ToBytes32);
  const dataKey = ethers.encodeBytes32String(feed.key);
  const price = feed.value.data;
  const timestamp = feed.value.timestamp;
  const signatures = updateRes.calldata.signatures.map(sig => ({
    r: sig.R,
    s: sig.S,
    v: sig.V
  }));

  // Pack to arguments object
  let verifyArgs: VerifyPriceArgs ={
    merkleRoot,
    merkleProof,
    signatures,
    dataKey,
    price,
    timestamp,
  };

  return verifyArgs;
}

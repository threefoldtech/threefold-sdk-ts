import urlJoin from "url-join";

const BASE = window.env.MANUAL_URL;
export const manual = {
  dedicated_machines: urlJoin(BASE, "/documentation/dashboard/deploy/node_finder.html#dedicated-nodes"),
  tft_bridges: urlJoin(BASE, "/documentation/threefold_token/tft_bridges/tft_bridges.html"),
  buy_sell_tft: urlJoin(BASE, "/documentation/threefold_token/buy_sell_tft/buy_sell_tft.html"),
  farmers: urlJoin(BASE, "/documentation/farmers/farmers.html"),
  governance: urlJoin(BASE, "/documentation/dashboard/tfchain/tf_dao.html"),
  pricing: urlJoin(BASE, "/knowledge_base/cloud/pricing/pricing.html"),
  dao: urlJoin(BASE, "/documentation/dashboard/tfchain/tf_dao.html"),
  caprover: urlJoin(BASE, "/documentation/dashboard/solutions/caprover.html"),
  tf_connect_app: urlJoin(BASE, "/documentation/threefold_token/storing_tft/tf_connect_app.html"),
  tf_connect_wallet: urlJoin(BASE, "/documentation/dashboard/wallet_connector.html"),
  contract_locking: urlJoin(BASE, "/documentation/developers/tfchain/tfchain.html#contract-locking"),
  billing_pricing: urlJoin(BASE, "/documentation/dashboard/deploy/node_finder.html#billing--pricing"),
  discount_levels: urlJoin(BASE, "/knowledge_base/cloud/pricing/pricing.html#staking-discount"),
  tfchain_stellar_bridge: urlJoin(BASE, "/documentation/threefold_token/tft_bridges/tfchain_stellar_bridge.html"),
  minting_receipts: urlJoin(BASE, "/documentation/farmers/3node_building/minting_receipts.html"),
};

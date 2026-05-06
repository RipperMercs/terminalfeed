// Generates /crypto/<symbol> pages: one per coin with unique educational
// content, live price loaded client-side from /api/coingecko/markets and
// /api/btc-price, FAQ schema, and related-coin links. Idempotent.
//
// Editorial policy (CLAUDE.md, 2026-04-20): no dedicated memecoin pages.
// Coins included: utility-bearing assets (L1/L2 chains, DeFi, stablecoins,
// AI/compute, privacy, infrastructure tokens). Pure memes (PEPE, SHIB, BONK,
// WIF, etc.) are deliberately excluded.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/crypto');

// ---------- DATA ----------
// Each entry: substantive unique content. ~500-800 words per page.
// Pages average ~600 words. With 30 entries = 18,000+ words of unique copy.
//
// Categories: L1, L2, DeFi, Stablecoin, AI, Privacy, Infra, Exchange.

const COINS = [
  // ===== Top 5 (super rich) =====
  {
    symbol: 'btc', ticker: 'BTC', name: 'Bitcoin', category: 'L1',
    founded: 2009, founder: 'Satoshi Nakamoto (pseudonym)', consensus: 'Proof-of-Work',
    maxSupply: '21,000,000',
    shortDesc: 'The first decentralized cryptocurrency, running on a proof-of-work blockchain since January 2009. The reference asset for the entire crypto market.',
    whatItIs: `Bitcoin is the first and most established cryptocurrency, designed to be a peer-to-peer electronic cash system that operates without a central authority. It was introduced in October 2008 by an anonymous person or group writing under the name Satoshi Nakamoto, who published a whitepaper proposing a system where transactions are verified by a distributed network of nodes using cryptographic proof. The Bitcoin network went live on January 3, 2009 with the mining of the genesis block, which contained the now-famous text "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks".<br><br>Today, Bitcoin functions primarily as a store of value, often called "digital gold" because of its fixed 21 million supply, decentralized nature, and resistance to inflation through monetary policy. While it can be used for payments, the network's intentionally limited throughput (around 7 transactions per second) means most economic activity happens on Layer 2 networks like the <a href="/glossary/lightning-network">Lightning Network</a> or wrapped representations on smart-contract platforms.`,
    howItWorks: `Bitcoin uses a proof-of-work consensus mechanism: miners compete to solve a computationally expensive cryptographic puzzle (SHA-256 double hashing) for the right to add the next block of transactions. The miner who finds a valid solution first broadcasts the block, the rest of the network verifies it, and the miner receives the block reward (currently 3.125 BTC per block, which halves every 210,000 blocks per the <a href="/glossary/halving">halving</a> schedule).<br><br>New blocks are added approximately every 10 minutes, and the protocol automatically adjusts mining difficulty every 2,016 blocks to maintain that target. Once a block is buried under several confirmations (typically 6 for high-value transactions), reversing it would require an attacker to control more than 50% of the network's total <a href="/glossary/hashrate">hashrate</a>, which is currently impractical given the network's ~700+ exahash/s of compute. Wallets track ownership using <a href="/glossary/utxo">UTXOs</a> (Unspent Transaction Outputs) rather than account balances.`,
    useCases: `The dominant use case in 2026 is store of value: holding BTC as a long-duration savings asset, often as a hedge against fiat currency debasement and as portfolio diversification. Spot Bitcoin <a href="/glossary/bitcoin-etf">ETFs</a> launched in 2024 made institutional allocation straightforward, and they now hold significant fraction of circulating supply. Secondary use cases: international remittances (especially via Lightning), settlement-layer collateral for DeFi (via wrapped BTC on Ethereum and L2s), and a small but growing merchant payments segment particularly outside the US.`,
    tradeoffs: `Critics point to Bitcoin's energy consumption (network electricity use rivals small countries), its limited base-layer throughput, the persistent volatility that makes day-to-day pricing impractical, and the lack of native programmability. Supporters argue these are deliberate tradeoffs: high energy use is what makes the network attack-resistant, simplicity is what makes the rules predictable for decades, and price volatility is the natural state of an asset that is still being adopted globally.`,
    whereToLearn: `Read more in the <a href="/blog/bitcoin-mempool">Bitcoin Mempool</a> article, the <a href="/blog/bitcoin-80k-sentiment-disconnect">2026 Bitcoin sentiment analysis</a>, or check live data at <a href="/api/btc-price">/api/btc-price</a>.`,
    faqs: [
      { q: 'Who created Bitcoin?', a: 'Bitcoin was created by an anonymous person or group writing under the name Satoshi Nakamoto. The identity has never been publicly confirmed. Satoshi disappeared from public communication in 2010-2011.' },
      { q: 'How many bitcoins exist?', a: 'Bitcoin has a hard cap of 21 million coins. As of 2026, around 19.7 million have been mined; the rest will be released gradually until approximately the year 2140.' },
      { q: 'Is Bitcoin a good store of value?', a: 'Bitcoin has appreciated dramatically since launch but remains highly volatile on shorter timeframes. As a long-duration store of value, its case rests on its fixed supply and decentralized issuance. Whether that holds up over decades is genuinely uncertain.' },
      { q: 'How is Bitcoin different from other cryptocurrencies?', a: 'Bitcoin has the longest track record, the largest network effect, the highest hashrate, and the strongest decentralization claim. It is also intentionally less programmable than alternatives like Ethereum.' },
      { q: 'Can Bitcoin transactions be reversed?', a: 'No. Once a transaction is confirmed in a block and buried under several more blocks, reversing it would require attacking the network with majority hashrate. Lost or stolen Bitcoin cannot be recovered through any administrative process.' },
    ],
    related: ['eth', 'ltc', 'bch'],
  },
  {
    symbol: 'eth', ticker: 'ETH', name: 'Ethereum', category: 'L1',
    founded: 2015, founder: 'Vitalik Buterin and others', consensus: 'Proof-of-Stake',
    maxSupply: 'No hard cap; net issuance can be deflationary post-EIP-1559',
    shortDesc: 'The dominant smart-contract platform, settling most of the activity in DeFi, NFTs, stablecoins, and Layer 2 rollups.',
    whatItIs: `Ethereum is a programmable blockchain that extends Bitcoin's design with a Turing-complete virtual machine, the EVM (Ethereum Virtual Machine). Where Bitcoin's scripting language is intentionally limited, Ethereum lets developers deploy <a href="/glossary/smart-contract">smart contracts</a>: self-executing code that runs deterministically on every node in the network. This single design choice opened the door to <a href="/glossary/defi">DeFi</a>, NFTs, DAOs, and most of the on-chain economy that exists in 2026.<br><br>Ethereum was proposed by Vitalik Buterin in late 2013 and launched in July 2015 with co-founders including Gavin Wood, Joseph Lubin, Charles Hoskinson (later founded Cardano), and others. ETH, the network's native token, is used to pay <a href="/glossary/gas-fees">gas fees</a> for executing transactions and smart contract calls. In 2022, Ethereum transitioned from proof-of-work to proof-of-stake in an event known as The Merge, reducing energy consumption by ~99.95%.`,
    howItWorks: `Ethereum operates as a global state machine. Every full node maintains the complete state (account balances, contract storage, nonce values), and every transaction is a state transition that all nodes execute identically. Transactions are bundled into blocks every ~12 seconds, with <a href="/glossary/validator">validators</a> selected to propose and attest to blocks based on their staked ETH (32 ETH per validator slot).<br><br>To send a transaction, a user pays gas in ETH: a base fee (which is burned, removing ETH from circulation) plus an optional priority tip to incentivize validators. Smart contracts are deployed to addresses and called by transactions; their execution costs gas proportional to computational complexity. Most user activity in 2026 happens on <a href="/glossary/layer-2">Layer 2</a> networks like Arbitrum, Optimism, and Base, which post compressed batches back to Ethereum L1 for security.`,
    useCases: `Ethereum is the settlement layer for the bulk of crypto's economic activity. <a href="/glossary/defi">DeFi</a> protocols (lending, decentralized exchanges, derivatives) hold tens of billions in <a href="/api/pro/defi-tvl">total value locked</a>. <a href="/glossary/stablecoin">Stablecoins</a> are issued primarily on Ethereum and its L2s. NFTs, on-chain identity, prediction markets, and DAO governance all run on Ethereum infrastructure. Validators earn ~3-4% APY for staking, which makes ETH function as both a productive asset and the gas token for the entire ecosystem.`,
    tradeoffs: `Ethereum's biggest tradeoff is the constant tension between decentralization, scalability, and security (the "blockchain trilemma"). Base-layer throughput is intentionally limited (~15-30 transactions per second) to keep node operation accessible to ordinary users. The L2 scaling roadmap pushed most activity off the main chain, which works but adds complexity. Critics also flag MEV (miner/maximal extractable value) extraction by sophisticated actors, validator centralization risk in staking pools like Lido, and the regulatory uncertainty around ETH's status as a security in some jurisdictions.`,
    whereToLearn: `Live ETH gas prices are at <a href="/api/gas">/api/gas</a>. The <a href="/api/pro/defi-tvl">DeFi TVL premium endpoint</a> tracks Ethereum DeFi activity. For deeper context, see the <a href="/glossary/smart-contract">smart contracts</a>, <a href="/glossary/layer-2">Layer 2</a>, and <a href="/glossary/staking">staking</a> glossary entries.`,
    faqs: [
      { q: 'How is Ethereum different from Bitcoin?', a: 'Bitcoin is designed primarily as digital money: simple, predictable, and intentionally limited in programmability. Ethereum is designed as a programmable platform: every contract is custom code, which enables DeFi, NFTs, DAOs, but also adds complexity and attack surface.' },
      { q: 'What is gas in Ethereum?', a: 'Gas is the unit that measures computational effort on Ethereum. Every transaction or smart contract call consumes gas, and users pay for that gas in ETH. More complex operations cost more gas; the price per unit fluctuates with network demand.' },
      { q: 'Is Ethereum still proof-of-work?', a: 'No. Ethereum transitioned to proof-of-stake in September 2022 via The Merge. Validators stake 32 ETH each to participate in consensus. The network now uses ~99.95% less energy than under proof-of-work.' },
      { q: 'What does it mean to stake ETH?', a: 'Staking ETH means locking up tokens to participate in network consensus, either by running a validator yourself (32 ETH minimum) or by depositing into a staking pool like Lido or Rocket Pool. Stakers earn protocol-issued rewards plus transaction fees.' },
      { q: 'How are L2s related to Ethereum?', a: 'Layer 2 networks process transactions off the Ethereum main chain and post compressed batches back. L2s inherit Ethereum security while offering 10-100x cheaper fees. Most user activity in 2026 happens on L2s, not on L1.' },
    ],
    related: ['btc', 'sol', 'arb', 'op'],
  },
  {
    symbol: 'usdt', ticker: 'USDT', name: 'Tether', category: 'Stablecoin',
    founded: 2014, founder: 'Tether Limited (issuer)', consensus: 'Issued on multiple chains',
    maxSupply: 'Variable; backed by reserves',
    shortDesc: 'The largest US-dollar-pegged stablecoin by circulating supply, used for trading, settlement, and dollar access in markets without USD banking.',
    whatItIs: `Tether (USDT) is a <a href="/glossary/stablecoin">stablecoin</a> issued by Tether Limited that aims to maintain a 1:1 peg with the US dollar. It is the largest stablecoin in circulation, with significant share of total stablecoin supply. USDT is issued natively on multiple blockchains including Ethereum, Tron, Solana, and others, with each issuance backed by reserves held by Tether Limited. The reserves consist of cash, US Treasuries, money-market funds, and other assets disclosed in regular attestations.<br><br>USDT's primary role is as a unit of account and trading pair on cryptocurrency exchanges. Most crypto trading volume is denominated in USDT rather than fiat USD because it can move on-chain in seconds rather than waiting for bank settlement. In markets where USD banking is restricted or unavailable (parts of Asia, South America, Africa), USDT functions as a practical replacement for USD bank accounts.`,
    howItWorks: `Tether maintains the peg through issuance and redemption: authorized counterparties can mint new USDT by depositing USD, and redeem USDT for USD by burning tokens. In secondary markets (exchanges and DeFi), the price floats but tends to stay within a few basis points of $1.00 because arbitrageurs profit from any divergence. Tether publishes quarterly reserve attestations conducted by accounting firms; reserve composition is published in summary form.<br><br>USDT exists as separate token contracts on each chain it's issued on, with Tether Limited responsible for ensuring the total minted supply matches the total reserves backing all chains combined. Cross-chain bridges allow holders to move USDT between chains, though the canonical issuance always traces back to Tether Limited's mint authority.`,
    useCases: `USDT dominates as the primary trading pair on most centralized crypto exchanges. It is used as a settlement currency between exchanges and OTC desks, as collateral in DeFi lending markets (especially on Ethereum and Tron), as a remittance rail in regions with weak banking infrastructure, and as the dollar-equivalent leg of perpetual futures positions. For users in countries with capital controls or unstable currencies, holding USDT is often the most accessible way to maintain dollar-denominated savings.`,
    tradeoffs: `Tether has faced ongoing scrutiny over the composition and verification of its reserves, regulatory questions about the issuer, and concentration risk in the broader crypto market. The 2022 collapse of TerraUSD (an algorithmic stablecoin) reminded markets that not all "stable" coins are actually stable; while USDT is collateral-backed and structurally different, the event prompted regulators in multiple jurisdictions to require stricter disclosures from stablecoin issuers. Holders should understand they trust Tether Limited as the issuer and are exposed to reserve quality, regulatory action, and counterparty risk.`,
    whereToLearn: `See the <a href="/glossary/stablecoin">stablecoin</a> glossary entry for the broader category. The <a href="/api/pro/stablecoin-flows">premium stablecoin-flows endpoint</a> tracks issuance and redemption flows across the major stablecoins including USDT.`,
    faqs: [
      { q: 'Is USDT actually backed 1:1 by US dollars?', a: 'USDT is backed by a reserve portfolio that Tether Limited reports includes cash, US Treasuries, money-market funds, and other assets totaling approximately the circulating supply. The exact composition is published in periodic attestations.' },
      { q: 'Can USDT lose its peg?', a: 'Yes, briefly. USDT has occasionally traded a few cents below $1 during market stress events (like the May 2022 Terra collapse) before arbitrageurs restored the peg. A persistent unpeg has not occurred, but is not impossible.' },
      { q: 'Is USDT issued only on Ethereum?', a: 'No. USDT is issued natively on multiple blockchains including Ethereum, Tron, Solana, and others. Each chain has its own USDT contract; the total minted supply is managed by Tether Limited across all chains.' },
      { q: 'How is USDT different from USDC?', a: 'Both are USD-pegged stablecoins. USDT is issued by Tether Limited and has the largest supply. USDC is issued by Circle, has more conservative reserve management (cash and short-term Treasuries only), and is favored by institutions seeking US-regulated counterparties.' },
    ],
    related: ['usdc', 'dai', 'eth'],
  },
  {
    symbol: 'usdc', ticker: 'USDC', name: 'USD Coin', category: 'Stablecoin',
    founded: 2018, founder: 'Circle and Coinbase (Centre Consortium)', consensus: 'Issued on multiple chains',
    maxSupply: 'Variable; fully reserve-backed',
    shortDesc: 'A US-dollar-pegged stablecoin issued by Circle, fully backed by short-term Treasuries and cash, favored by institutions and DeFi protocols.',
    whatItIs: `USDC (USD Coin) is a fully-collateralized US dollar stablecoin issued by Circle, a US-regulated financial services company. Each USDC token represents one US dollar held in reserve, with reserves consisting of cash and short-duration US Treasury securities. Circle publishes monthly attestations of reserve composition by a Big Four accounting firm and is regulated as a money services business in the United States.<br><br>USDC was launched in 2018 originally under the Centre Consortium (a joint venture with Coinbase) and is now issued primarily by Circle. It is available natively on multiple chains including Ethereum, Solana, Avalanche, Base, Arbitrum, Polygon, and Stellar, with each chain holding a portion of the total supply. USDC is widely used in DeFi protocols, by institutional traders, and by retail users seeking dollar-denominated stability with a more conservative reserve profile than alternatives.`,
    howItWorks: `Circle mints new USDC when authorized customers wire US dollars to Circle's bank accounts, and burns USDC when customers request redemption back to USD. The mint/burn flow keeps total USDC supply equal to total dollar reserves. Customers can access this primary issuance through Circle Mint (Circle's institutional onboarding service); retail users typically buy and sell USDC on exchanges.<br><br>Reserves are held in regulated US financial institutions and short-duration US Treasury securities. Circle publishes monthly attestations of total reserves, and a separate quarterly review of reserve composition. The transparency around USDC reserves is one of the main reasons institutional users prefer it over alternatives with less-disclosed backing.`,
    useCases: `USDC is the preferred stablecoin in <a href="/glossary/defi">DeFi</a> protocols on Ethereum and L2s, particularly in lending markets (Aave, Compound) and decentralized exchanges (Uniswap, Curve). It is heavily used by Coinbase as the default payment rail for institutional services. Many traditional fintech companies (Stripe, Visa, PayPal) integrate USDC for cross-border payments. TerminalFeed accepts USDC on Base for premium API credits.`,
    tradeoffs: `USDC is more conservative than USDT in reserve management but smaller in total supply and trading volume. The March 2023 Silicon Valley Bank collapse temporarily depegged USDC because Circle held a portion of reserves at SVB; the peg was restored within 48 hours when banking regulators backstopped depositors. The event highlighted that even high-quality reserves carry banking-system risk. USDC also depends on US regulatory tolerance for stablecoins, which remains an evolving question.`,
    whereToLearn: `TerminalFeed accepts USDC for <a href="/blog/how-ai-agents-pay-terminalfeed">premium API credits</a>. See the <a href="/glossary/stablecoin">stablecoin</a> entry for the broader category and the <a href="/api/pro/stablecoin-flows">stablecoin-flows endpoint</a> for issuance data.`,
    faqs: [
      { q: 'Who issues USDC?', a: 'USDC is issued by Circle, a US-regulated financial services company headquartered in Boston. Circle was originally part of the Centre Consortium with Coinbase but is now the primary issuer.' },
      { q: 'What are USDC reserves backed by?', a: 'USDC reserves consist of cash held at regulated US banks and short-duration US Treasury securities. Reserve composition is published in monthly attestations by a major accounting firm.' },
      { q: 'Is USDC safer than USDT?', a: 'USDC has more conservative reserve management and stronger US regulatory clarity. Whether that makes it safer in absolute terms is contested, but most institutional users prefer USDC for those reasons.' },
      { q: 'Has USDC ever lost its peg?', a: 'Yes, briefly in March 2023 when Silicon Valley Bank failed and Circle had reserves there. USDC traded below $0.90 for about 36 hours before US regulators backstopped SVB depositors and the peg was restored.' },
    ],
    related: ['usdt', 'dai', 'eth'],
  },
  {
    symbol: 'sol', ticker: 'SOL', name: 'Solana', category: 'L1',
    founded: 2020, founder: 'Anatoly Yakovenko, Raj Gokal', consensus: 'Proof-of-Stake + Proof-of-History',
    maxSupply: 'Inflationary, decreasing schedule',
    shortDesc: 'A high-throughput Layer 1 blockchain optimized for low fees and fast finality, popular for DeFi, payments, and consumer applications.',
    whatItIs: `Solana is a Layer 1 blockchain designed for high throughput and low transaction costs. Where Ethereum prioritizes decentralization and is scaling primarily through L2s, Solana takes the opposite approach: a single fast Layer 1 that aims to handle thousands of transactions per second directly. The network was founded in 2020 by Anatoly Yakovenko, a former Qualcomm engineer, with co-founder Raj Gokal at Solana Labs.<br><br>Solana introduced Proof-of-History (PoH) as a complement to its Proof-of-Stake consensus: a verifiable delay function that timestamps transactions before they are voted on, letting validators agree on transaction order without expensive coordination. This design enables block times of around 400 milliseconds and theoretical throughput of tens of thousands of TPS. Real-world throughput in 2026 is in the low thousands TPS range during normal operation.`,
    howItWorks: `Solana validators run high-spec hardware (typically 12+ CPU cores, 256+ GB RAM, NVMe storage) to keep up with the high block production rate. <a href="/glossary/staking">Staking</a> SOL with validators secures the network and earns rewards (~5-7% APY in 2026). The network has experienced several outages in its history, primarily due to mempool flooding during high-demand events (NFT mints, popular token launches), which prompted multiple protocol-level upgrades to mitigate.<br><br>Smart contracts on Solana are called "programs" and are typically written in Rust or C, compiled to BPF (Berkeley Packet Filter) bytecode. Programs are stateless; state is held in separate accounts. This is structurally different from Ethereum's account-and-storage model and trips up developers coming from EVM ecosystems, but enables some of Solana's parallelism advantages.`,
    useCases: `Solana hosts a large DeFi ecosystem (Jupiter for DEX aggregation, Marinade for liquid staking, Drift for perpetuals), a thriving NFT scene (Magic Eden marketplace, Tensor), and an unusually active consumer-app sector (Phantom wallet, Backpack, blink-style social payments). Stablecoins are widely used: USDC has significant supply on Solana, and USDT migrated meaningful supply onto Solana for trading and remittance use cases. Pyth Network, an oracle protocol, uses Solana as its native chain.`,
    tradeoffs: `Solana's main tradeoffs are validator hardware requirements (which limit how decentralized the validator set can become), historical reliability issues (multiple multi-hour outages between 2021 and 2024), and a different developer toolchain that doesn't share libraries with EVM ecosystems. The network has matured significantly through 2024-2026, but ongoing scrutiny of validator distribution and economic centralization remains. Critics argue Solana trades meaningful decentralization for performance; supporters argue the tradeoff makes consumer-scale applications viable.`,
    whereToLearn: `Live Solana network health (TPS, slot time, epoch progress) is at <a href="/api/solana-network">/api/solana-network</a>. See the <a href="/glossary/validator">validator</a> entry for context on Solana's staking model.`,
    faqs: [
      { q: 'How is Solana different from Ethereum?', a: 'Solana prioritizes Layer 1 throughput; Ethereum prioritizes decentralization and scales via Layer 2 networks. Solana has block times around 400ms vs Ethereum\'s 12 seconds. Fees are typically a fraction of a cent on Solana vs $0.50-$5 on Ethereum L1.' },
      { q: 'What is Proof-of-History?', a: 'Proof-of-History is a verifiable delay function Solana uses to timestamp transactions. It lets validators agree on the order of transactions without expensive coordination, enabling Solana\'s high throughput.' },
      { q: 'Does Solana support smart contracts?', a: 'Yes. Solana programs (its term for smart contracts) are written in Rust or C and compiled to BPF bytecode. The execution model differs from Ethereum: programs are stateless and state lives in separate accounts.' },
      { q: 'What is the staking yield on Solana?', a: 'In 2026, staking SOL with a validator earns roughly 5-7% APY (varies with total network stake and inflation parameters). Liquid staking via Marinade or Jito provides liquid representations of staked SOL.' },
      { q: 'Has Solana had outages?', a: 'Yes, multiple times between 2021 and 2024, mostly due to network congestion during high-demand events. The protocol has been hardened through several upgrades; 2025-2026 uptime has been substantially better than earlier years.' },
    ],
    related: ['eth', 'avax', 'apt', 'sui'],
  },
  {
    symbol: 'xrp', ticker: 'XRP', name: 'Ripple', category: 'Payment',
    founded: 2012, founder: 'Ripple Labs / David Schwartz, Jed McCaleb, Arthur Britto', consensus: 'XRP Ledger Consensus',
    maxSupply: '100,000,000,000',
    shortDesc: 'A payment-focused digital asset designed for fast, low-cost cross-border settlement, with a unique consensus model and a US regulatory history.',
    whatItIs: `XRP is the native digital asset of the XRP Ledger (XRPL), a payment-focused blockchain originally launched in 2012 by Ripple Labs. The XRPL was designed specifically for cross-border value transfer, with target use cases including remittances, settlement between financial institutions, and any context where dollar settlement is too slow or expensive. The total supply of 100 billion XRP was created at genesis; no new XRP is ever issued, and a small amount is destroyed (burned) with every transaction as anti-spam.<br><br>XRP gained significant attention during 2017-2018 when Ripple Labs partnered with banks to use XRP-based payment rails. It was also the subject of a high-profile SEC lawsuit filed in December 2020 alleging XRP was an unregistered security. A 2023 court ruling found that programmatic sales of XRP on exchanges did not constitute securities offerings, which materially reduced regulatory uncertainty for the asset.`,
    howItWorks: `The XRP Ledger uses a unique consensus protocol where validators agree on transaction order through a multi-round voting process rather than the proof-of-work or proof-of-stake models common elsewhere. Validators are not paid; they are run by a diverse set of operators (financial institutions, exchanges, individuals) who use the ledger and want it to function correctly. Transaction finality is ~3-5 seconds, fees are typically less than a cent, and throughput is around 1,500 TPS sustained.<br><br>XRPL has native support for issued tokens (assets denominated as IOUs from a trusted issuer), a built-in decentralized exchange, and recently added smart contract capabilities through hooks and the XLS-30 native AMM. The ledger is more feature-rich at the protocol level than most alternatives, with much of that functionality predating the broader DeFi era.`,
    useCases: `Cross-border payments and remittances are the core use case. Ripple's enterprise products (RippleNet, On-Demand Liquidity) use XRP as a bridging asset between fiat currencies, letting financial institutions move value without pre-funding nostro accounts in destination markets. The XRPL's native DEX and stablecoin support are also used for FX-style trading. Some financial institutions use XRPL for settlement of tokenized assets, particularly in Asia and the Middle East.`,
    tradeoffs: `Critics of XRP highlight the centralization concerns: Ripple Labs holds a large portion of the original 100B XRP supply (locked in escrow with monthly releases), validator distribution is more concentrated than in Bitcoin or Ethereum, and the protocol's evolution has historically been led by Ripple rather than a fully open community. Supporters point to the legal clarity from the 2023 court ruling, real institutional adoption, and the ledger's strong technical performance for its design goals.`,
    whereToLearn: `For broader payment-focused crypto context, see the <a href="/glossary/lightning-network">Lightning Network</a> entry (Bitcoin's Layer 2) and the <a href="/glossary/stablecoin">stablecoin</a> entry.`,
    faqs: [
      { q: 'Who created XRP?', a: 'XRP was created by David Schwartz, Jed McCaleb, and Arthur Britto, who founded what became Ripple Labs. Jed McCaleb later left to co-found Stellar (XLM).' },
      { q: 'Is XRP a security?', a: 'A 2023 US court ruling found that programmatic sales of XRP on exchanges did not constitute securities offerings, while institutional sales had different treatment. The ruling is a significant precedent but does not fully resolve the global regulatory question.' },
      { q: 'How is XRP different from Bitcoin?', a: 'XRP is designed primarily for fast, cheap cross-border settlement. It uses a different consensus mechanism (validator agreement rather than proof-of-work), has a fixed pre-mined supply, and was designed with financial institutions as primary users.' },
      { q: 'How fast is the XRP Ledger?', a: 'XRP transactions typically finalize in 3-5 seconds with fees of less than a cent. The network can sustain around 1,500 transactions per second.' },
    ],
    related: ['xlm', 'usdc', 'btc'],
  },
  {
    symbol: 'bnb', ticker: 'BNB', name: 'BNB', category: 'Exchange',
    founded: 2017, founder: 'Binance / Changpeng Zhao', consensus: 'Proof-of-Staked-Authority',
    maxSupply: 'Originally 200,000,000; reduced through periodic burns',
    shortDesc: 'The native token of the BNB Chain ecosystem, originally launched as the Binance exchange utility token, now powers a major EVM-compatible blockchain.',
    whatItIs: `BNB (originally "Binance Coin") is the native token of the BNB Chain ecosystem, which includes BNB Smart Chain (BSC), an EVM-compatible blockchain, and the BNB Beacon Chain (a separate chain primarily used for governance and staking). BNB launched in 2017 as an ERC-20 token on Ethereum during Binance's ICO, then migrated to its own chain. It serves as a utility token for the Binance exchange (used to pay reduced trading fees) and as the gas token for transactions on BNB Smart Chain.<br><br>The token is associated with Binance, the world's largest cryptocurrency exchange by volume, founded by Changpeng Zhao (CZ) in 2017. Binance has executed periodic "burns" that destroy BNB tokens, reducing total supply over time. The exchange settled with US regulators in 2023 over various compliance issues; CZ stepped down as CEO and served a brief sentence. The exchange and the BNB token both continued operating without major disruption.`,
    howItWorks: `BNB Smart Chain uses Proof-of-Staked-Authority consensus: a fixed set of 21 active validators rotate to produce blocks, with validator slots awarded based on staked BNB and a reputation system. This design enables ~3-second block times and high throughput at the cost of more centralized validator distribution than fully open proof-of-stake networks. BSC is EVM-compatible, so smart contracts written for Ethereum can be deployed with minimal changes.<br><br>BNB serves multiple functions simultaneously: gas token on BSC, fee discount on Binance, governance token for parts of the ecosystem, and collateral for various DeFi protocols. The periodic burn mechanism is funded both by exchange profits and by automatic burns of transaction fees on BSC, similar to Ethereum's EIP-1559 design.`,
    useCases: `On Binance: paying trading fees with BNB earns a discount of up to 25%. On BNB Smart Chain: paying gas, deploying smart contracts, participating in DeFi (PancakeSwap is the dominant DEX), staking with validators, and bridging assets to other chains. The BNB Chain ecosystem is large but tends to skew toward retail trading, gambling, and copy-of-Ethereum-DeFi rather than novel applications.`,
    tradeoffs: `BNB's value is closely tied to Binance the exchange, which creates concentration risk: regulatory action against Binance, exchange technical issues, or shifts in trading volume directly affect BNB. The 21-validator design on BSC is significantly more centralized than Ethereum or even Solana. Critics also argue that much of BSC's activity is yield-farming and clones of Ethereum DeFi rather than original innovation. Supporters note that BNB has retained value and utility through major regulatory storms.`,
    whereToLearn: `For broader exchange-token context, see the <a href="/glossary/defi">DeFi</a> and <a href="/glossary/staking">staking</a> entries.`,
    faqs: [
      { q: 'Is BNB the same as Binance?', a: 'BNB is the native token of the BNB Chain ecosystem and the utility token of the Binance exchange. The exchange (Binance) and the token (BNB) are tightly related but distinct: the exchange is a company, the token is a digital asset that trades independently.' },
      { q: 'How does the BNB burn work?', a: 'Binance periodically burns BNB from its reserves and from BSC transaction fees, reducing the total supply over time. The total has decreased from the original 200 million issuance. Burns are typically announced quarterly.' },
      { q: 'Is BNB Smart Chain EVM-compatible?', a: 'Yes. BSC supports the same Ethereum Virtual Machine bytecode, so smart contracts written for Ethereum can be deployed on BSC with minimal changes. Block times are faster (~3 seconds) and gas fees are lower than Ethereum L1.' },
      { q: 'Who controls BNB Smart Chain?', a: 'BSC has 21 active validators rotating block production. While anyone can theoretically run a validator, the slots are competitive and the network has historically been more centralized than fully open chains. Governance is led by the BNB Chain core team.' },
    ],
    related: ['eth', 'sol', 'usdt'],
  },

  // ===== Layer 1 chains (medium depth) =====
  {
    symbol: 'ada', ticker: 'ADA', name: 'Cardano', category: 'L1',
    founded: 2017, founder: 'Charles Hoskinson', consensus: 'Proof-of-Stake (Ouroboros)',
    maxSupply: '45,000,000,000',
    shortDesc: 'A research-driven proof-of-stake blockchain emphasizing formal verification, peer-reviewed protocol design, and academic rigor.',
    whatItIs: `Cardano is a Layer 1 blockchain founded in 2017 by Charles Hoskinson, an Ethereum co-founder who left the project over governance disputes. Cardano is unusual among major blockchains for its development approach: every protocol upgrade is preceded by formal academic papers, peer review, and a multi-phase rollout (Byron, Shelley, Goguen, Basho, Voltaire). Native token ADA is named after Ada Lovelace.`,
    howItWorks: `Cardano runs the Ouroboros proof-of-stake consensus protocol, which was published as a peer-reviewed paper before deployment. Stakers delegate ADA to stake pools, which produce blocks and earn rewards distributed to delegators. Cardano supports smart contracts via Plutus (a Haskell-derived language) since the Alonzo upgrade in 2021. Block times are ~20 seconds; transaction fees are typically a fraction of a cent.`,
    useCases: `Cardano hosts a smaller DeFi ecosystem than Ethereum or Solana but with active projects in lending, DEXs, and stablecoins (notably DJED, an over-collateralized stablecoin). It also has notable adoption in identity and supply-chain projects, particularly in African countries through partnerships with governments and NGOs. The Project Catalyst voting platform funds community proposals from a treasury.`,
    tradeoffs: `Cardano's deliberate, research-first development approach has been both its differentiator and its biggest criticism: features ship more slowly than competitors, and adoption has lagged ecosystems that move faster. Smart contract development in Plutus has a steeper learning curve than Solidity. Supporters argue the rigorous approach reduces long-term protocol risk.`,
    whereToLearn: `See the <a href="/glossary/staking">staking</a> entry for context on Cardano's PoS model.`,
    faqs: [
      { q: 'Who created Cardano?', a: 'Cardano was founded by Charles Hoskinson, who was previously a co-founder of Ethereum. Development is led by IOG (Input Output Global, formerly IOHK) along with the Cardano Foundation and Emurgo.' },
      { q: 'Does Cardano have smart contracts?', a: 'Yes, since the Alonzo upgrade in September 2021. Smart contracts are written in Plutus (Haskell-based) or Aiken, with execution semantics derived from the eUTXO model rather than Ethereum-style account-based.' },
      { q: 'How does Cardano staking work?', a: 'ADA holders delegate stake to stake pools through a wallet. Delegated ADA never leaves the holder\'s wallet; the pool operator produces blocks on behalf of all delegators and rewards are distributed proportionally. Yields are typically 3-5% APY.' },
    ],
    related: ['eth', 'sol', 'dot'],
  },
  {
    symbol: 'avax', ticker: 'AVAX', name: 'Avalanche', category: 'L1',
    founded: 2020, founder: 'Ava Labs / Emin Gün Sirer', consensus: 'Avalanche Consensus (PoS)',
    maxSupply: '720,000,000',
    shortDesc: 'A high-throughput Layer 1 blockchain with sub-second finality, built around three interoperable chains and a subnet model for custom networks.',
    whatItIs: `Avalanche is a Layer 1 blockchain platform launched in September 2020 by Ava Labs, founded by Cornell professor Emin Gün Sirer. Avalanche's architecture is unusual: it consists of three primary chains (the X-Chain for asset transfers, the C-Chain for EVM-compatible smart contracts, and the P-Chain for staking and validator coordination) plus an unbounded number of "subnets" (custom blockchains that share the validator set and security model).`,
    howItWorks: `Avalanche introduced a novel consensus protocol that uses repeated random sub-sampling of validators to achieve probabilistic finality in under one second. Validators stake AVAX (minimum 2,000 AVAX) to participate. Each subnet selects which validators secure it, enabling regulatory-friendly deployments (e.g., KYC-only chains for financial institutions) without compromising the public chains.`,
    useCases: `The C-Chain is EVM-compatible and hosts a DeFi ecosystem similar to other EVM chains. Subnets are used by gaming projects (DeFi Kingdoms had its own subnet), institutional players, and projects needing sovereign control over chain parameters. AVAX is used as gas, staking collateral, and the bridge asset between subnets.`,
    tradeoffs: `Avalanche's subnet model is technically interesting but adds complexity and requires understanding which chain to use for which purpose. The DeFi ecosystem on the C-Chain has grown but remains smaller than Ethereum or Solana. Validator hardware requirements are moderate (more than Ethereum, less than Solana).`,
    whereToLearn: `See the <a href="/glossary/validator">validator</a> entry for staking context.`,
    faqs: [
      { q: 'What are Avalanche subnets?', a: 'Subnets are custom blockchains that run on Avalanche infrastructure. Each subnet chooses its own validator set (which must include AVAX-staked validators) and chain parameters, enabling tailored deployments without launching a separate blockchain from scratch.' },
      { q: 'Is Avalanche EVM-compatible?', a: 'Yes, on the C-Chain. Solidity smart contracts deploy with minimal modification. Block times are 1-2 seconds and finality is sub-second.' },
      { q: 'How fast is Avalanche?', a: 'Avalanche achieves sub-second probabilistic finality, meaning transactions can be considered final within about 1 second of submission. Throughput is in the thousands of TPS range.' },
    ],
    related: ['eth', 'sol', 'arb'],
  },
  {
    symbol: 'dot', ticker: 'DOT', name: 'Polkadot', category: 'L1',
    founded: 2020, founder: 'Web3 Foundation / Gavin Wood', consensus: 'Nominated Proof-of-Stake',
    maxSupply: 'Inflationary',
    shortDesc: 'A multi-chain protocol where independent blockchains (parachains) share security and interoperate through a central relay chain.',
    whatItIs: `Polkadot is a multi-chain protocol launched in 2020 by Gavin Wood, an Ethereum co-founder who also created the Solidity programming language. Polkadot's design centers on a relay chain that coordinates a set of independent chains called parachains. Each parachain has its own logic, governance, and tokenomics, but inherits security from the relay chain's validator set.`,
    howItWorks: `The Polkadot relay chain selects validators (Nominated Proof-of-Stake, where DOT holders nominate trusted validators) who secure the entire network. Parachains lease slots on the relay chain through periodic auctions, paying with locked DOT. Cross-chain messages (XCM) let parachains move tokens and call contracts on each other natively. Substrate, the framework Polkadot is built on, is widely used to build parachains and standalone chains.`,
    useCases: `Polkadot hosts dozens of parachains spanning DeFi (Acala, Hydration), smart contracts (Moonbeam, Astar), privacy (Manta), and identity. Some former parachains have migrated to standalone chains. The Substrate framework also powers chains outside Polkadot's security model. Kusama, Polkadot's "canary network," runs the same software with looser governance for testing.`,
    tradeoffs: `Polkadot's parachain auction model created early friction (slot prices were high, leading to complex crowd-loan structures) and has been simplified over time. The ecosystem is technically sophisticated but has lagged Ethereum and Solana in user-facing application adoption. Substrate as a framework is widely respected.`,
    whereToLearn: `Multi-chain bridging and cross-chain communication are also covered in the <a href="/glossary/crypto-bridge">crypto bridge</a> entry.`,
    faqs: [
      { q: 'What is a parachain?', a: 'A parachain is an independent blockchain that runs in parallel within the Polkadot ecosystem, sharing security with the relay chain. Each parachain has its own runtime logic and tokens but benefits from the validator set securing the whole network.' },
      { q: 'How is Polkadot different from Ethereum?', a: 'Ethereum is a single chain with shared smart contracts. Polkadot is a multi-chain network where each parachain can have its own logic and governance. Polkadot also uses a different consensus model (NPoS with relay chain coordination).' },
      { q: 'What is Kusama?', a: 'Kusama is Polkadot\'s "canary network" — a separate chain running similar code with faster governance and lower stakes, used for testing features before they roll out to Polkadot.' },
    ],
    related: ['eth', 'atom', 'ada'],
  },
  {
    symbol: 'atom', ticker: 'ATOM', name: 'Cosmos', category: 'L1',
    founded: 2019, founder: 'Tendermint / Jae Kwon, Ethan Buchman', consensus: 'Tendermint BFT (Proof-of-Stake)',
    maxSupply: 'Inflationary',
    shortDesc: 'The native token of the Cosmos Hub, the central blockchain of an interoperable ecosystem of independent chains connected via IBC.',
    whatItIs: `Cosmos is a network of independent, interoperable blockchains launched in 2019. The Cosmos Hub, the network's central chain, is secured by ATOM stakers. The broader Cosmos ecosystem is built on the Cosmos SDK, a framework that lets developers build custom blockchains with minimal effort, and IBC (Inter-Blockchain Communication), a protocol for trust-minimized cross-chain transfers.`,
    howItWorks: `Cosmos chains use Tendermint Byzantine Fault Tolerant consensus, which provides instant finality with a fixed validator set per chain. ATOM is staked to secure the Cosmos Hub, with validators rotating block production based on stake weight. IBC connects sovereign chains directly: rather than using bridges with custodians or trust assumptions, IBC chains exchange light client proofs to verify each other's state.`,
    useCases: `The Cosmos ecosystem includes major chains like Osmosis (DEX), Celestia (data availability), dYdX (perpetuals, migrated from Ethereum), Injective (financial primitives), and many more. ATOM specifically is used for staking, governance of the Cosmos Hub, and as one of several base assets traded on Osmosis. Most economic activity in the Cosmos ecosystem happens on application-specific chains rather than the Hub itself.`,
    tradeoffs: `The Cosmos design philosophy ("appchain thesis") prioritizes sovereignty: each chain has its own governance, validator set, and economic model. This is powerful for application teams but creates fragmented user experience and weaker shared security than Polkadot's parachain model. ATOM's role within its own ecosystem has been a long-running governance debate, with multiple proposals to expand its utility.`,
    whereToLearn: `IBC and cross-chain primitives are discussed in the <a href="/glossary/crypto-bridge">crypto bridge</a> entry.`,
    faqs: [
      { q: 'What is IBC?', a: 'IBC (Inter-Blockchain Communication) is a protocol that lets sovereign blockchains exchange tokens and messages with cryptographic security, without requiring a centralized bridge. It is the connective tissue of the Cosmos ecosystem.' },
      { q: 'Is ATOM the same as Cosmos?', a: 'ATOM is the native token of the Cosmos Hub, the central chain in the Cosmos ecosystem. The broader Cosmos network includes many independent chains, most of which have their own native tokens.' },
      { q: 'What is the Cosmos SDK?', a: 'The Cosmos SDK is a framework for building application-specific blockchains. Most chains in the Cosmos ecosystem (and many outside it) use the SDK as their foundation.' },
    ],
    related: ['dot', 'eth', 'tia'],
  },
  {
    symbol: 'near', ticker: 'NEAR', name: 'NEAR Protocol', category: 'L1',
    founded: 2020, founder: 'Illia Polosukhin, Alex Skidanov', consensus: 'Proof-of-Stake (Nightshade sharding)',
    maxSupply: '1,000,000,000',
    shortDesc: 'A sharded Layer 1 blockchain optimized for usability, with human-readable account names and built-in account abstraction.',
    whatItIs: `NEAR Protocol is a Layer 1 blockchain launched in 2020 by Illia Polosukhin and Alex Skidanov, both former Google researchers (Polosukhin was a co-author of the original Transformer paper that launched modern AI). NEAR's design priorities are usability and developer experience: human-readable account names like alice.near, native account abstraction, sharding for horizontal scaling, and a relatively friendly developer toolchain.`,
    howItWorks: `NEAR uses Nightshade sharding, splitting the network into multiple shards that process transactions in parallel. Validators are assigned across shards and rotate periodically. Block times are around one second. NEAR has built-in support for account abstraction via meta-transactions, letting developers offer gasless experiences to users (the dApp pays gas on the user's behalf).`,
    useCases: `NEAR has positioned itself toward AI and consumer applications. The "NEAR AI" initiative focuses on integrating NEAR with AI agents and verifiable inference. Applications include the Aurora EVM (Ethereum compatibility layer on NEAR), Ref Finance (DEX), and various consumer-friendly wallets. Account names being human-readable is a meaningful UX advantage for non-technical users.`,
    tradeoffs: `NEAR's ecosystem is smaller than Ethereum, Solana, or BSC, though it has carved out a distinct identity. Sharding is technically complex and has historically been challenging to implement well; NEAR's approach has matured but tradeoffs around state and cross-shard consistency remain.`,
    whereToLearn: `See the <a href="/glossary/staking">staking</a> entry for NEAR's consensus model context.`,
    faqs: [
      { q: 'Why does NEAR use account names instead of addresses?', a: 'NEAR\'s native naming system maps human-readable names (alice.near, defi.app) to public keys, making accounts much easier to identify than long hex strings. It is one of NEAR\'s main UX differentiators.' },
      { q: 'Is NEAR EVM-compatible?', a: 'Not natively. NEAR has its own runtime that uses WebAssembly. Aurora is an EVM compatibility layer that runs on NEAR, so Solidity contracts can be deployed there.' },
      { q: 'What is Nightshade sharding?', a: 'Nightshade is NEAR\'s sharding design: the network splits state and transaction processing across multiple shards, with validators rotating across them. The goal is horizontal scaling without compromising security.' },
    ],
    related: ['sol', 'eth', 'apt'],
  },
  {
    symbol: 'apt', ticker: 'APT', name: 'Aptos', category: 'L1',
    founded: 2022, founder: 'Aptos Labs / Mo Shaikh, Avery Ching', consensus: 'AptosBFT (Proof-of-Stake)',
    maxSupply: 'Inflationary',
    shortDesc: 'A Layer 1 blockchain built by former Meta engineers, using the Move programming language originally developed for the Diem project.',
    whatItIs: `Aptos is a Layer 1 blockchain that launched in October 2022, founded by former engineers from Meta's Diem (formerly Libra) project. Diem was Meta's stablecoin initiative that was eventually shut down due to regulatory pressure; Aptos and Sui were built by separate teams who preserved much of the technical work and the Move programming language. Aptos uses Move with its own customizations.`,
    howItWorks: `Aptos uses BFT consensus with parallel transaction execution: rather than processing transactions one at a time, the runtime identifies non-conflicting transactions and executes them concurrently. This enables high theoretical throughput. Move is a resource-oriented language: tokens and digital assets are first-class types with safety guarantees that prevent common exploits like double-spending or unauthorized cloning.`,
    useCases: `Aptos hosts a growing DeFi ecosystem including DEXs (Liquidswap, PancakeSwap), lending protocols, and liquid staking. The chain has positioned itself for institutional partnerships and consumer-grade applications. Performance characteristics are similar to Solana with a different programming model.`,
    tradeoffs: `Move is a less common language than Solidity or Rust, which limits the developer pool. Aptos and Sui both use Move but have diverged in implementation details, fragmenting the Move ecosystem. The ecosystem is younger than Ethereum or Solana.`,
    whereToLearn: `See <a href="/glossary/validator">validators</a> for staking context.`,
    faqs: [
      { q: 'What is Move?', a: 'Move is a resource-oriented programming language originally developed for Meta\'s Diem project. It treats digital assets as first-class language primitives with built-in safety properties. Aptos and Sui are the two major chains using Move.' },
      { q: 'How is Aptos different from Sui?', a: 'Both chains were built by former Meta Diem engineers and both use Move, but they made different design choices. Sui uses an object-centric model and parallel execution from the ground up; Aptos uses a more traditional account model with parallel execution as an optimization.' },
      { q: 'Does Aptos support smart contracts?', a: 'Yes, written in Move. The execution model differs from EVM smart contracts: Move emphasizes type safety and resource ownership at the language level.' },
    ],
    related: ['sui', 'sol', 'near'],
  },
  {
    symbol: 'sui', ticker: 'SUI', name: 'Sui', category: 'L1',
    founded: 2023, founder: 'Mysten Labs / Evan Cheng, Adeniyi Abiodun', consensus: 'Narwhal-Bullshark (DAG-based PoS)',
    maxSupply: '10,000,000,000',
    shortDesc: 'An object-oriented Layer 1 blockchain using a parallelized execution model, built by former Meta Diem engineers using the Move language.',
    whatItIs: `Sui is a Layer 1 blockchain that launched in May 2023, built by Mysten Labs, founded by former engineers from Meta's Diem project. Sui's defining design choice is its object-centric model: rather than account balances and contract storage, the world state is a collection of objects with explicit ownership. This enables aggressive parallelization: any transactions touching disjoint object sets can run concurrently without coordination.`,
    howItWorks: `Sui uses Narwhal for transaction dissemination and Bullshark (or Mysticeti) for consensus, a DAG-based design that sustains high throughput with low latency. Simple "owned object" transactions can finalize in sub-second time without going through full consensus, while shared-object transactions (involving objects multiple parties can use, like an AMM pool) go through the consensus path. Smart contracts are written in Sui Move, a variant of Move with object-aware features.`,
    useCases: `Sui has attracted significant DeFi (DeepBook, Cetus, Navi), gaming, and consumer applications. The object model is well-suited to NFTs and game items, which are first-class citizens with explicit ownership rather than entries in a contract's storage. Stablecoins are present but less prevalent than on Ethereum or Solana.`,
    tradeoffs: `Sui's object model is powerful but requires a different mental model than Ethereum-style state. Move (in any variant) has a smaller developer community than Solidity. The Sui and Aptos ecosystems share a language but have diverged on details, creating compatibility friction. The chain is young; its track record is shorter than longer-lived alternatives.`,
    whereToLearn: `For comparison with similar architectures, see the <a href="/glossary/validator">validator</a> and <a href="/glossary/staking">staking</a> entries.`,
    faqs: [
      { q: 'What is the object-centric model?', a: 'In Sui, the world state is a collection of objects rather than account balances. Each object has an explicit owner. Tokens are objects, NFTs are objects, even shared resources like AMM pools are objects (with shared-ownership flags). This enables parallel execution of transactions that touch disjoint objects.' },
      { q: 'How fast is Sui?', a: 'Sui claims throughput in the tens of thousands of TPS for owned-object transactions and high thousands for shared-object transactions. Latency for simple transfers is sub-second.' },
      { q: 'Is Sui Move the same as Aptos Move?', a: 'Both are descendants of the Move language from Meta\'s Diem project, but Sui Move has been adapted to Sui\'s object-centric architecture and differs from Aptos Move in important ways. Smart contracts cannot be ported between the two without modification.' },
    ],
    related: ['apt', 'sol', 'near'],
  },

  // ===== L2 / Scaling =====
  {
    symbol: 'arb', ticker: 'ARB', name: 'Arbitrum', category: 'L2',
    founded: 2021, founder: 'Offchain Labs / Steven Goldfeder, Ed Felten, Harry Kalodner', consensus: 'Optimistic Rollup',
    maxSupply: '10,000,000,000',
    shortDesc: 'The largest Ethereum Layer 2 by total value locked, an optimistic rollup that runs the Ethereum Virtual Machine with much lower fees.',
    whatItIs: `Arbitrum is an Ethereum <a href="/glossary/layer-2">Layer 2</a> network developed by Offchain Labs. It is the largest L2 by total value locked, hosting major DeFi protocols (GMX, Camelot, Aave deployment) and a significant fraction of Ethereum's economic activity in 2026. Arbitrum is an <a href="/glossary/optimistic-rollup">optimistic rollup</a>: it executes transactions off-chain, posts compressed batches to Ethereum L1, and relies on a 7-day fraud-proof window to catch invalid state transitions.`,
    howItWorks: `Arbitrum's main chain is Arbitrum One; it also operates Arbitrum Nova (a lower-cost variant for gaming and social applications). Transactions execute on Arbitrum's sequencer, which orders them and posts batches to Ethereum. The execution environment is fully EVM-compatible, so any Ethereum smart contract works on Arbitrum without modification. Withdrawals to L1 take 7 days unless using a third-party "fast bridge" that fronts the funds.`,
    useCases: `DeFi dominates: GMX for perpetuals, multiple AMMs, lending protocols (Aave, Radiant), liquid staking. Arbitrum has also grown an on-chain gaming ecosystem and hosts significant stablecoin supply (USDC, USDT). The ARB token launched in March 2023 via airdrop and is used for governance of the Arbitrum DAO.`,
    tradeoffs: `Optimistic rollups have a 7-day withdrawal window unless you use a third-party bridge. Arbitrum's sequencer is currently centralized (Offchain Labs operates it), with decentralization on the roadmap. As an L2, Arbitrum still depends on Ethereum L1 for security and data availability; high L1 fees increase L2 costs.`,
    whereToLearn: `For deep context, see <a href="/glossary/layer-2">Layer 2</a>, <a href="/glossary/optimistic-rollup">optimistic rollup</a>, and <a href="/glossary/rollup">rollup</a> in the glossary.`,
    faqs: [
      { q: 'How is Arbitrum different from Ethereum?', a: 'Arbitrum runs the same EVM and inherits Ethereum security but executes transactions off the main chain, posting compressed batches back. Fees are 10-100x lower than Ethereum L1.' },
      { q: 'Why does it take 7 days to withdraw from Arbitrum?', a: 'Optimistic rollups assume batches are valid and use a 7-day challenge window for fraud proofs. Native withdrawals must wait this period; third-party fast bridges front the funds for a fee, accepting the delay themselves.' },
      { q: 'What is ARB used for?', a: 'ARB is the governance token of the Arbitrum DAO. Token holders vote on protocol upgrades, treasury allocations, and ecosystem grants. ARB is not used for paying gas on Arbitrum; gas is paid in ETH.' },
    ],
    related: ['op', 'eth', 'pol'],
  },
  {
    symbol: 'op', ticker: 'OP', name: 'Optimism', category: 'L2',
    founded: 2021, founder: 'OP Labs / Karl Floersch, Jinglan Wang, Ben Jones', consensus: 'Optimistic Rollup',
    maxSupply: '4,294,967,296',
    shortDesc: 'An Ethereum Layer 2 using the OP Stack, the open-source rollup framework powering an interoperable "Superchain" of major L2s.',
    whatItIs: `Optimism is an Ethereum <a href="/glossary/layer-2">Layer 2</a> developed by OP Labs. The OP Mainnet chain is one of the major Ethereum L2s, but Optimism's broader contribution is the OP Stack: an open-source, modular rollup framework that other L2s have adopted, including Coinbase's Base, Worldcoin's World Chain, Sony's Soneium, and others. Together these form the "Superchain": a network of interoperable L2s sharing the OP Stack.`,
    howItWorks: `OP Mainnet is an <a href="/glossary/optimistic-rollup">optimistic rollup</a> that executes EVM-compatible transactions and posts batches to Ethereum L1. OP Stack chains share design but maintain separate state; the Superchain plan involves shared sequencing and atomic cross-chain composability between participating chains. The OP token is governance for the Optimism Collective, the DAO that allocates retroactive public-goods funding to projects building on the OP Stack.`,
    useCases: `OP Mainnet hosts DeFi (Velodrome DEX, Synthetix, Aave), gaming, and consumer apps. The most strategically important development is the Superchain ecosystem: Base alone (built on OP Stack) is one of the largest L2s and brings significant Coinbase-driven retail volume. The OP token's value derives partly from its governance role over the Optimism treasury and partly from sequencer fees redirected to the Collective.`,
    tradeoffs: `Like all optimistic rollups, native withdrawals to L1 take 7 days. The Superchain vision creates value but also requires coordination across multiple independent chains, each with their own teams and incentives. OP's tokenomics include a relatively large initial allocation to airdrops and the Collective.`,
    whereToLearn: `See <a href="/glossary/optimistic-rollup">optimistic rollup</a> and <a href="/glossary/layer-2">Layer 2</a> for technical context.`,
    faqs: [
      { q: 'What is the OP Stack?', a: 'The OP Stack is an open-source, modular framework for building optimistic rollup blockchains. It is used by OP Mainnet, Base, World Chain, Soneium, and others. Chains using OP Stack can theoretically interoperate as part of the Superchain.' },
      { q: 'Is Base part of Optimism?', a: 'Base is built on the OP Stack and is part of the Superchain ecosystem, but it is operated by Coinbase. Base contributes a portion of its sequencer fees to the Optimism Collective.' },
      { q: 'How is OP different from ARB?', a: 'Both are optimistic rollups on Ethereum. The OP token governs the Optimism Collective (which funds public goods); ARB governs the Arbitrum DAO. They have different ecosystems, slightly different technical choices, and different governance philosophies.' },
    ],
    related: ['arb', 'eth', 'pol'],
  },
  {
    symbol: 'pol', ticker: 'POL', name: 'Polygon', category: 'L2',
    founded: 2017, founder: 'Polygon Labs / Sandeep Nailwal, Jaynti Kanani, Anurag Arjun', consensus: 'Multiple (PoS, ZK rollup)',
    maxSupply: 'Inflationary',
    shortDesc: 'A multi-chain Ethereum scaling ecosystem including the Polygon PoS chain, zkEVM, and the AggLayer cross-chain settlement layer.',
    whatItIs: `Polygon is a multi-chain Ethereum scaling ecosystem. The original Polygon PoS chain (launched 2020) is a sidechain with EVM compatibility and low fees, secured by its own validator set rather than Ethereum directly. Polygon zkEVM is a true <a href="/glossary/zk-rollup">ZK rollup</a> that posts validity proofs to Ethereum. The AggLayer is a coordination layer connecting Polygon chains with each other and with external L2s. POL is the network's native token, replacing the older MATIC token via a 1:1 migration.`,
    howItWorks: `Polygon PoS uses a Heimdall + Bor architecture: validators stake POL, propose blocks on Bor (the EVM execution layer), and finalize them through Heimdall (Tendermint-based). zkEVM uses ZK proofs for L1 settlement, eliminating the optimistic rollup challenge window. The AggLayer aims to provide unified liquidity and atomic cross-chain transactions between participating chains.`,
    useCases: `Polygon PoS hosts a large DeFi and NFT ecosystem (Aave, Uniswap, OpenSea collections), and significant stablecoin supply. It is widely used by enterprise integrations (Starbucks, Reddit, Nike) due to low fees and EVM compatibility. zkEVM caters to use cases requiring stronger Ethereum security guarantees. The CDK (Chain Development Kit) lets projects launch their own ZK-secured chains.`,
    tradeoffs: `Polygon PoS is technically a sidechain with its own security, not a true rollup, which is a trade-off versus zkEVM. The MATIC-to-POL migration introduced complexity that some users found confusing. Polygon's multi-chain strategy has many parts; understanding which chain to use for which purpose requires effort.`,
    whereToLearn: `See <a href="/glossary/zk-rollup">ZK rollup</a> and <a href="/glossary/layer-2">Layer 2</a> for technical background.`,
    faqs: [
      { q: 'What happened to MATIC?', a: 'MATIC was Polygon\'s original token. In 2024-2025 it was migrated 1:1 to POL, the new native token of the broader Polygon ecosystem (PoS chain, zkEVM, AggLayer).' },
      { q: 'Is Polygon a Layer 2?', a: 'Polygon\'s zkEVM is a true Ethereum L2 (ZK rollup). The Polygon PoS chain is technically a sidechain with its own validator set, often called an L2 informally but with different security properties.' },
      { q: 'What is the AggLayer?', a: 'The AggLayer is a settlement and coordination layer that aims to connect Polygon chains and external L2s, enabling unified liquidity and atomic cross-chain transactions. It is part of Polygon\'s long-term scaling strategy.' },
    ],
    related: ['eth', 'arb', 'op'],
  },

  // ===== DeFi tokens =====
  {
    symbol: 'link', ticker: 'LINK', name: 'Chainlink', category: 'DeFi',
    founded: 2017, founder: 'SmartContract Labs / Sergey Nazarov, Steve Ellis', consensus: 'Token on Ethereum and other chains',
    maxSupply: '1,000,000,000',
    shortDesc: 'The dominant decentralized oracle network, providing on-chain price feeds, randomness, and cross-chain messaging to most of DeFi.',
    whatItIs: `Chainlink is the dominant decentralized oracle network, providing the data feeds that <a href="/glossary/smart-contract">smart contracts</a> need to interact with the outside world. <a href="/glossary/blockchain-oracle">Oracles</a> bring off-chain information (asset prices, weather, sports scores, randomness) onto the blockchain in a verifiable way. Chainlink launched its mainnet in 2019 and has become the de-facto standard for price oracles in DeFi, securing tens of billions in TVL across hundreds of protocols.`,
    howItWorks: `Chainlink price feeds aggregate data from multiple independent sources, with a decentralized network of node operators submitting signed prices. The network reaches consensus on a final value (typically a median) and posts it on-chain. Smart contracts read the latest price from the feed contract. Beyond price feeds, Chainlink offers VRF (verifiable random function) for fair randomness, CCIP (Cross-Chain Interoperability Protocol) for cross-chain messaging, and Functions for arbitrary off-chain computation.`,
    useCases: `Lending protocols (Aave, Compound) use Chainlink to determine collateral values for liquidation thresholds. Derivatives protocols use it for settlement prices. Insurance protocols use it for parametric triggers. Stablecoins use it to maintain pegs. Beyond DeFi, Chainlink VRF powers fairness in gaming and NFT mints. CCIP is increasingly used for cross-chain bridges by major protocols.`,
    tradeoffs: `Oracle manipulation has caused major DeFi exploits (typically not Chainlink directly, but through misuse or alternative oracles); choosing oracle architecture is a critical security decision. Chainlink is more centralized in node operator selection than some alternatives, though more decentralized than first-party oracles. Costs accumulate: every oracle update is a paid on-chain transaction, which adds up across protocols.`,
    whereToLearn: `See the <a href="/glossary/blockchain-oracle">blockchain oracle</a> entry for the broader category and the <a href="/glossary/defi">DeFi</a> entry for context.`,
    faqs: [
      { q: 'What is Chainlink used for?', a: 'Chainlink provides decentralized data feeds (mainly asset prices) to smart contracts, plus verifiable randomness, cross-chain messaging, and arbitrary computation. It is the dominant oracle network in DeFi.' },
      { q: 'How does Chainlink ensure price accuracy?', a: 'Price feeds aggregate data from many independent sources via a network of node operators, who reach consensus on a final value (typically a median). This makes manipulating a single source ineffective.' },
      { q: 'Is LINK used to pay for oracle queries?', a: 'Yes, in part. Node operators are paid in LINK for providing data, and applications consuming Chainlink services pay node operators. Some services have introduced subscription models in addition to per-query payment.' },
    ],
    related: ['uni', 'aave', 'eth'],
  },
  {
    symbol: 'uni', ticker: 'UNI', name: 'Uniswap', category: 'DeFi',
    founded: 2018, founder: 'Hayden Adams', consensus: 'Token on Ethereum and many L2s',
    maxSupply: '1,000,000,000',
    shortDesc: 'The governance token of Uniswap, the largest decentralized exchange on Ethereum and the original AMM that defined DeFi.',
    whatItIs: `Uniswap is the largest decentralized exchange on Ethereum and the canonical implementation of the <a href="/glossary/amm">automated market maker</a> model. It was launched in 2018 by Hayden Adams, inspired by ideas Vitalik Buterin had written about. Uniswap V2 (2020) introduced the simple constant-product formula that remains the reference design for AMMs everywhere. UNI is the governance token, distributed via a 2020 airdrop that gave 400 UNI to every wallet that had used the protocol.`,
    howItWorks: `Uniswap V2 used a single constant-product formula <code>x * y = k</code> for all pools. Uniswap V3 (2021) introduced concentrated liquidity, where LPs deposit into specific price ranges for higher capital efficiency. Uniswap V4 (2024-2025) adds "hooks" — programmable extensions that let pool creators add custom logic for fees, dynamic curves, oracles, and more. UNI holders vote on protocol upgrades, fee structure, and treasury allocations.`,
    useCases: `Trading: Uniswap is where most ERC-20 tokens get their first market. <a href="/glossary/liquidity-pool">Liquidity provision</a>: anyone can deposit tokens and earn trading fees. Permissionless market creation: any token pair can have a Uniswap market without listing fees or approvals. The protocol is deployed on Ethereum and most major L2s, with multi-chain governance executed via cross-chain messaging.`,
    tradeoffs: `LPs face <a href="/glossary/slippage">impermanent loss</a> when token prices diverge significantly from when they deposited. The constant-product formula is capital-inefficient for stablecoin pairs (Curve handles those better). Uniswap's "fee switch" — sending a fraction of trading fees to UNI holders — was debated for years and has been activated in limited form via governance.`,
    whereToLearn: `See <a href="/glossary/amm">AMM</a>, <a href="/glossary/liquidity-pool">liquidity pool</a>, and <a href="/glossary/slippage">slippage</a> for foundational concepts.`,
    faqs: [
      { q: 'How is Uniswap different from a centralized exchange?', a: 'Uniswap is a smart contract anyone can interact with directly. There is no order book, no account, no KYC, no listing process. Trades execute against liquidity pools at formula-determined prices.' },
      { q: 'What is impermanent loss?', a: 'Impermanent loss is the gap between holding two tokens directly and depositing them as Uniswap liquidity, when the token prices diverge. The LP\'s share of the pool gets rebalanced toward the falling asset, locking in less upside than just holding.' },
      { q: 'Does UNI generate income?', a: 'Historically no, though the "fee switch" governance mechanism allows UNI holders to vote on whether a portion of pool fees should be routed to the UNI treasury or stakers. This has been activated in limited form.' },
    ],
    related: ['link', 'aave', 'mkr'],
  },
  {
    symbol: 'aave', ticker: 'AAVE', name: 'Aave', category: 'DeFi',
    founded: 2017, founder: 'Stani Kulechov', consensus: 'Token on Ethereum and many L2s',
    maxSupply: '16,000,000',
    shortDesc: 'A leading decentralized lending protocol where users deposit collateral to borrow assets, with floating interest rates set by utilization curves.',
    whatItIs: `Aave is a decentralized lending protocol that lets users deposit crypto as collateral to borrow other assets. It launched in 2020 (originally as ETHLend in 2017 before rebranding) and has grown into one of the largest DeFi protocols by total value locked. Lenders earn interest on deposits; borrowers pay variable interest rates determined by pool utilization. AAVE is the governance token of the Aave DAO.`,
    howItWorks: `Each Aave market accepts a list of supported assets. Users deposit and receive aTokens that auto-rebase to reflect accumulated interest. Borrowing requires posting collateral worth more than the borrowed amount (typical loan-to-value: 50-80%). If collateral value falls below a threshold, positions can be liquidated by anyone in exchange for a discount on the collateral. Interest rates float based on utilization: higher demand for borrowing pushes rates up, attracting more lenders.`,
    useCases: `The dominant use case is leveraged trading and shorting: borrow stablecoins against ETH to buy more ETH (long leverage), or borrow ETH against stablecoins to short ETH. Other uses: yield farming (deposit a stablecoin earning yield, borrow another stablecoin and lend it elsewhere), institutional cash management, and flash loans (instant uncollateralized loans that must be repaid in the same transaction). Aave runs on Ethereum and most major L2s, with cross-chain functionality via CCIP and proprietary infrastructure.`,
    tradeoffs: `Liquidation risk is the main user-facing risk: if collateral value drops while you have an open loan, your position can be liquidated, costing you a portion of the collateral. Smart contract risk applies to all DeFi. Interest rates can spike during demand surges, sometimes making positions unprofitable. AAVE governance has historically navigated complex risk parameters across many markets.`,
    whereToLearn: `See <a href="/glossary/defi">DeFi</a> for the category context. <a href="/api/pro/defi-tvl">DeFi TVL premium endpoint</a> tracks Aave alongside other protocols.`,
    faqs: [
      { q: 'What is the difference between depositing and lending?', a: 'In Aave, depositing IS lending: when you deposit USDC, you receive aUSDC tokens that earn interest. Other users can borrow that USDC by posting collateral.' },
      { q: 'What happens if my position gets liquidated?', a: 'A liquidator repays a portion of your debt and receives the equivalent collateral plus a discount (typically 5-10%). You keep the remaining collateral but lose the liquidation premium.' },
      { q: 'What are flash loans?', a: 'Flash loans are uncollateralized loans that must be borrowed and repaid in a single transaction. They are useful for arbitrage, collateral swaps, and refinancing without needing capital upfront. They are also the source of many DeFi exploits.' },
    ],
    related: ['mkr', 'uni', 'usdc'],
  },
  {
    symbol: 'mkr', ticker: 'MKR', name: 'Maker', category: 'DeFi',
    founded: 2017, founder: 'MakerDAO / Rune Christensen', consensus: 'Token on Ethereum',
    maxSupply: 'Variable; deflationary through buyback-and-burn',
    shortDesc: 'The governance and recapitalization token of MakerDAO, the protocol behind DAI, the original decentralized stablecoin.',
    whatItIs: `Maker (MKR) is the governance and recapitalization token of MakerDAO, the protocol that issues DAI, the original decentralized over-collateralized <a href="/glossary/stablecoin">stablecoin</a>. MakerDAO launched in 2017; DAI has been live since December 2017 and remains one of the most important stablecoins in DeFi, particularly favored where issuer-trust matters less than collateral transparency. The protocol has been undergoing a "Endgame" transformation to subdivide governance into smaller subDAOs and rebrand to Sky.`,
    howItWorks: `Users open Vaults by depositing collateral (initially just ETH; now expanded to many crypto and real-world assets) and minting DAI against that collateral. The collateralization ratio must stay above a minimum (typically 130-150%) or the Vault is liquidated. Stability fees (interest charged on minted DAI) are paid in DAI; this revenue accrues to the protocol and historically has been used to buy back and burn MKR. MKR holders govern protocol parameters: which collateral types are accepted, what stability fees apply, how risk is managed.`,
    useCases: `DAI is widely used in DeFi as a stable unit of account, especially in protocols where users want to avoid issuer-trust assumptions of USDC or USDT. MKR holders are the protocol's "lender of last resort": if collateral values fall faster than liquidations can happen, MKR is minted and sold to recapitalize the protocol, diluting holders. This makes MKR a productive but risk-bearing asset.`,
    tradeoffs: `MKR's governance token model places real risk on holders: in the March 2020 "Black Thursday" event, MKR was minted and sold to cover a shortfall after Vault liquidations failed. The Endgame restructuring has been controversial within the community, with debates over whether splitting MakerDAO into subDAOs strengthens or fragments the protocol.`,
    whereToLearn: `See <a href="/glossary/stablecoin">stablecoin</a> for the asset category and <a href="/glossary/defi">DeFi</a> for context.`,
    faqs: [
      { q: 'What is the difference between DAI and MKR?', a: 'DAI is the stablecoin Maker issues. MKR is the governance token of the protocol. DAI tracks $1; MKR\'s price floats based on protocol revenue and risk.' },
      { q: 'How is DAI different from USDC?', a: 'USDC is centralized: Circle holds reserves and can freeze tokens. DAI is over-collateralized by on-chain assets and governed by MKR holders. DAI\'s peg holds because anyone can mint DAI by depositing collateral or arbitrage divergences.' },
      { q: 'What is MakerDAO Endgame?', a: 'Endgame is the long-term restructuring of MakerDAO into smaller subDAOs and a rebrand of the broader ecosystem to "Sky" with a new token (SKY). The transformation has multiple phases and remains in progress.' },
    ],
    related: ['dai', 'aave', 'usdc'],
  },
  {
    symbol: 'dai', ticker: 'DAI', name: 'Dai', category: 'Stablecoin',
    founded: 2017, founder: 'MakerDAO', consensus: 'Token on Ethereum and many chains',
    maxSupply: 'Variable; backed by over-collateralized debt',
    shortDesc: 'The original decentralized over-collateralized stablecoin, soft-pegged to the US dollar and issued by the MakerDAO protocol.',
    whatItIs: `Dai (DAI) is a US dollar-pegged <a href="/glossary/stablecoin">stablecoin</a> issued by MakerDAO, distinct from USDT and USDC because it is decentralized and backed by on-chain collateral rather than off-chain reserves. DAI was the first widely-used decentralized stablecoin and remains an important alternative for users who want exposure to a dollar-pegged asset without trusting a centralized issuer. The token is being gradually rebranded to USDS as part of the MakerDAO Endgame plan, though DAI continues to circulate alongside USDS.`,
    howItWorks: `DAI is minted when users open Vaults in <a href="/glossary/defi">MakerDAO</a> and deposit collateral (ETH, wstETH, USDC, real-world asset tokens, and more). The minted DAI must be over-collateralized (typically 130-150% minimum). When users repay their DAI debt, the underlying collateral is returned. The peg holds via two mechanisms: arbitrage (when DAI trades above $1, more people open Vaults to mint and sell DAI) and the Peg Stability Module (an automated swap with USDC at 1:1 to absorb peg deviations).`,
    useCases: `DAI is widely used in DeFi as a stable unit of account, particularly in lending protocols and DEX pairs. It is favored by users who avoid centralized stablecoin exposure (USDC, USDT) for ideological or regulatory reasons. DAI is also the unit of denomination for many DeFi yield strategies, futures contracts, and prediction markets.`,
    tradeoffs: `DAI's peg has held remarkably well but did briefly trade below $0.95 during the March 2020 ETH crash and the March 2023 USDC SVB scare. Over-collateralization makes DAI capital-inefficient compared to USDC. The increasing use of USDC and US Treasuries as backing collateral makes DAI less "decentralized" than the original ETH-backed design.`,
    whereToLearn: `See <a href="/glossary/stablecoin">stablecoin</a> for the broader category and the <a href="/api/pro/stablecoin-flows">stablecoin-flows endpoint</a> for issuance data.`,
    faqs: [
      { q: 'How is DAI different from USDC?', a: 'USDC is issued by Circle and backed by off-chain reserves (cash + Treasuries). DAI is minted by anyone who deposits collateral in MakerDAO and is governed by MKR holders. DAI is decentralized; USDC is centralized.' },
      { q: 'Has DAI ever lost its peg?', a: 'Briefly, on rare occasions: during the March 2020 ETH crash and the March 2023 USDC depeg event (since DAI is partially backed by USDC). In both cases the peg recovered within hours to days.' },
      { q: 'What is USDS?', a: 'USDS is a successor stablecoin from the MakerDAO Endgame plan. It is functionally similar to DAI and issued by the same protocol, with the rebrand to "Sky" branding. DAI and USDS coexist in 2026.' },
    ],
    related: ['usdc', 'usdt', 'mkr'],
  },

  // ===== AI / Compute =====
  {
    symbol: 'tao', ticker: 'TAO', name: 'Bittensor', category: 'AI',
    founded: 2021, founder: 'Opentensor Foundation / Jacob Steeves, Ala Shaabana', consensus: 'Yuma Consensus (PoS variant)',
    maxSupply: '21,000,000',
    shortDesc: 'A decentralized machine intelligence network where subnets compete to provide AI services like inference, search, and image generation.',
    whatItIs: `Bittensor is a network for decentralized AI infrastructure. The protocol coordinates a set of "subnets," each focused on a specific machine intelligence task: language model inference, embedding generation, image synthesis, scraping, prediction, and many others. Within each subnet, "miners" provide the actual model inference and "validators" score miners' outputs for quality. TAO is emitted to subnet participants based on validator-determined contributions, similar to how Bitcoin issues BTC to miners.`,
    howItWorks: `The Bittensor blockchain runs on Substrate (the same framework as Polkadot). Each block, ~7,200 TAO are emitted across all subnets in proportion to validator stake weight. Within a subnet, validators query miners with task-specific prompts, score the responses, and the subnet's emission is distributed proportionally. Subnets are launched by paying TAO to lock as collateral; subnets that produce useful work and attract validator stake earn larger emissions over time.`,
    useCases: `Subnet 1 (text generation), Subnet 9 (training), Subnet 18 (Cortex.t for chat APIs), Subnet 21 (FileTAO for storage), Subnet 23 (NicheImage for image gen), and dozens of others provide actual AI services. Token holders can stake TAO to validators as a yield-bearing position. Some applications integrate Bittensor as an AI inference layer; the interoperability story is improving but remains less mature than centralized alternatives.`,
    tradeoffs: `Validator rewards depend on accurately scoring miner outputs, but scoring AI quality is itself difficult: subnets have grappled with miners gaming the scoring function. The decentralization claim is real but the network's actual usage by external applications is still small relative to centralized AI providers. The 21M TAO cap and Bitcoin-style halvings give it a clean monetary narrative; whether AI economics align with that narrative long-term is a real question.`,
    whereToLearn: `See <a href="/glossary/inference">inference</a> and <a href="/glossary/large-language-model">large language model</a> for foundational AI concepts.`,
    faqs: [
      { q: 'What is a Bittensor subnet?', a: 'A subnet is a specialized network within Bittensor focused on one type of machine intelligence task (text generation, image synthesis, search, etc.). Each subnet has its own miners and validators competing within the subnet for emissions.' },
      { q: 'How is TAO emitted?', a: 'TAO is emitted at a fixed rate per block (~7,200/block across all subnets), distributed to subnet participants based on validator stake weight and miner contribution scores. The emission halves on a schedule similar to Bitcoin.' },
      { q: 'Can I use Bittensor AI services as an end user?', a: 'Yes, indirectly. Some subnets expose APIs (Cortex.t for chat, others for image generation) that wrap underlying miner outputs into a usable interface. Direct subnet querying requires running a validator or using a third-party gateway.' },
    ],
    related: ['render', 'fil', 'eth'],
  },
  {
    symbol: 'render', ticker: 'RENDER', name: 'Render Network', category: 'AI',
    founded: 2017, founder: 'OTOY / Jules Urbach', consensus: 'Token on Solana (migrated from Ethereum)',
    maxSupply: '644,168,762',
    shortDesc: 'A decentralized GPU rendering network where artists pay node operators to render 3D scenes, generative AI, and video production at scale.',
    whatItIs: `Render Network is a decentralized GPU compute network originally launched by OTOY in 2017 as a way for 3D artists to access distributed rendering capacity. Artists submit rendering jobs (3D scenes, video frames, generative AI workloads); a network of node operators with GPUs perform the rendering and earn RENDER tokens. The network expanded substantially during the AI boom as generative model inference became a major use case alongside traditional graphics work.`,
    howItWorks: `Users submit jobs with specifications and a payment in USD-denominated terms; node operators (GPU providers) accept jobs based on their hardware and pricing. Completed work is verified by client-side checks; payment is escrowed in smart contracts and released on confirmation. The token migrated from Ethereum to Solana in 2024 to reduce transaction costs and improve throughput. Tiered pricing exists for time-sensitive vs cost-sensitive jobs.`,
    useCases: `Original use case: distributed rendering for VFX studios, game developers, and 3D artists. Expanded use cases: AI image generation, video synthesis, 3D model generation, and any GPU-bound workload that can be parallelized across machines. Some users prefer Render over centralized providers for cost arbitrage; others use it for redundancy or to access GPU types not available on AWS/GCP.`,
    tradeoffs: `Reliability and SLAs are looser than centralized providers. Job verification is improving but the trust model is more complex than "AWS gives me the answer." Token economics depend on continued workload growth; if AI compute consolidates back into hyperscalers, network demand could decline. The migration from Ethereum to Solana removed gas friction but also fragmented historical liquidity.`,
    whereToLearn: `See <a href="/glossary/inference">inference</a> for context on AI compute economics.`,
    faqs: [
      { q: 'What can I render on Render Network?', a: '3D scenes (Octane, Blender, Cinema 4D), AI image and video generation models, and increasingly arbitrary GPU compute jobs. The network started in graphics but has broadened toward general AI workloads.' },
      { q: 'How is Render different from AWS GPU instances?', a: 'Render is a marketplace where many small node operators compete on price and capacity, often offering rates below AWS for the same hardware. Tradeoffs are reliability, geographic distribution, and operational control.' },
      { q: 'Why did RENDER migrate from Ethereum to Solana?', a: 'Lower transaction fees and faster settlement. Many micropayments occur in the rendering workflow; Ethereum gas costs were a meaningful fraction of small jobs. Solana economics make these payments practical at the scale Render operates.' },
    ],
    related: ['tao', 'fil', 'sol'],
  },
  {
    symbol: 'fil', ticker: 'FIL', name: 'Filecoin', category: 'Infra',
    founded: 2020, founder: 'Protocol Labs / Juan Benet', consensus: 'Proof-of-Replication, Proof-of-Spacetime',
    maxSupply: '2,000,000,000',
    shortDesc: 'A decentralized storage network where node operators provide hard-disk capacity for hosting files, paid in FIL.',
    whatItIs: `Filecoin is a decentralized storage network created by Protocol Labs (the team behind IPFS, the InterPlanetary File System). Users pay FIL to store files; storage providers (node operators) commit hard-disk capacity to the network and earn FIL for storing data and proving they continue to hold it over time. The network launched in October 2020 and has grown into one of the largest decentralized storage networks by total committed capacity.`,
    howItWorks: `Storage providers stake FIL collateral and prove they store data through Proof-of-Replication (showing they have a unique encoded copy) and Proof-of-Spacetime (periodic proofs that they still have the data). If a provider fails to produce proofs, their staked FIL is slashed. Users find providers through a market mechanism: storage deals are negotiated based on price, retrieval speed, and provider reputation. Filecoin Plus (Fil+) gives bonus FIL rewards to providers storing "useful" data verified by community gatekeepers.`,
    useCases: `Long-term archival storage of public datasets (Wikipedia archives, Internet Archive backups, research data). Hot storage for Web3 applications (NFT metadata, video streaming). Backup and redundancy for centralized services. Some scientific consortia use Filecoin for distributed data preservation. Retrieval performance has historically been a weak point compared to centralized CDNs but has improved through retrieval markets and caching layers.`,
    tradeoffs: `Filecoin emphasizes proof of storage rather than retrieval performance, which means accessing stored files can be slower than centralized alternatives. The market for "useful" storage (Fil+) has been gamed by providers padding capacity with low-value data. Token economics include large emissions to storage providers, which has historically created supply pressure on FIL price.`,
    whereToLearn: `See the <a href="/glossary/cdn">CDN</a> entry for the centralized alternative model.`,
    faqs: [
      { q: 'How is Filecoin different from IPFS?', a: 'IPFS is the protocol for content-addressed storage and retrieval; it is free to use but provides no incentive to store data long-term. Filecoin adds an economic layer on top: users pay providers to guarantee storage with cryptographic proofs.' },
      { q: 'Can I retrieve my files quickly from Filecoin?', a: 'Retrieval speed depends on the provider you stored with and how recently the data has been accessed. Pure cold-storage Filecoin is slower than centralized cloud; warm-cache layers and retrieval markets close the gap for frequently-accessed data.' },
      { q: 'What is Filecoin Plus?', a: 'Filecoin Plus (Fil+) gives storage providers bonus rewards for storing "useful" data verified by notaries. The mechanism aims to incentivize real-world data preservation rather than empty capacity commitments.' },
    ],
    related: ['render', 'tao', 'eth'],
  },

  // ===== Privacy =====
  {
    symbol: 'xmr', ticker: 'XMR', name: 'Monero', category: 'Privacy',
    founded: 2014, founder: 'Community-led (forked from Bytecoin)', consensus: 'Proof-of-Work (RandomX)',
    maxSupply: 'Tail emission: 0.6 XMR per block forever',
    shortDesc: 'The leading privacy-focused cryptocurrency, using ring signatures, stealth addresses, and confidential transactions to obscure sender, recipient, and amount by default.',
    whatItIs: `Monero is a privacy-focused cryptocurrency launched in April 2014 as a fork of Bytecoin. It is the most widely-used privacy coin and the most studied private digital currency outside of Zcash. Unlike Bitcoin where transaction amounts and addresses are visible on a public ledger, Monero hides senders (via ring signatures), recipients (via stealth addresses), and amounts (via confidential transactions and bulletproofs) by default. Privacy is mandatory, not optional.`,
    howItWorks: `Ring signatures mix the actual signer's transaction with several decoy inputs, so observers cannot tell which input is the real one. Stealth addresses generate a unique one-time receiving address for every transaction, breaking the link between the published address and on-chain activity. Confidential transactions encrypt the amount being sent while still allowing the network to verify it does not exceed the inputs. Bulletproofs reduced the size and verification cost of confidential transactions starting in 2018. Monero uses RandomX, a CPU-friendly mining algorithm that resists ASIC dominance.`,
    useCases: `Private digital cash: payments where the parties want fungibility (the property that one unit is interchangeable with any other). Charity and journalism in oppressive regimes (e.g., Wikileaks, dissident funding). Some illicit use, which has driven law-enforcement scrutiny and exchange delistings. Even in legitimate use, Monero's privacy is a feature, not a workaround.`,
    tradeoffs: `Privacy by default has come at a cost: many regulated exchanges have delisted XMR (Binance, Kraken in some jurisdictions) due to compliance pressure. Privacy is also computationally expensive: Monero transactions are larger and slower to verify than Bitcoin. Regulatory risk is real and ongoing in multiple jurisdictions. Supporters argue financial privacy is a fundamental right; critics point to the regulatory cost.`,
    whereToLearn: `For broader privacy context, see the <a href="/glossary/encryption">encryption</a> and <a href="/glossary/zero-day">zero-day</a> glossary entries.`,
    faqs: [
      { q: 'How is Monero different from Bitcoin?', a: 'Bitcoin transactions are publicly visible: anyone can trace the flow of coins. Monero hides senders, recipients, and amounts by default, making transactions untraceable in normal operation.' },
      { q: 'Has Monero been broken?', a: 'There have been academic attacks on early Monero ring signatures (mostly addressed by protocol upgrades) and various heuristics for narrowing the anonymity set. The current protocol provides strong privacy properties; breaking it requires either protocol-level cryptanalysis or operator-level metadata leaks.' },
      { q: 'Why has Monero been delisted from some exchanges?', a: 'Privacy coins face increasing regulatory pressure due to AML/KYC concerns. Some exchanges have proactively delisted XMR rather than maintain compliance with stricter rules in jurisdictions like the UK, Japan, and parts of the EU.' },
    ],
    related: ['btc', 'zec'],
  },

  // ===== Other utility =====
  {
    symbol: 'inj', ticker: 'INJ', name: 'Injective', category: 'L1',
    founded: 2020, founder: 'Eric Chen, Albert Chon', consensus: 'Tendermint BFT (Cosmos SDK)',
    maxSupply: '100,000,000',
    shortDesc: 'A Cosmos-based Layer 1 optimized for financial applications, with native order-book infrastructure and cross-chain interoperability.',
    whatItIs: `Injective is a Layer 1 blockchain in the Cosmos ecosystem optimized for financial primitives. Where most blockchains require DeFi protocols to build their own order-book or AMM logic in smart contracts, Injective provides a native on-chain order book at the protocol level, enabling derivatives, perpetual futures, prediction markets, and exotic financial instruments to launch with shared infrastructure. The chain launched in 2020 and uses CosmWasm for smart contracts.`,
    howItWorks: `Injective runs Tendermint BFT consensus with INJ as the staking and gas token. Validators stake INJ; the protocol burns 60% of dApp fees, creating deflationary pressure on supply. The chain uses Cosmos IBC for cross-chain transfers and has native bridges to Ethereum and Solana. Smart contracts are written in CosmWasm (Rust) and can interact with the native order-book module directly.`,
    useCases: `Helix is the flagship perpetual futures and derivatives platform on Injective. Other applications include prediction markets, options protocols, and tokenized real-world assets. The native order-book design appeals to applications that need traditional finance-style execution (limit orders, stop losses) rather than AMM-only liquidity.`,
    tradeoffs: `The Cosmos ecosystem is smaller than Ethereum L2s, which means less liquidity and developer activity. The native order-book is technically powerful but requires applications to integrate at a protocol level rather than building on a more familiar smart-contract abstraction. INJ tokenomics are aggressive on burns, which appeals to value-investing narratives but depends on continued protocol revenue.`,
    whereToLearn: `See <a href="/glossary/defi">DeFi</a> and the related Cosmos ecosystem in the <a href="/glossary/staking">staking</a> entry.`,
    faqs: [
      { q: 'What makes Injective different from Ethereum L2s?', a: 'Injective provides a native on-chain order book at the protocol level, which Ethereum-style chains require dApps to build themselves. This favors applications that need limit-order semantics rather than AMM execution.' },
      { q: 'Is Injective EVM-compatible?', a: 'Injective primarily uses CosmWasm for smart contracts. EVM compatibility has been added through inEVM, an EVM-compatible execution layer that interoperates with the rest of the Injective stack.' },
      { q: 'How does the INJ burn work?', a: 'A weekly auction burns 60% of fees collected from dApps on Injective. The mechanism is funded by ongoing protocol activity and creates deflationary pressure on the INJ supply.' },
    ],
    related: ['atom', 'sol', 'eth'],
  },
  {
    symbol: 'tia', ticker: 'TIA', name: 'Celestia', category: 'Infra',
    founded: 2023, founder: 'Mustafa Al-Bassam, Ismail Khoffi, John Adler, Nick White', consensus: 'Tendermint BFT (modular)',
    maxSupply: 'Inflationary',
    shortDesc: 'The first modular blockchain providing data availability as a service to other chains, enabling cheap rollup deployment.',
    whatItIs: `Celestia is a modular blockchain that specializes in data availability — the service of publishing rollup transaction data so anyone can reconstruct rollup state if the rollup operator misbehaves. Where Ethereum L1 provides both data availability and execution, Celestia separates the two: rollups can post their transaction data to Celestia at significantly lower cost than to Ethereum, while keeping their own execution and settlement logic. The chain launched in late 2023 as the first commercially-active data-availability-only blockchain.`,
    howItWorks: `Celestia validators provide block space; rollups pay TIA to publish transaction data, and validators are compensated through block rewards plus data-publication fees. Light clients can sample blobs to verify availability without downloading the full chain via Data Availability Sampling (DAS), a cryptographic technique that lets verifiers be confident with high probability that data is available based on a small number of random samples.`,
    useCases: `Celestia is used by sovereign rollups (rollups that don't post to Ethereum L1) and by some optimistic and ZK rollups as a cheaper alternative or supplement to Ethereum data availability. The data availability is significantly cheaper than Ethereum's calldata or even blobs (introduced via EIP-4844). Major rollup frameworks (Caldera, Conduit, Astria) integrate with Celestia.`,
    tradeoffs: `Celestia provides DA but not consensus on rollup state; rollups using Celestia for DA must still secure their own execution layer. Some critics argue Celestia's economic security is lower than Ethereum's (smaller stake base), which may matter for high-value rollups. Celestia is one of several DA approaches; competing solutions include Avail, EigenDA (built on Ethereum restaking), and Ethereum's own blob upgrade.`,
    whereToLearn: `See <a href="/glossary/rollup">rollup</a> for the broader scaling context this enables.`,
    faqs: [
      { q: 'What is data availability?', a: 'Data availability is the property that a blockchain\'s data has been published openly and can be retrieved by anyone. Without DA, rollups can\'t prove they\'re behaving honestly because verifiers can\'t independently check the underlying transactions.' },
      { q: 'How is Celestia different from Ethereum?', a: 'Ethereum provides DA, execution, and settlement for the chains built on it. Celestia provides only DA, leaving execution and settlement to the rollups themselves. This makes rollups using Celestia "sovereign" — they can change their own rules without coordinating with Celestia.' },
      { q: 'What is Data Availability Sampling?', a: 'DAS is a technique where light clients verify data availability by sampling small random pieces of a block. With enough samples, they have high confidence the full data is available without downloading it all. This makes it possible for resource-constrained nodes to participate in DA verification.' },
    ],
    related: ['eth', 'arb', 'op'],
  },
  {
    symbol: 'sei', ticker: 'SEI', name: 'Sei Network', category: 'L1',
    founded: 2022, founder: 'Sei Labs / Jeffrey Feng, Jayendra Jog', consensus: 'Tendermint BFT + Twin Turbo',
    maxSupply: '10,000,000,000',
    shortDesc: 'A high-throughput Layer 1 blockchain optimized for trading applications, with parallelized execution and a native order book matching engine.',
    whatItIs: `Sei is a Layer 1 blockchain that launched in August 2023, designed specifically for trading applications. The chain uses parallelized execution to process non-conflicting transactions concurrently, which the team calls "Twin Turbo Consensus." Sei v2 (launched 2024) added EVM compatibility alongside its native CosmWasm execution, letting both Solidity and Rust contracts run on the same chain.`,
    howItWorks: `Sei uses Tendermint BFT for ordering and a parallelized execution engine that detects non-conflicting transactions and runs them concurrently. Block times are around 400ms with sub-second finality. The native order-book matching engine is built into the protocol, similar to Injective's design but adapted for Sei's parallelization model. Twin Turbo Consensus aims to reduce the time between block proposal and finality.`,
    useCases: `Trading applications: DEXs (Astroport, Vortex), perpetual futures, prediction markets. NFT marketplaces (Pallet) and consumer applications also exist on Sei. The dual EVM + CosmWasm support lets developers choose their preferred toolchain. Sei has been actively partnering with gaming and consumer projects in 2024-2026.`,
    tradeoffs: `Sei's ecosystem is smaller than Ethereum, Solana, or even other Cosmos chains. The parallelization model is sophisticated but adds complexity for developers needing to understand transaction ordering. Liquidity is concentrated in a few applications. The combination of being an L1 (rather than an L2 inheriting Ethereum security) and being relatively young creates legitimate concerns about long-term security.`,
    whereToLearn: `For comparison with similar L1 designs, see <a href="/glossary/validator">validator</a> and <a href="/glossary/staking">staking</a>.`,
    faqs: [
      { q: 'What is Twin Turbo Consensus?', a: 'Sei\'s name for its combination of parallelized execution and optimized block propagation, which together reduce time from transaction submission to confirmed finality. It is essentially BFT consensus with engineering optimizations targeting trading workloads.' },
      { q: 'Is Sei EVM-compatible?', a: 'Yes, since Sei v2. Solidity contracts can be deployed alongside CosmWasm contracts. Both share the same execution layer and can interoperate.' },
      { q: 'How is Sei different from Solana?', a: 'Both prioritize high throughput and trading-optimized infrastructure. Solana uses Proof-of-History and a single-shard architecture; Sei uses Tendermint BFT with parallelized execution and provides a native order-book matching engine. Solana is the more established ecosystem.' },
    ],
    related: ['sol', 'inj', 'apt'],
  },
];

// ---------- TEMPLATE ----------

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CATEGORY_COLOR = {
  L1: '#5DCAA5',
  L2: '#60A5FA',
  DeFi: '#A78BFA',
  Stablecoin: '#4ADE80',
  AI: '#A78BFA',
  Privacy: '#F87171',
  Infra: '#FACC15',
  Exchange: '#F9CB42',
  Payment: '#5DCAA5',
};

function pageHtml(c, allCoins) {
  const cat = c.category;
  const catColor = CATEGORY_COLOR[cat] || '#5DCAA5';
  const seoTitle = `${c.name} (${c.ticker}) Live Price, Market Cap, Use Cases | TerminalFeed`;
  const seoDesc = c.shortDesc;
  const tickerUpper = c.ticker;
  const tickerLower = c.symbol;

  const relatedCards = (c.related || [])
    .map(slug => allCoins.find(x => x.symbol === slug))
    .filter(Boolean)
    .map(r => `      <a href="/crypto/${r.symbol}" class="related-card">
        <div class="related-ticker" style="color:${CATEGORY_COLOR[r.category] || '#5DCAA5'}">${r.ticker}</div>
        <div class="related-name">${escapeHtml(r.name)}</div>
        <div class="related-cat">${r.category}</div>
      </a>`).join('\n');

  const faqJsonLd = c.faqs && c.faqs.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(seoTitle)}</title>
  <meta name="description" content="${escapeHtml(seoDesc)}">
  <meta name="keywords" content="${tickerLower} price, ${tickerLower} live, ${escapeHtml(c.name).toLowerCase()} price, ${tickerLower} market cap, ${tickerLower} usd, ${tickerLower} chart, what is ${tickerLower}, ${tickerLower} explained">
  <link rel="canonical" href="https://terminalfeed.io/crypto/${c.symbol}">
  <meta property="og:title" content="${escapeHtml(c.name)} (${c.ticker}) Live Price + What It Is">
  <meta property="og:description" content="${escapeHtml(seoDesc)}">
  <meta property="og:url" content="https://terminalfeed.io/crypto/${c.symbol}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="https://terminalfeed.io/og-image.png">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="alternate" type="application/rss+xml" title="TerminalFeed Blog" href="/feed.xml">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${c.name} (${c.ticker}): Live Price, Market Cap, and Use Cases`,
    description: seoDesc,
    url: `https://terminalfeed.io/crypto/${c.symbol}`,
    datePublished: '2026-05-05',
    dateModified: '2026-05-05',
    author: { '@type': 'Organization', name: 'TerminalFeed' },
    publisher: {
      '@type': 'Organization',
      name: 'TerminalFeed',
      logo: { '@type': 'ImageObject', url: 'https://terminalfeed.io/logo.png' },
    },
    mainEntityOfPage: `https://terminalfeed.io/crypto/${c.symbol}`,
    about: { '@type': 'Thing', name: c.name },
  })}</script>
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://terminalfeed.io/' },
      { '@type': 'ListItem', position: 2, name: 'Crypto', item: 'https://terminalfeed.io/crypto' },
      { '@type': 'ListItem', position: 3, name: `${c.name} (${c.ticker})`, item: `https://terminalfeed.io/crypto/${c.symbol}` },
    ],
  })}</script>
  ${faqJsonLd ? `<script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>` : ''}
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0A0A0C; color: #D4D2CB; font-family: 'JetBrains Mono','SF Mono','Fira Code',Consolas,monospace; line-height: 1.7; padding: 24px 16px 64px; }
    .container { max-width: 800px; margin: 0 auto; }
    .breadcrumbs { font-size: 11px; color: #4E4D49; margin-bottom: 18px; }
    .breadcrumbs a { color: #4E4D49; text-decoration: none; }
    .breadcrumbs a:hover { color: #5DCAA5; }
    .breadcrumbs .sep { margin: 0 6px; color: #2A2A30; }
    .header { border-bottom: 1px solid #1E1E24; padding-bottom: 24px; margin-bottom: 28px; }
    .badge { display: inline-block; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 10px; border-radius: 3px; margin-bottom: 14px; color: ${catColor}; border: 1px solid ${catColor}40; background: ${catColor}10; }
    .header h1 { font-size: 28px; color: #F0EDE6; margin-bottom: 6px; font-weight: 600; }
    .header h1 .ticker { color: ${catColor}; }
    .summary { font-size: 14px; color: #A8A6A0; line-height: 1.7; margin-top: 8px; }
    .live-stats { background: #111114; border: 1px solid #1A1A22; border-radius: 6px; padding: 16px 18px; margin-bottom: 28px; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 18px; }
    .stat-label { font-size: 10px; color: #4E4D49; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
    .stat-value { font-size: 18px; color: #F0EDE6; font-weight: 600; }
    .stat-value.up { color: #4ADE80; }
    .stat-value.down { color: #F87171; }
    .stat-value.muted { color: #4E4D49; }
    .live-note { font-size: 10px; color: #4E4D49; margin-top: -8px; margin-bottom: 28px; text-align: right; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 16px; color: #4ADE80; margin-bottom: 12px; letter-spacing: 0.3px; font-weight: 600; }
    .section p { font-size: 13.5px; color: #C8C8C0; margin-bottom: 14px; line-height: 1.8; }
    .section a { color: #5DCAA5; text-decoration: none; border-bottom: 1px solid #5DCAA530; }
    .section a:hover { border-bottom-color: #5DCAA5; }
    .section code { background: #111114; border: 1px solid #1A1A22; padding: 2px 6px; border-radius: 3px; font-size: 12px; color: #5DCAA5; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; background: #0D0D10; border: 1px solid #1A1A22; border-radius: 6px; padding: 14px 18px; margin-bottom: 28px; }
    .meta-grid .ml { font-size: 10px; color: #4E4D49; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
    .meta-grid .mv { font-size: 12px; color: #C8C8C0; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
    .related-card { background: #111114; border: 1px solid #1A1A22; border-radius: 5px; padding: 12px 14px; text-decoration: none !important; border-bottom: 1px solid #1A1A22 !important; transition: border-color 0.15s; }
    .related-card:hover { border-color: #5DCAA5 !important; border-bottom-color: #5DCAA5 !important; }
    .related-ticker { font-size: 18px; font-weight: 600; margin-bottom: 2px; }
    .related-name { font-size: 12px; color: #F0EDE6; margin-bottom: 2px; }
    .related-cat { font-size: 10px; color: #4E4D49; letter-spacing: 1px; text-transform: uppercase; }
    .faq { background: #0D0D10; border: 1px solid #1A1A22; border-radius: 5px; padding: 12px 16px; margin-bottom: 8px; }
    .faq summary { cursor: pointer; font-size: 13px; color: #F0EDE6; font-weight: 500; list-style: none; }
    .faq summary::-webkit-details-marker { display: none; }
    .faq summary::before { content: '› '; color: #5DCAA5; margin-right: 4px; }
    .faq[open] summary::before { content: '⌄ '; }
    .faq-answer { font-size: 12.5px; color: #A8A6A0; padding-top: 10px; line-height: 1.7; }
    footer.footer { margin-top: 48px; text-align: center; padding: 24px 0; font-size: 11px; color: #4E4D49; border-top: 1px solid #1A1A22; }
    footer.footer a { color: #4E4D49; text-decoration: none; }
    footer.footer a:hover { color: #5DCAA5; }
    footer.footer .sep { margin: 0 6px; color: #2A2A30; }
    @media (max-width: 600px) { .header h1 { font-size: 22px; } .section h2 { font-size: 15px; } }
  </style>
</head>
<body>
  <div class="container">
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span class="sep">›</span><a href="/crypto">Crypto</a><span class="sep">›</span><span>${c.ticker}</span>
    </nav>

    <header class="header">
      <span class="badge">${cat}</span>
      <h1>${escapeHtml(c.name)} <span class="ticker">${c.ticker}</span></h1>
      <p class="summary">${escapeHtml(c.shortDesc)}</p>
    </header>

    <div class="live-stats">
      <div><div class="stat-label">Price</div><div class="stat-value muted" id="price">loading...</div></div>
      <div><div class="stat-label">24h Change</div><div class="stat-value muted" id="change24h">--</div></div>
      <div><div class="stat-label">Market Cap</div><div class="stat-value muted" id="mcap">--</div></div>
      <div><div class="stat-label">24h Volume</div><div class="stat-value muted" id="vol">--</div></div>
    </div>
    <p class="live-note">Live data via <a href="/api/coingecko/markets" style="color:#4E4D49">/api/coingecko/markets</a> · Updated every page load</p>

    <div class="meta-grid">
      <div><div class="ml">Founded</div><div class="mv">${c.founded || '--'}</div></div>
      <div><div class="ml">Founder</div><div class="mv">${escapeHtml(c.founder || '--')}</div></div>
      <div><div class="ml">Consensus</div><div class="mv">${escapeHtml(c.consensus || '--')}</div></div>
      <div><div class="ml">Max Supply</div><div class="mv">${escapeHtml(c.maxSupply || '--')}</div></div>
    </div>

    <section class="section">
      <h2>What ${c.ticker} is</h2>
      <p>${c.whatItIs}</p>
    </section>

    <section class="section">
      <h2>How it works</h2>
      <p>${c.howItWorks}</p>
    </section>

    <section class="section">
      <h2>Use cases</h2>
      <p>${c.useCases}</p>
    </section>

    <section class="section">
      <h2>Tradeoffs and criticism</h2>
      <p>${c.tradeoffs}</p>
    </section>

    <section class="section">
      <h2>Where to track ${c.ticker}</h2>
      <p>${c.whereToLearn}</p>
    </section>

    <section class="section">
      <h2>Related coins</h2>
      <div class="related-grid">
${relatedCards}
      </div>
    </section>

    ${c.faqs && c.faqs.length ? `<section class="section">
      <h2>Frequently asked questions</h2>
      ${c.faqs.map(f => `<details class="faq"><summary>${escapeHtml(f.q)}</summary><div class="faq-answer">${escapeHtml(f.a)}</div></details>`).join('\n      ')}
    </section>` : ''}

    <footer class="footer">
      <a href="/">Home</a><span class="sep">|</span>
      <a href="/crypto">All Coins</a><span class="sep">|</span>
      <a href="/api/crypto-movers">Live Markets</a><span class="sep">|</span>
      <a href="/api/btc-price">BTC Price API</a><span class="sep">|</span>
      <a href="/glossary">Glossary</a><span class="sep">|</span>
      <a href="/blog">Blog</a>
    </footer>
  </div>

  <script>
  (function() {
    var sym = '${tickerLower}';
    fetch('/api/coingecko/markets').then(function(r) { return r.json(); }).then(function(j) {
      var data = (j && j.data) || [];
      var coin = data.find(function(c) { return c.symbol === sym || c.id === sym; });
      if (!coin) return;
      var fmtPrice = function(n) {
        if (n >= 1000) return '$' + n.toLocaleString('en-US', {maximumFractionDigits: 0});
        if (n >= 1) return '$' + n.toLocaleString('en-US', {maximumFractionDigits: 2});
        if (n >= 0.01) return '$' + n.toFixed(4);
        return '$' + n.toFixed(8);
      };
      var fmtBig = function(n) {
        if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
        if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
        if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
        return '$' + n.toLocaleString('en-US', {maximumFractionDigits: 0});
      };
      var pe = document.getElementById('price');
      pe.textContent = fmtPrice(coin.current_price);
      pe.classList.remove('muted');
      var ce = document.getElementById('change24h');
      var ch = coin.price_change_percentage_24h || 0;
      ce.textContent = (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%';
      ce.classList.remove('muted');
      ce.classList.add(ch >= 0 ? 'up' : 'down');
      var me = document.getElementById('mcap');
      me.textContent = coin.market_cap ? fmtBig(coin.market_cap) : '--';
      me.classList.remove('muted');
      var ve = document.getElementById('vol');
      ve.textContent = coin.total_volume ? fmtBig(coin.total_volume) : '--';
      ve.classList.remove('muted');
    }).catch(function() {});
  })();
  </script>
</body>
</html>
`;
}

function indexHtml(allCoins) {
  const byCategory = {};
  allCoins.forEach(c => {
    if (!byCategory[c.category]) byCategory[c.category] = [];
    byCategory[c.category].push(c);
  });

  const groupOrder = ['L1', 'L2', 'DeFi', 'Stablecoin', 'AI', 'Privacy', 'Infra', 'Exchange', 'Payment'];
  const groupHtml = groupOrder.filter(g => byCategory[g]).map(g => {
    const coins = byCategory[g].sort((a, b) => a.ticker.localeCompare(b.ticker));
    const color = CATEGORY_COLOR[g] || '#5DCAA5';
    return `    <section class="group">
      <h2 style="color:${color}">${g}</h2>
      <div class="coin-grid">
${coins.map(c => `        <a href="/crypto/${c.symbol}" class="coin-card" data-search="${c.symbol} ${c.ticker.toLowerCase()} ${escapeHtml(c.name).toLowerCase()} ${escapeHtml(c.shortDesc).toLowerCase()}">
          <div class="card-ticker" style="color:${color}">${c.ticker}</div>
          <div class="card-name">${escapeHtml(c.name)}</div>
          <div class="card-summary">${escapeHtml(c.shortDesc)}</div>
        </a>`).join('\n')}
      </div>
    </section>`;
  }).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cryptocurrency Reference: BTC, ETH, SOL, and ${allCoins.length} More Explained | TerminalFeed</title>
  <meta name="description" content="Each major cryptocurrency on its own page. ${allCoins.length} utility-bearing coins covered: Layer 1 chains, L2s, DeFi tokens, stablecoins, AI/compute, privacy, infrastructure. Live prices, real explanations, FAQ. No memecoins.">
  <link rel="canonical" href="https://terminalfeed.io/crypto">
  <meta property="og:title" content="Cryptocurrency Reference: ${allCoins.length} Coins Explained">
  <meta property="og:description" content="Each major cryptocurrency on its own page with live price, real explanation, FAQ. Utility-bearing assets only, no memes.">
  <meta property="og:url" content="https://terminalfeed.io/crypto">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://terminalfeed.io/og-image.png">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Cryptocurrency Reference: ${allCoins.length} Coins`,
    description: `Each major cryptocurrency on its own page. ${allCoins.length} utility-bearing coins covered with live prices, real explanations, and FAQ.`,
    url: 'https://terminalfeed.io/crypto',
    publisher: {
      '@type': 'Organization',
      name: 'TerminalFeed',
      logo: { '@type': 'ImageObject', url: 'https://terminalfeed.io/logo.png' },
    },
  })}</script>
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://terminalfeed.io/' },
      { '@type': 'ListItem', position: 2, name: 'Crypto', item: 'https://terminalfeed.io/crypto' },
    ],
  })}</script>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0A0A0C; color: #D4D2CB; font-family: 'JetBrains Mono','SF Mono','Fira Code',Consolas,monospace; line-height: 1.7; padding: 24px 16px 64px; }
    .container { max-width: 1100px; margin: 0 auto; }
    .breadcrumbs { font-size: 11px; color: #4E4D49; margin-bottom: 18px; }
    .breadcrumbs a { color: #4E4D49; text-decoration: none; }
    .breadcrumbs a:hover { color: #5DCAA5; }
    .breadcrumbs .sep { margin: 0 6px; color: #2A2A30; }
    .header { border-bottom: 1px solid #1E1E24; padding-bottom: 24px; margin-bottom: 32px; }
    .header h1 { font-size: 28px; color: #F0EDE6; margin-bottom: 10px; font-weight: 600; }
    .header h1 span { color: #5DCAA5; }
    .header p { font-size: 13.5px; color: #A8A6A0; max-width: 750px; line-height: 1.7; }
    .header .meta-row { display: flex; gap: 24px; margin-top: 14px; flex-wrap: wrap; font-size: 11px; color: #8A8880; }
    .header .meta-row strong { color: #5DCAA5; font-weight: 600; }
    .search-box { margin-bottom: 32px; }
    .search-box input { width: 100%; background: #111114; border: 1px solid #1E1E24; color: #F0EDE6; padding: 12px 16px; border-radius: 4px; font-family: inherit; font-size: 13px; }
    .search-box input:focus { outline: none; border-color: #5DCAA5; }
    .search-box input::placeholder { color: #4E4D49; }
    .group { margin-bottom: 48px; }
    .group h2 { font-size: 18px; margin-bottom: 16px; letter-spacing: 1px; text-transform: uppercase; }
    .coin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .coin-card { background: #111114; border: 1px solid #1A1A22; border-radius: 5px; padding: 14px 16px; text-decoration: none; transition: border-color 0.15s, background 0.15s; display: block; }
    .coin-card:hover { border-color: #5DCAA5; background: #14141A; }
    .card-ticker { font-size: 22px; font-weight: 600; margin-bottom: 4px; }
    .card-name { font-size: 13px; color: #F0EDE6; margin-bottom: 6px; }
    .card-summary { font-size: 11px; color: #8A8880; line-height: 1.6; }
    .hidden { display: none; }
    footer.footer { margin-top: 48px; text-align: center; padding: 24px 0; font-size: 11px; color: #4E4D49; border-top: 1px solid #1A1A22; }
    footer.footer a { color: #4E4D49; text-decoration: none; }
    footer.footer a:hover { color: #5DCAA5; }
    footer.footer .sep { margin: 0 6px; color: #2A2A30; }
  </style>
</head>
<body>
  <div class="container">
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span class="sep">›</span><span>Crypto</span>
    </nav>

    <header class="header">
      <h1><span>›_</span> CRYPTOCURRENCY REFERENCE</h1>
      <p>Every major cryptocurrency on its own page. ${allCoins.length} utility-bearing coins covered across Layer 1 chains, L2s, DeFi, stablecoins, AI/compute, privacy, and infrastructure. Each entry has live price data, the actual technical story, real-world use cases, honest tradeoffs, and FAQ.</p>
      <p style="font-size: 12px; color: #8A8880; margin-top: 12px;">Editorial note: this list deliberately excludes memecoins and tokens with no utility narrative. Per <a href="/about" style="color:#5DCAA5;text-decoration:none">our editorial policy</a>, we cover crypto as data, not as gambling.</p>
      <div class="meta-row">
        <span><strong>Live data:</strong> <a href="/api/crypto-movers" style="color:#5DCAA5;text-decoration:none">/api/crypto-movers</a></span>
        <span><strong>BTC realtime:</strong> <a href="/api/btc-price" style="color:#5DCAA5;text-decoration:none">/api/btc-price</a></span>
        <span><strong>Glossary:</strong> <a href="/glossary" style="color:#5DCAA5;text-decoration:none">/glossary</a></span>
      </div>
    </header>

    <div class="search-box">
      <input type="text" id="search" placeholder="Search by name, ticker, or category (e.g. ETH, layer 1, lending)">
    </div>

${groupHtml}

    <footer class="footer">
      <a href="/">Home</a><span class="sep">|</span>
      <a href="/api/crypto-movers">Live Markets</a><span class="sep">|</span>
      <a href="/api/btc-price">BTC Price</a><span class="sep">|</span>
      <a href="/glossary">Glossary</a><span class="sep">|</span>
      <a href="/blog">Blog</a><span class="sep">|</span>
      <a href="/for-devs">Developer Hub</a>
    </footer>
  </div>
  <script>
    document.getElementById('search').addEventListener('input', function(e) {
      var q = e.target.value.trim().toLowerCase();
      document.querySelectorAll('.coin-card').forEach(function(card) {
        card.classList.toggle('hidden', q && card.dataset.search.indexOf(q) === -1);
      });
      document.querySelectorAll('.group').forEach(function(g) {
        var visible = g.querySelectorAll('.coin-card:not(.hidden)').length;
        g.style.display = visible ? '' : 'none';
      });
    });
  </script>
</body>
</html>
`;
}

// ---------- WRITE ----------

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
for (const c of COINS) {
  const html = pageHtml(c, COINS);
  fs.writeFileSync(path.join(OUT_DIR, `${c.symbol}.html`), html);
  written++;
}
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml(COINS));

console.log(`Generated ${written} crypto pages + 1 index → public/crypto/`);

// Sitemap fragment with priority weighting by category importance
const PRIORITY = { L1: 0.9, Stablecoin: 0.9, L2: 0.85, DeFi: 0.8, AI: 0.8, Infra: 0.75, Privacy: 0.75, Exchange: 0.85, Payment: 0.85 };
const sitemapEntries = [
  '  <url><loc>https://terminalfeed.io/crypto</loc><lastmod>2026-05-05</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>',
  ...COINS.map(c => `  <url><loc>https://terminalfeed.io/crypto/${c.symbol}</loc><lastmod>2026-05-05</lastmod><changefreq>weekly</changefreq><priority>${PRIORITY[c.category] || 0.7}</priority></url>`)
].join('\n');
fs.writeFileSync(path.join(OUT_DIR, '_sitemap-fragment.xml'), sitemapEntries);
console.log(`Wrote sitemap fragment with ${COINS.length + 1} entries`);

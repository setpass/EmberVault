# Shelby Storage on Aptos

A high-speed decentralized hot storage platform built on the **Shelby Protocol** within the **Aptos ecosystem**.

Shelby Storage enables users to upload, store, and retrieve files through decentralized storage providers while leveraging Aptos smart contracts for metadata management, staking, and payment logic.

---

## Overview

Shelby Storage is designed to provide a fast and user-friendly storage experience for Web3 applications and end users.

The platform combines:

- **Shelby Protocol** for decentralized file storage
- **Aptos blockchain** for smart contract logic and payment settlement
- **Next.js + Tailwind CSS** for modern frontend UX
- **Aptos Wallet integration** for seamless user onboarding

This project focuses on the idea of **Hot Storage**, where files can be uploaded and accessed quickly while preserving decentralization and transparency.

---

## Core Features

### 1. Upload
Users can upload files to the Shelby network.  
Files are transferred to Shelby storage providers and return a **CID (Content ID)**, which is then stored on Aptos as metadata.

### 2. Download
Users can retrieve files using their CID.  
The system supports a payment model where users compensate storage providers for download/read operations.

### 3. Explorer
A public dashboard to inspect network activity and discover public files, storage capacity, and node activity.

### 4. Documentation
Integrated documentation for both users and developers, including SDK usage, wallet setup, and protocol interaction.

### 5. Stake
Users can stake APT to receive additional upload quota, storage priority, or future protocol incentives.

### 6. Fund Account
Built-in onboarding tools:
- **Faucet** for Aptos Testnet/Devnet
- **On-ramp support** for Mainnet via third-party providers such as MoonPay or Transak

---

## Problem Statement

Traditional cloud storage is fast but centralized.  
Fully decentralized storage can offer censorship resistance, but often comes with UX and performance tradeoffs.

Shelby Storage aims to bridge this gap by delivering:

- fast upload/download experience
- decentralized file persistence
- transparent payment logic
- wallet-native onboarding
- Aptos-native smart contract integration

---

## Architecture

```text
User
 ├── Connect Wallet (Petra / Martian / Pontem)
 ├── Upload File
 │    ├── Frontend sends file to Shelby SDK
 │    ├── Shelby returns CID
 │    └── Aptos Move contract stores metadata
 │
 ├── View My Files / Explorer
 │    └── Frontend reads metadata from Aptos
 │
 └── Download File
      ├── User requests file by CID
      ├── Payment/read incentive is processed
      └── File is retrieved from Shelby storage provider
```

### Tech Stack

- **Blockchain:** Aptos
- **Smart Contracts:** Move
- **Storage Layer:** Shelby Protocol
- **Frontend:** Next.js / React
- **Styling:** Tailwind CSS
- **Wallet Integration:** Aptos Wallet Adapter
- **Tooling:** Aptos CLI, Move Prover, TypeScript

---

## Smart Contract Scope

The Aptos Move module is responsible for:

- storing file metadata
- managing user storage records
- handling staking logic
- tracking upload quota
- enabling payment flow for download/read operations

### Example responsibilities

- `UserStorage`: store list of file CIDs owned by a user
- `stake_apt(amount)`: lock APT and increase storage quota
- `pay_for_download(cid, provider_addr)`: transfer payment to storage provider
- metadata registry for public/private file visibility

---

## Frontend Scope

The frontend application includes:

- wallet connection
- drag & drop file upload
- file list dashboard
- download interaction
- public explorer
- staking interface
- funding/faucet onboarding
- documentation pages

### Supported Wallets

- Petra
- Martian
- Pontem

---

## MVP Scope

The first production-ready MVP should include:

- wallet connection
- file upload to Shelby
- CID + metadata saved on Aptos
- personal dashboard for uploaded files
- file download using CID
- public explorer for public files only
- testnet faucet integration

### Future Versions

Planned for later phases:

- advanced staking mechanics
- bandwidth-based quota system
- optimized read incentives / micropayments
- provider analytics
- enhanced documentation portal
- mainnet on-ramp integrations
- network health dashboard

---

## Roadmap

## Phase 1 — Infrastructure & Smart Contracts (Weeks 1–2)

**Tasks**
- Set up Aptos project structure
- Write Move module for storage metadata
- Implement staking and balance logic
- Define events, error codes, and access rules
- Add unit tests and validation

**Goal**
Build the contract layer that manages:
- file metadata
- staking
- storage-related payment logic

**Tools**
- Aptos CLI
- Move
- Move Prover

---

## Phase 2 — Shelby Protocol Integration (Weeks 3–4)

**Tasks**
- Integrate Shelby SDK into frontend/backend flow
- Upload file to Shelby storage providers
- Receive CID and link it to Aptos metadata
- Design initial read-incentive/payment logic

**Goal**
Successfully push files to Shelby and retrieve them through CID.

**Tools**
- Shelby SDK
- TypeScript

---

## Phase 3 — UI/UX Development (Weeks 5–6)

**Tasks**
- Build dashboard UI
- Implement drag & drop upload
- Build Explorer page
- Build documentation pages
- Integrate wallet connection
- Add Fund Account and Stake flows

**Goal**
Deliver a smooth and intuitive user experience for both crypto-native and new users.

**Tools**
- Next.js
- Tailwind CSS
- Aptos Wallet Adapter

---

## Phase 4 — Testing & Launch (Weeks 7–8)

**Tasks**
- audit Move contracts
- run storage stress tests
- test upload/download flows under load
- validate wallet and network switching
- deploy to Devnet/Testnet
- prepare Mainnet deployment checklist

**Goal**
Ensure security, performance, and usability before public release.

---

## Repository Structure

```text
shelby-storage/
├── contracts/              # Aptos Move smart contracts
│   ├── sources/
│   ├── tests/
│   └── Move.toml
│
├── frontend/               # Next.js frontend app
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   └── styles/
│
├── docs/                   # Project documentation
│   ├── user-guide.md
│   ├── developer-guide.md
│   └── architecture.md
│
├── scripts/                # Deployment / helper scripts
├── .env.example
├── package.json
└── README.md
```

---

## User Flow

### Upload Flow
1. User connects Aptos wallet
2. User selects or drags a file into the upload area
3. Frontend uploads file through Shelby SDK
4. Shelby returns a CID
5. Frontend calls Aptos smart contract to store metadata
6. File appears in user dashboard

### Download Flow
1. User selects a file from dashboard or enters a CID
2. System checks access/payment conditions
3. Payment logic is triggered if required
4. File is retrieved from Shelby storage provider
5. User receives the file

### Stake Flow
1. User opens staking panel
2. User enters APT amount
3. Wallet confirms transaction
4. Contract locks stake
5. User receives increased storage quota or protocol benefits

### Fund Account Flow
- On **Testnet/Devnet**: show faucet option
- On **Mainnet**: show supported on-ramp links

---

## Security Considerations

This project should pay special attention to:

- smart contract safety
- payment abuse prevention
- invalid or duplicate metadata
- quota manipulation
- private/public file exposure
- wallet transaction confirmation clarity
- rate limits for uploads/downloads

Before Mainnet launch, the project should complete:

- Move contract review
- test coverage
- storage stress testing
- wallet compatibility testing
- frontend security checks

---

## Developer Prompts

Below are the AI prompts used to bootstrap development.

### Move Smart Contract Prompt

```text
Act as an expert Aptos Move developer. Write a Move module named shelby_storage.

The module should include:
- a UserStorage struct that stores the list of file CIDs owned by a user
- a stake_apt(amount) function that allows users to deposit APT into a staking pool and increases their upload quota
- a pay_for_download(cid, provider_addr) function that transfers payment from a user to a storage node when a file is downloaded

Use Aptos Framework 1.x conventions.
Include:
- events
- error codes
- access control
- view functions
- unit tests
- clear explanations
- metadata fields such as cid, owner, size, visibility, and created_at
```

### Frontend Prompt

```text
Build a React / Next.js application using Tailwind CSS for Shelby Storage.

Requirements:
- Header with a Connect Wallet button using Aptos Wallet Adapter
- Home page with a Drag & Drop upload area
- After upload, show a file list with Download buttons
- On upload, call Shelby SDK to upload the file and then call the smart contract to save metadata
- Add an Explorer page that displays public files available on the network
```

### Fund Account & Stake UI Prompt

```text
Build UI components for Staking and Funding.

Requirements:
- Display the current APT wallet balance
- Provide an input to enter the amount of APT to stake
- Add a Confirm Stake button
- Add a Get Gas Fee section:
  - if the user is on Testnet, show a Claim Faucet button
  - if the user is on Mainnet, show links to buy APT via MoonPay or Transak
```

---

## Getting Started

### Prerequisites

Make sure you have:

- Node.js 18+
- pnpm / npm / yarn
- Aptos CLI
- a supported Aptos wallet
- access to Shelby SDK
- Aptos test account for Devnet/Testnet

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/shelby-storage.git
cd shelby-storage
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Configure environment variables

Create a `.env.local` file inside `frontend/`:

```env
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_APTOS_NODE_URL=
NEXT_PUBLIC_MODULE_ADDRESS=
NEXT_PUBLIC_SHELBY_API_URL=
NEXT_PUBLIC_SHELBY_API_KEY=
```

### 4. Compile Move contracts

```bash
cd contracts
aptos move compile
```

### 5. Run frontend locally

```bash
cd frontend
npm run dev
```

---

## Example Environment Variables

```env
# Frontend
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com
NEXT_PUBLIC_MODULE_ADDRESS=0x...
NEXT_PUBLIC_SHELBY_API_URL=https://...
NEXT_PUBLIC_SHELBY_API_KEY=your_key_here

# Optional
NEXT_PUBLIC_EXPLORER_ENABLED=true
NEXT_PUBLIC_FAUCET_ENABLED=true
```

---

## Documentation

Planned docs include:

- User guide
- Developer integration guide
- Smart contract architecture
- Shelby SDK upload/download flow
- Wallet onboarding
- Testnet and Mainnet setup

---

## Use Cases

Shelby Storage can be used for:

- Web3 file hosting
- decentralized media storage
- NFT/game asset delivery
- temporary hot data access
- dApp user uploads
- content-addressed data retrieval
- storage infrastructure experiments on Aptos

---

## Status

Current stage: **Planning / MVP Design**

Next priorities:
- finalize contract data model
- integrate Shelby SDK
- build upload/download proof of concept
- connect wallet flow
- deploy first version to Aptos Testnet

---

## Contributing

Contributions are welcome.

Suggested contribution areas:
- Move contract design
- Shelby SDK integration
- Aptos wallet UX
- dashboard improvements
- documentation
- testing and QA

To contribute:
1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## License

MIT License

---

## Vision

Shelby Storage aims to become a fast, decentralized storage layer for the Aptos ecosystem by combining:

- decentralized file availability
- on-chain transparency
- wallet-native UX
- scalable hot storage infrastructure

---

## Contact

For collaboration, integrations, or hackathon submissions, please open an issue or contact the project maintainer.

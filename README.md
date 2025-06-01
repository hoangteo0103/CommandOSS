# 🎫 NFT Ticket Marketplace

A decentralized marketplace for buying and selling NFT event tickets built on the Sui blockchain. This platform enables secure peer-to-peer transactions for premium event experiences through blockchain-verified digital tickets.

## ✨ Features

### 🎟️ Core Functionality

- **NFT Ticket Minting**: Convert event tickets into blockchain-verified NFTs
- **Marketplace Trading**: Buy and sell tickets in a secure peer-to-peer environment
- **Map-Based Event Discovery**: Interactive map interface to find events by location
- **Semantic Search**: AI-powered search using Qdrant vector database for intelligent event discovery
- **Escrow System**: Automated escrow ensures safe transactions between buyers and sellers
- **Wallet Integration**: Seamless Sui wallet connectivity for all transactions

### 🔐 Security & Trust

- **Blockchain Verification**: All tickets are verified on the Sui blockchain
- **Smart Escrow**: NFTs are held in secure escrow during listing period
- **Transaction History**: Complete audit trail of all ticket transfers
- **Ownership Proof**: QR codes contain blockchain verification data

### 💼 User Experience

- **My Tickets**: Personal collection management with upcoming/past event filters
- **Premium UI**: Modern, responsive design with smooth animations
- **Real-time Updates**: Live transaction status and notifications

### 🔍 Advanced Search & Discovery

- **Geographic Search**: Find events near you with interactive map visualization
- **Vector Search**: Semantic search powered by Qdrant for natural language queries
- **Filter & Sort**: Advanced filtering by date, location, price, and category

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Mantine UI** for components and styling
- **React Query** for state management
- **Sui SDK** for blockchain interactions
- **QR Code Generation** for ticket verification

### Backend

- **NestJS** with TypeScript
- **PostgreSQL** database
- **TypeORM** for database management
- **Qdrant Vector Database** for semantic search and recommendations
- **Sui SDK** for blockchain integration
- **RESTful API** architecture

### Blockchain

- **Sui Network** (Testnet)
- **NFT Standards** for ticket representation
- **Smart Escrow** for secure transactions

### Database & Search

- **PostgreSQL** for relational data
- **Qdrant Vector DB** for semantic search and AI features
- **Geographic Indexing** for location-based queries

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Sui Wallet Extension
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/CommandOSS.git
   cd CommandOSS
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install

   # Configure environment variables
   cp .env.example .env
   # Edit .env with your database and Sui configuration

   # Run database migrations
   npm run migration:run

   # Start the server
   npm run start:dev
   ```

3. **Frontend Setup**

   ```bash
   cd frontend
   npm install

   # Start the development server
   npm start
   ```

4. **Access the Application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`

## 📱 Usage

### Event Discovery

1. **Browse Events**: Explore events through list view or interactive map
2. **Semantic Search**: Use natural language to find events (e.g., "jazz concerts near downtown")
3. **Location-Based**: Filter events by geographic proximity
4. **Smart Filters**: Apply multiple criteria for precise results

### For Buyers

1. **Connect Wallet**: Link your Sui wallet to the platform
2. **Discover Events**: Use map or semantic search to find interesting events
3. **Purchase Tickets**: Buy tickets with automatic blockchain verification
4. **Manage Collection**: View your tickets in "My Tickets" section

### For Sellers

1. **List Tickets**: Convert owned tickets into marketplace listings
2. **Escrow Transfer**: NFTs are automatically moved to secure escrow
3. **Set Pricing**: Configure listing price and optional details
4. **Automatic Settlement**: Receive payment when ticket is sold

## 🏗️ Project Structure

```
CommandOSS/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── entities/       # Database entities
│   │   ├── modules/        # Feature modules
│   │   ├── services/       # Business logic services
│   │   └── controllers/    # API controllers
│   └── package.json
└── README.md
```

## 🔧 Environment Configuration

### Backend (.env)

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=nft_marketplace
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key
SUI_PRIVATE_KEY=your_sui_private_key
SUI_PACKAGE_ID=your_package_id
```

### Frontend

Environment variables for API endpoints and blockchain configuration.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Sui Documentation](https://docs.sui.io/)
- [Mantine UI](https://mantine.dev/)
- [NestJS Documentation](https://nestjs.com/)

## 🎯 Roadmap

- [ ] Mainnet deployment
- [ ] Enhanced AI recommendations
- [ ] Real-time event updates on map
- [ ] Advanced semantic search filters
- [ ] Mobile app development
- [ ] Auction-style listings
- [ ] Event organizer dashboard
- [ ] Multi-chain support

---

**Built with ❤️ for the future of event ticketing**

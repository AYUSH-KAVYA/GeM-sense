# GeM-sense

### Automated Cost Comparison Gateway for Public Procurement

GeM-sense is a procurement intelligence platform designed to improve transparency and support smarter purchasing decisions. It compares product prices across the Government e-Marketplace (GeM) and other online marketplaces, helping users evaluate pricing and identify potential savings.

## Key Features

- **Cross-Market Scraping:** Collects product pricing information from GeM, Amazon and Flipkart.
- **Spec-Level Fuzzy Matching:** Helps identify comparable products using product specifications and matching logic.
- **Price Volatility Tracking:** Supports 30-day price history and trend visualisation.
- **Bulk Procurement Savings Calculator:** Helps estimate potential savings across procurement quantities.
- **CSV Audit Export:** Supports exporting comparison data for analysis and audit purposes.
- **Comparison Dashboard:** Presents product information and marketplace prices in a structured interface.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Charts | Recharts |
| Backend | Node.js, Express.js |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| Icons | Lucide React |

## Project Structure

```text
GeM-sense/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── tests/
│   │   └── smokeTest.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- Access to the project's PostgreSQL database
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/kanishqarora478-eng/GeM-sense.git
cd GeM-sense
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Configure the following environment variables in `backend/.env`:

```env
PORT=5000
DATABASE_URL="YOUR_POSTGRESQL_CONNECTION_STRING"
```

Obtain the database connection string from the project database owner. Never commit `.env` or share database credentials publicly.

Generate the Prisma client:

```bash
npm run prisma:generate
```

Start the backend:

```bash
npm start
```

The backend runs at:

`http://localhost:5000`

### 3. Set Up the Frontend

Open another terminal at the project root:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend development server will display its local URL in the terminal.

If your backend runs on a different port, configure `VITE_API_URL` in the frontend environment to point to that backend's `/api` base URL.

### 4. Build the Frontend

From the `frontend` directory:

```bash
npm run build
```

## API Documentation

The backend exposes the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Checks backend health |
| GET | `/api/products` | Retrieves available products |
| GET | `/api/products/search?q=printer` | Searches products by query |
| GET | `/api/products/:id` | Retrieves product details by ID |

### Example Requests

Check backend health:

```bash
curl http://localhost:5000/health
```

Retrieve products:

```bash
curl http://localhost:5000/api/products
```

Search for printers:

```bash
curl "http://localhost:5000/api/products/search?q=printer"
```

## Backend Smoke Tests

The standalone smoke test validates:

1. Backend health endpoint availability.
2. Product retrieval and valid marketplace prices.
3. Search results and platform-wise price breakdowns.

Run the tests from the backend directory:

```bash
node tests/smokeTest.js
```

To test against a different backend port:

```bash
API_URL=http://localhost:5001 node tests/smokeTest.js
```

## Contributors

**Ayush Sharma**
- Lead Architecture
- Scraping Engine
- Prisma Database and Cloud Deployment

**Tejas**
- Frontend Architecture
- Comparison Dashboard
- Recharts Analytics UI

**Kanishq**
- Specification-Matching Normalizer
- Verdict Engine
- Database Seeding and Quality Assurance

## Disclaimer

Marketplace prices and product availability may change over time. GeM-sense provides price benchmarking and procurement decision support. Users should verify current product listings, specifications and prices on the respective marketplaces before making procurement decisions.

---

**GeM-sense — Price Intelligence for Smarter Public Procurement.**

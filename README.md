# Wallet Collector

A simple web application for collecting and managing wallet addresses, built with Node.js and deployed on Vercel.

## Features

- Submit wallet addresses
- View all submitted wallets
- Delete wallets
- Persistent storage using Vercel KV
- Reliable submissions using QStash
- Real-time feedback
- Mobile-responsive design

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Vercel account
- Upstash Redis account
- QStash account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
KV_REST_API_TOKEN=your_kv_token
KV_REST_API_URL=your_redis_url
QSTASH_TOKEN=your_qstash_token
PORT=3001
NODE_ENV=development
```

## Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd <your-repo-name>
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Visit `http://localhost:3001` in your browser

## Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the following environment variables in Vercel:
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_URL`
   - `QSTASH_TOKEN`
4. Deploy!

## API Endpoints

- `GET /api/wallets` - Get all wallets
- `POST /api/wallets` - Submit a new wallet
- `DELETE /api/wallets/:id` - Delete a wallet
- `GET /health` - Health check endpoint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
# OnlyFrens Wallet Connect

A web application for managing Solana wallet connections and referrals for the OnlyFrens project. Users can submit their wallet addresses, receive referral links, and participate in a tiered airdrop system.

## Features

- Solana wallet address validation
- Referral system with unique referral codes
- Tiered airdrop rewards based on submission order
- Real-time position tracking
- Google Sheets integration for data storage
- Modern, responsive UI

## Airdrop Tiers

The airdrop rewards are tiered based on submission order:
- First 100 wallets: 2x Base Reward
- Wallets 101-500: 1.5x Base Reward
- Wallets 501-1000: 1.25x Base Reward
- Wallets 1001+: 1x Base Reward

Additional 10% bonus for each successful referral.

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Vercel Serverless Functions
- Database: Google Sheets API
- Deployment: Vercel

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/onlyfrens-wallet-connect.git
cd onlyfrens-wallet-connect
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with the following variables:
```
GOOGLE_CLIENT_EMAIL=your-service-account-email
GOOGLE_PRIVATE_KEY=your-private-key
SPREADSHEET_ID=your-google-sheet-id
```

4. Set up Google Sheets:
- Create a new Google Sheet
- Share it with the service account email
- Copy the Sheet ID from the URL

5. Deploy to Vercel:
```bash
vercel
```

## Development

To run the project locally:
```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

- Never commit sensitive credentials or environment variables
- Keep your Google Sheets API credentials secure
- Regularly update dependencies to patch security vulnerabilities 
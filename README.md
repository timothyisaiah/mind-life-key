# MindLifeKey - Personal Finance Manager

A comprehensive personal finance application built with Vue.js and Quasar Framework that helps you budget, forecast cash flow, and track savings growth with full-featured analytics and security.

## 🌟 Features

### Core Modules

- **Personal Budget Dashboard** - Central hub showing income vs expenses, current balance, and budget category utilization
- **Cash-Flow Forecaster** - Project future balances based on recurring income and expenses
- **Savings Goal Tracker** - Create custom goals with progress tracking and milestone celebrations

### Key Features

- 🔐 **Secure Authentication** - PIN-based security with encrypted local storage
- 📊 **Interactive Charts** - Visual expense breakdowns and balance trends
- 💰 **Transaction Management** - Add, edit, and categorize income and expenses
- 🎯 **Goal Tracking** - Set savings targets with progress visualization
- 📈 **Financial Reports** - Export data to PDF/CSV with detailed analytics
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop
- 🔒 **Data Encryption** - All financial data is encrypted locally

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher)
- Yarn package manager

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd mind-life-key
```

2. Install dependencies:

```bash
yarn install
```

3. Start the development server:

```bash
yarn dev
```

4. Open your browser and navigate to `http://localhost:9000`

## 📱 Usage

### First Time Setup

1. When you first open the app, you'll be prompted to set up a 4-digit PIN
2. This PIN will be used to secure your financial data
3. After setting up your PIN, you'll be taken to the dashboard

### Dashboard

- View your current net worth and monthly financial summary
- See recent transactions and active savings goals
- Quick access to add income, expenses, or create new goals
- Interactive charts showing expense breakdowns and balance trends

### Transactions

- Add income and expenses with categories
- Filter transactions by type, category, or date range
- Edit or delete existing transactions
- View detailed transaction history

### Goals

- Create savings goals with target amounts and dates
- Track progress with visual progress bars
- Add money to goals manually
- View completed and active goals

### Reports

- Generate financial reports for custom date ranges
- View income vs expense trends
- Export data to CSV format
- Analyze spending by category

## 🛠️ Technology Stack

- **Frontend**: Vue.js 3 with Composition API
- **UI Framework**: Quasar Framework
- **State Management**: Pinia
- **Charts**: Chart.js with vue-chartjs
- **Encryption**: CryptoJS
- **Build Tool**: Vite
- **Styling**: SCSS

## 📁 Project Structure

```
src/
├── components/
│   ├── charts/          # Chart components
│   └── forms/           # Form components
├── composables/         # Vue composables
├── layouts/             # Layout components
├── pages/               # Page components
├── router/              # Vue Router configuration
├── stores/              # Pinia stores
├── utils/               # Utility functions
└── boot/                # App boot files
```

## 🔐 Security

- All financial data is encrypted using AES encryption before storing locally
- PIN-based authentication with secure hashing
- No data is sent to external servers - everything is stored locally
- Session timeout for automatic logout

## 📊 Data Storage

- All data is stored locally in the browser using localStorage
- Data is encrypted before storage for security
- No external database or cloud storage required
- Data persists between browser sessions

## 🎨 Customization

The app includes several predefined categories for income and expenses:

- **Income**: Salary, Freelance, Investment, Other
- **Expenses**: Food & Dining, Transportation, Housing, Entertainment, Healthcare, Shopping, Other

You can easily modify these categories in the financial store.

## 🚧 Roadmap

### Phase 1 (MVP) - ✅ Completed

- [x] Authentication & Security
- [x] Basic Dashboard
- [x] Transaction Management
- [x] Goals Tracking
- [x] Basic Reports

### Phase 2 (Growth Features) - 🔄 Planned

- [ ] Recurring Transactions
- [ ] Cash-Flow Forecaster
- [ ] Enhanced Goals with Auto-allocation
- [ ] Advanced Reports with Net Worth Tracking

### Phase 3 (Intelligence & Integration) - 📋 Future

- [ ] Data Import/Export (CSV, Bank APIs)
- [ ] OCR Receipt Scanning
- [ ] AI-driven Insights
- [ ] Multi-Currency Support

### Phase 4 (Scaling & Ecosystem) - 🎯 Future

- [ ] Cloud Backup & Sync
- [ ] Shared Budgets (Family/Couples)
- [ ] Premium Features
- [ ] Mobile App Release

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Quasar Framework](https://quasar.dev/)
- Charts powered by [Chart.js](https://www.chartjs.org/)
- Icons from [Material Icons](https://fonts.google.com/icons)

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the development team.

---

**MindLifeKey** - Take control of your financial future! 💰✨

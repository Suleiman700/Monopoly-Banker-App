# Banker's Best Friend: Your AI-Powered Monopoly Assistant

Banker's Best Friend is a modern, web-based application designed to be the ultimate companion for your Monopoly game nights. It replaces the need for paper money and a manual banker with a seamless digital interface, and enhances the experience with powerful AI-driven features.

<img src="/public/images/thumbnail.png" alt="drawing" width="200"/>

## Key Features

- **Digital Banking:** Easily manage balances for all players and the bank. No more fumbling with paper money!
- **Transaction & Trade Logging:** A full history of all payments is recorded. Execute and log cash trades between players with ease.
- **Player Management:** Create new games, add up to 8 players, and edit player names on the fly.
- **Dice Roller:** A fair and simple digital dice roller to keep the game moving.
- **Stats Dashboard:** Visualize the game with charts showing player income vs. outcome, dice roll frequency, and key game metrics.
- **Undo Actions:** Mistakenly made a payment? Easily undo any transaction from the history log.
- **Customizable Game Options:**
    - **Themes:** Personalize the look and feel of the app with multiple color themes.
    - **Game Rules:** Adjust core game amounts like "Pass Go," "Jail Fee," and money awarded for "Free Parking."
    - **Sound Effects:** Toggle sound effects for key game actions.
- **AI-Powered Rules Advisor:** Have a tricky rules question? Ask the AI advisor in any language, and it will provide a ruling based on official Monopoly rules, presented in a collapsible, easy-to-read format with automatic text-direction (RTL/LTR) support.
- **AI Game Forecaster:** Get a real-time prediction of each player's probability of winning! The AI analyzes the current game state (balances, transactions, dice rolls) and presents the forecast in a dynamic pie chart.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI:** [React](https://reactjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Component Library:** [shadcn/ui](https://ui.shadcn.com/)
- **AI Integration:** [Genkit](https://firebase.google.com/docs/genkit)
- **AI Model:** [Google Gemini](https://ai.google.dev/)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### 1. Set Up Your API Key

This project uses the Google Gemini API for its AI features.

1.  Create an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Create a file named `.env` in the root of the project.
3.  Add your API key to the `.env` file like this:

    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

The application will now be running at [http://localhost:9002](http://localhost:9002).

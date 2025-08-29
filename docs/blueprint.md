# **App Name**: Banker's Best Friend

## Core Features:

- Game History Display: Display a list of past games from the 'games' table. Each item links to the respective game's interface.
- New Game Creation: Create a new game record with a generated UUID, number of players, and starting salary, stored in the 'games' table.
- Bank Interface: Show player balances from the database and provide a context menu with actions such as 'Pay' and 'Pass Go'.
- Payment Modal: Open a modal to input target player and payment amount for recording transactions in the 'transactions' table.
- Dice Roll: Generate dice rolls using two alternating methods based on system time and record the results.
- Stats Display: Calculate and show global game statistics such as the number of rounds and total money spent.
- Game Rules Advisor: Use an AI tool to decide whether a particular edge case can be automatically resolved according to Monopoly rules, based on user query.

## Style Guidelines:

- Primary color: Deep teal (#008080) evoking wealth and sophistication, while avoiding a literal green.
- Background color: Light grayish-teal (#E0F8F8), a very desaturated version of the primary color for a calming backdrop.
- Accent color: Sky blue (#87CEEB), adding a bright highlight to buttons and interactive elements.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines, and 'Inter' (sans-serif) for body text. 'Space Grotesk' provides a techy feel while 'Inter' maintains readability for longer content.
- Code font: 'Source Code Pro' (monospace) for displaying any configuration snippets.
- Use icons representing game elements like dice, money, and players. Minimalist and consistent style.
- Responsive layout adapting to different screen sizes using Tailwind CSS grid and flexbox utilities. Tabs and modals for organized content.
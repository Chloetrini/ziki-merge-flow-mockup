import './globals.css';
import { Provider } from '../lib/store';
import Shell from '../components/Shell';

export const metadata = {
  title: 'Ziki fix journey proposal',
  description: 'A design proposal for how people and AI agents work together on Ziki after a fix leaves for GitHub.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Provider>
          <Shell>{children}</Shell>
        </Provider>
      </body>
    </html>
  );
}

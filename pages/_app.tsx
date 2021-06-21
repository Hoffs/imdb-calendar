import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { GlobalStyles } from 'twin.macro';
import UserProvider from 'context/userContext';

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <UserProvider>
      <GlobalStyles />
      <Component {...pageProps} />
    </UserProvider>
  );
}

export default MyApp;

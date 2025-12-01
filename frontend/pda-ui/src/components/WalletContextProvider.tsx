import { useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextProviderProps {
  children: ReactNode;
}

export function WalletContextProvider({ children }: WalletContextProviderProps) {
  // Use devnet for development
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false}
        onError={(error) => {
          // Handle wallet errors gracefully
          if (error.name === 'WalletConnectionError') {
            console.warn('Wallet connection error:', error.message);
            // Don't show error to user for pending connection requests
            if (error.message.includes('already pending')) {
              return; // Silently ignore - user just needs to wait
            }
          } else if (error.name === 'WalletNotReadyError') {
            // Wallet extension not installed or not ready
            console.warn('Wallet not ready:', error.message);
            // This is expected if wallet extension isn't installed
            // The wallet modal will handle showing available wallets
            return; // Don't log as error, it's expected behavior
          } else if (error.name === 'WalletNotConnectedError') {
            // Wallet not connected - this is normal before connection
            console.warn('Wallet not connected:', error.message);
            return; // Don't log as error
          }
          // Log other errors
          console.error('Wallet error:', error);
        }}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}


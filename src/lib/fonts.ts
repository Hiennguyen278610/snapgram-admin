import { Playfair_Display, Roboto, Roboto_Mono } from 'next/font/google';

export const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-display',
  display: 'swap',
});

export const roboto = Roboto({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const robotoMono = Roboto_Mono({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-mono',
  display: 'swap',
});

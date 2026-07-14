import './globals.css';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata = {
  title: 'Buddy Script',
  description: 'A minimal social feed',
  icons: { icon: '/assets/images/logo-copy.svg' },
};

// Applies the saved theme before paint to avoid a flash
const themeScript = `try{if(localStorage.theme==='dark')document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-page font-sans text-ink antialiased dark:bg-dpage dark:text-white">
        {/* <ThemeToggle /> */}
        {children}
      </body>
    </html>
  );
}

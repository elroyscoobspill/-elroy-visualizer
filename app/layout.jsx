import './globals.css'

export const metadata = {
  title: 'ELROY Visualizer Module',
  description: 'Audio-reactive beat visualizer'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

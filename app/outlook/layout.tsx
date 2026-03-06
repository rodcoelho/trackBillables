/* eslint-disable @next/next/no-before-interactive-script-outside-document */
import Script from 'next/script';

export const metadata = {
  title: 'TrackBillables - Outlook Add-in',
};

export default function OutlookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
        strategy="beforeInteractive"
      />
      {children}
    </>
  );
}

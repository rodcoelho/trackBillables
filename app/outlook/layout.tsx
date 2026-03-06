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
      <head>
        <script
          src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
          type="text/javascript"
        />
      </head>
      {children}
    </>
  );
}

import ScannerCapture from '@/components/scanner/ScannerCapture';

export const metadata = {
  title: 'AI Agri-Doctor — Snap & Diagnose',
  description: 'Upload a photo of your sick animal or crop and get an instant AI-powered diagnosis and treatment plan.',
};

export default function ScannerPage() {
  return <ScannerCapture />;
}

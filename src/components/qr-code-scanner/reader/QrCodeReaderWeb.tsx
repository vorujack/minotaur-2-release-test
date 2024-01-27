import useQrReader from '@/hooks/useQrReader';
import { QrCodePropsType } from '@/types/qrcode';

interface QrCodeReaderWebPropsType extends QrCodePropsType {
  closeQrCode: () => unknown;
}

const QrCodeReaderWeb = (props: QrCodeReaderWebPropsType) => {
  useQrReader(props.handleScan, props.handleError);
  return (
    <video
      id="qr-code-scanner-video"
      style={{
        width: '100%',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        objectFit: 'cover',
        transform: 'scaleX(-1)',
      }}
    />
    // <div>to be continue</div>
  );
};

export default QrCodeReaderWeb;

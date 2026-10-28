import { config } from '@/lib/config';
import { shortDeviceId } from '@/lib/identity/deviceId';
import { currentDeviceId } from '../identity';

export function Footer() {
  const deviceId = currentDeviceId();
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>
          Data from{' '}
          <a href="https://api.nasa.gov" target="_blank" rel="noreferrer noopener">
            NASA Open APIs
          </a>{' '}
          and the{' '}
          <a href="https://images.nasa.gov" target="_blank" rel="noreferrer noopener">
            NASA Image and Video Library
          </a>
          . Not affiliated with NASA.
        </p>
        <p className="row" style={{ gap: 'var(--space-2)' }}>
          {deviceId && (
            <span className="device-chip" title={`Anonymous device id: ${deviceId}`}>
              {shortDeviceId(deviceId)}
            </span>
          )}
          <span>
            v{config.version}
            {config.mockApi ? ' · sample data' : ''}
          </span>
        </p>
      </div>
    </footer>
  );
}

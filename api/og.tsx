import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('u') || 'GitHub User';
  
  // Fetch GitHub avatar
  const avatarUrl = `https://github.com/${username}.png?size=200`;
  
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0d1117 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Neon grid background effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(57, 255, 20, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(57, 255, 20, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '30px',
          }}
        >
          {/* Avatar with neon glow */}
          <div
            style={{
              display: 'flex',
              borderRadius: '50%',
              padding: '6px',
              background: 'linear-gradient(135deg, #39FF14, #00FFFF, #FF00FF)',
              boxShadow: '0 0 60px rgba(57, 255, 20, 0.5)',
            }}
          >
            <img
              src={avatarUrl}
              width={180}
              height={180}
              style={{
                borderRadius: '50%',
                border: '4px solid #0a0a0f',
              }}
            />
          </div>
          
          {/* Username */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              @{username}
            </span>
          </div>
          
          {/* App branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '10px',
            }}
          >
            <span
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              git.
            </span>
            <span
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#39FF14',
              }}
            >
              3asy
            </span>
            <span
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              .app
            </span>
          </div>
          
          {/* Tagline */}
          <span
            style={{
              fontSize: '24px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '-10px',
            }}
          >
            GitHub contributions → 3D cyberpunk city
          </span>
        </div>
        
        {/* City silhouette hint at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '80px',
            background: 'linear-gradient(transparent, rgba(57, 255, 20, 0.1))',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '8px',
            paddingBottom: '10px',
          }}
        >
          {/* Simplified building silhouettes */}
          {[40, 60, 35, 70, 45, 55, 30, 65, 50, 40, 60, 35, 55, 45].map((h, i) => (
            <div
              key={i}
              style={{
                width: '20px',
                height: `${h}px`,
                background: `linear-gradient(to top, #39FF14, rgba(57, 255, 20, 0.3))`,
                borderRadius: '2px 2px 0 0',
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

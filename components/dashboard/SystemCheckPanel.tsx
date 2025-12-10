import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import StatCard from '../ui/StatCard';

interface ServiceStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'checking' | 'error';
  message: string;
  details?: Record<string, any>;
}

const SystemCheckPanel: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStripe = async (): Promise<ServiceStatus> => {
    try {
      // Check if Stripe.js is loaded
      const stripeJsLoaded = typeof (window as any).Stripe !== 'undefined';
      
      // Check server config
      const configRes = await fetch('/server-api/stripe-config');
      if (!configRes.ok) {
        if (configRes.status === 500) {
          return {
            name: 'Stripe',
            status: 'disconnected',
            message: 'STRIPE_PUBLISHABLE_KEY not set in Cloud Run',
            details: { 
              error: `HTTP ${configRes.status}`,
              note: 'Add STRIPE_PUBLISHABLE_KEY to Cloud Run environment variables'
            }
          };
        }
        return {
          name: 'Stripe',
          status: 'disconnected',
          message: 'Server configuration error',
          details: { error: `HTTP ${configRes.status}` }
        };
      }

      const config = await configRes.json();
      const hasPublishableKey = !!config.publishableKey;
      const keyPrefix = config.publishableKey?.substring(0, 12) || 'N/A';
      const isTestMode = keyPrefix.includes('pk_test_');
      const isLiveMode = keyPrefix.includes('pk_live_');

      if (!hasPublishableKey) {
        return {
          name: 'Stripe',
          status: 'disconnected',
          message: 'Publishable key not configured',
          details: { 
            publishableKey: 'Missing',
            note: 'Set STRIPE_PUBLISHABLE_KEY in Cloud Run environment variables'
          }
        };
      }

      // Try to initialize Stripe
      if (stripeJsLoaded && config.publishableKey) {
        try {
          const stripe = (window as any).Stripe(config.publishableKey);
          return {
            name: 'Stripe',
            status: 'connected',
            message: isTestMode ? 'Payment system operational (Test Mode)' : isLiveMode ? 'Payment system operational (Live Mode)' : 'Payment system operational',
            details: {
              publishableKey: `${keyPrefix}...`,
              mode: isTestMode ? 'Test/Sandbox' : isLiveMode ? 'Live' : 'Unknown',
              stripeJsLoaded: true
            }
          };
        } catch (e) {
          return {
            name: 'Stripe',
            status: 'error',
            message: 'Failed to initialize Stripe.js',
            details: { error: (e as Error).message }
          };
        }
      }

      return {
        name: 'Stripe',
        status: 'disconnected',
        message: 'Stripe.js not loaded',
        details: { stripeJsLoaded: false }
      };
    } catch (error) {
      return {
        name: 'Stripe',
        status: 'error',
        message: 'Connection failed',
        details: { error: (error as Error).message }
      };
    }
  };

  const checkSupabase = async (): Promise<ServiceStatus> => {
    try {
      // First check if env.js has Supabase config
      const envResponse = await fetch('/env.js');
      const envText = await envResponse.text();
      
      // Parse the env.js response properly
      let envData: any = {};
      try {
        // Extract the JSON from window.__ENV__ = {...}
        const jsonMatch = envText.match(/window\.__ENV__\s*=\s*({[^}]+})/);
        if (jsonMatch) {
          envData = JSON.parse(jsonMatch[1]);
        } else {
          // Fallback: try to parse the whole response as JSON
          const jsonStart = envText.indexOf('{');
          const jsonEnd = envText.lastIndexOf('}') + 1;
          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            envData = JSON.parse(envText.substring(jsonStart, jsonEnd));
          }
        }
      } catch (e) {
        console.error('Failed to parse env.js:', e);
      }
      
      const hasSupabaseUrl = !!(envData.VITE_SUPABASE_URL && envData.VITE_SUPABASE_URL.trim() !== '');
      const hasSupabaseKey = !!(envData.VITE_SUPABASE_ANON_KEY && envData.VITE_SUPABASE_ANON_KEY.trim() !== '');

      if (!hasSupabaseUrl || !hasSupabaseKey) {
        return {
          name: 'Supabase',
          status: 'disconnected',
          message: 'Environment variables not configured',
          details: { 
            urlConfigured: hasSupabaseUrl,
            keyConfigured: hasSupabaseKey,
            note: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Cloud Run'
          }
        };
      }

      const response = await fetch('/server-api/bootstrap-data');
      if (!response.ok) {
        return {
          name: 'Supabase',
          status: 'disconnected',
          message: `Connection failed: HTTP ${response.status}`,
          details: { 
            status: response.status,
            note: response.status === 500 ? 'Check SUPABASE_SERVICE_ROLE_KEY secret' : 'Check server logs'
          }
        };
      }

      const data = await response.json();
      const hasData = !!data;
      const tablesLoaded = data?.coaches?.length !== undefined;

      if (hasData && tablesLoaded) {
        return {
          name: 'Supabase',
          status: 'connected',
          message: 'Database connected and operational',
          details: {
            coaches: data.coaches?.length || 0,
            classes: data.classes?.length || 0,
            members: data.members?.length || 0
          }
        };
      }

      return {
        name: 'Supabase',
        status: 'disconnected',
        message: 'Database connection issue',
        details: { hasData, tablesLoaded }
      };
    } catch (error) {
      return {
        name: 'Supabase',
        status: 'error',
        message: 'Connection error',
        details: { error: (error as Error).message }
      };
    }
  };

  const checkWhatsApp = async (): Promise<ServiceStatus> => {
    try {
      // Check if we can reach the WhatsApp endpoint
      const response = await fetch('/server-api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });

      // We expect it to fail with a specific error if configured, or 404 if not set up
      if (response.status === 404) {
        return {
          name: 'WhatsApp (Meta)',
          status: 'disconnected',
          message: 'WhatsApp endpoint not found',
          details: { endpoint: '/server-api/send-whatsapp' }
        };
      }

      // If we get a validation error, it means the endpoint exists and is configured
      const data = await response.json().catch(() => ({}));
      if (data.error && (data.error.includes('coachId') || data.error.includes('phone') || data.error.includes('message'))) {
        return {
          name: 'WhatsApp (Meta)',
          status: 'connected',
          message: 'WhatsApp API configured',
          details: { endpoint: 'Available' }
        };
      }

      if (data.error && data.error.includes('META_ACCESS_TOKEN')) {
        return {
          name: 'WhatsApp (Meta)',
          status: 'disconnected',
          message: 'Access token not configured',
          details: { error: 'Missing META_ACCESS_TOKEN' }
        };
      }

      return {
        name: 'WhatsApp (Meta)',
        status: 'checking',
        message: 'Status unknown',
        details: { status: response.status }
      };
    } catch (error) {
      return {
        name: 'WhatsApp (Meta)',
        status: 'error',
        message: 'Connection error',
        details: { error: (error as Error).message }
      };
    }
  };

  const checkServerHealth = async (): Promise<ServiceStatus> => {
    try {
      const response = await fetch('/server-api/bootstrap-data');
      const responseTime = Date.now();
      await response.json();
      const latency = Date.now() - responseTime;

      return {
        name: 'Server',
        status: 'connected',
        message: 'Server responding',
        details: {
          latency: `${latency}ms`,
          status: response.status
        }
      };
    } catch (error) {
      return {
        name: 'Server',
        status: 'error',
        message: 'Server not responding',
        details: { error: (error as Error).message }
      };
    }
  };

  const checkAllServices = async () => {
    setIsChecking(true);
    setServices([
      { name: 'Checking...', status: 'checking', message: 'Please wait' }
    ]);

    const results = await Promise.all([
      checkServerHealth(),
      checkSupabase(),
      checkStripe(),
      checkWhatsApp(),
    ]);

    setServices(results);
    setIsChecking(false);
    setLastChecked(new Date());
  };

  useEffect(() => {
    checkAllServices();
  }, []);

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-600';
      case 'disconnected':
        return 'bg-red-600';
      case 'error':
        return 'bg-red-800';
      case 'checking':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'connected':
        return '✓';
      case 'disconnected':
        return '✗';
      case 'error':
        return '⚠';
      case 'checking':
        return '⟳';
      default:
        return '?';
    }
  };

  const allConnected = services.every(s => s.status === 'connected');
  const anyErrors = services.some(s => s.status === 'error' || s.status === 'disconnected');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">System Status</h2>
          <p className="text-gray-400 text-sm">
            Monitor the health and connectivity of all integrated services
          </p>
        </div>
        <Button onClick={checkAllServices} disabled={isChecking}>
          {isChecking ? 'Checking...' : 'Refresh Status'}
        </Button>
      </div>

      {lastChecked && (
        <p className="text-sm text-gray-400">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      )}

      {/* Overall Status */}
      <div className={`p-4 rounded-lg ${allConnected ? 'bg-green-900/30 border border-green-600' : anyErrors ? 'bg-red-900/30 border border-red-600' : 'bg-yellow-900/30 border border-yellow-600'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${allConnected ? 'bg-green-500' : anyErrors ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
          <div>
            <p className="font-semibold text-white">
              {allConnected ? 'All Systems Operational' : anyErrors ? 'Some Services Unavailable' : 'Checking Services...'}
            </p>
            <p className="text-sm text-gray-400">
              {services.filter(s => s.status === 'connected').length} of {services.length} services connected
            </p>
          </div>
        </div>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service, index) => (
          <div
            key={index}
            className="bg-brand-dark p-6 rounded-lg border border-gray-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{service.name}</h3>
                <p className="text-sm text-gray-400">{service.message}</p>
              </div>
              <div className={`w-10 h-10 rounded-full ${getStatusColor(service.status)} flex items-center justify-center text-white font-bold text-lg`}>
                {getStatusIcon(service.status)}
              </div>
            </div>

            {service.details && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="space-y-2">
                  {Object.entries(service.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="text-white font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-brand-dark p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="secondary"
            onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
          >
            Open Stripe Dashboard
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.open('https://app.supabase.com', '_blank')}
          >
            Open Supabase Dashboard
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.open('https://developers.facebook.com/apps', '_blank')}
          >
            Open Meta Developer Portal
          </Button>
        </div>
      </div>

      {/* Configuration Checklist */}
      <div className="bg-brand-dark p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Configuration Checklist</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded flex items-center justify-center ${
              services.find(s => s.name === 'Stripe')?.status === 'connected' ? 'bg-green-600' : 'bg-gray-600'
            }`}>
              {services.find(s => s.name === 'Stripe')?.status === 'connected' ? '✓' : '✗'}
            </div>
            <span className="text-gray-300">STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY configured</span>
            {services.find(s => s.name === 'Stripe')?.status !== 'connected' && (
              <span className="text-xs text-red-400 ml-2">(Missing in Cloud Run)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded flex items-center justify-center ${
              services.find(s => s.name === 'Supabase')?.status === 'connected' ? 'bg-green-600' : 'bg-gray-600'
            }`}>
              {services.find(s => s.name === 'Supabase')?.status === 'connected' ? '✓' : '✗'}
            </div>
            <span className="text-gray-300">VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY configured</span>
            {services.find(s => s.name === 'Supabase')?.status !== 'connected' && (
              <span className="text-xs text-red-400 ml-2">(Missing in Cloud Run)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded flex items-center justify-center ${
              services.find(s => s.name === 'WhatsApp (Meta)')?.status === 'connected' ? 'bg-green-600' : 'bg-gray-600'
            }`}>
              {services.find(s => s.name === 'WhatsApp (Meta)')?.status === 'connected' ? '✓' : '✗'}
            </div>
            <span className="text-gray-300">META_ACCESS_TOKEN and META_APP_ID configured</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded flex items-center justify-center ${
              services.find(s => s.name === 'Server')?.status === 'connected' ? 'bg-green-600' : 'bg-gray-600'
            }`}>
              {services.find(s => s.name === 'Server')?.status === 'connected' ? '✓' : '✗'}
            </div>
            <span className="text-gray-300">Server responding and accessible</span>
          </div>
        </div>
        
        {(services.find(s => s.name === 'Stripe')?.status !== 'connected' || 
          services.find(s => s.name === 'Supabase')?.status !== 'connected') && (
          <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
            <p className="text-yellow-300 font-semibold mb-2">⚠️ Action Required</p>
            <p className="text-sm text-yellow-200 mb-2">
              Missing environment variables in Cloud Run. See <code className="bg-black/50 px-2 py-1 rounded">DEPLOY_STRIPE_SUPABASE.md</code> for instructions.
            </p>
            <p className="text-xs text-yellow-300">
              Run: <code className="bg-black/50 px-2 py-1 rounded">gcloud run services update mcgann-boxing --region=europe-west2 --update-env-vars="STRIPE_PUBLISHABLE_KEY=...,STRIPE_SECRET_KEY=...,VITE_SUPABASE_URL=...,VITE_SUPABASE_ANON_KEY=..."</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemCheckPanel;


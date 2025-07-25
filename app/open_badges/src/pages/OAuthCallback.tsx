import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const authCode = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    if (authCode) {
      toast.success('Authorization code received! Copy it to continue the OAuth flow.');
    } else if (error) {
      toast.error(`OAuth Error: ${error}`);
    }
  }, [authCode, error]);

  const copyCode = () => {
    if (authCode) {
      navigator.clipboard.writeText(authCode);
      setCopied(true);
      toast.success('Authorization code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const goToDocs = () => {
    navigate('/docs');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {authCode ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-500" />
            )}
            OAuth 2.0 Authorization Callback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {error ? (
            // Error Case
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                Authorization Failed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                <strong>Error:</strong> {error}
              </p>
              {errorDescription && (
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Description:</strong> {errorDescription}
                </p>
              )}
            </div>
          ) : authCode ? (
            // Success Case
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✅ Authorization Successful!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  The OAuth authorization was successful. You now have an authorization code to exchange for an access token.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Authorization Code:</label>
                <div className="flex gap-2">
                  <Input 
                    value={authCode} 
                    readOnly 
                    className="font-mono text-sm bg-muted"
                  />
                  <Button 
                    onClick={copyCode}
                    variant="outline"
                    size="sm"
                    className={copied ? 'bg-green-100 dark:bg-green-900/20' : ''}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {state && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">State Parameter:</label>
                  <Input 
                    value={state} 
                    readOnly 
                    className="font-mono text-xs bg-muted"
                  />
                </div>
              )}

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📋 Next Steps:
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Copy the authorization code above</li>
                  <li>Go back to the API documentation page</li>
                  <li>Paste it in the "Manual Authorization Code Entry" field</li>
                  <li>Click "Save & Continue" to proceed to the token exchange</li>
                </ol>
              </div>
            </div>
          ) : (
            // No code or error
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                No Authorization Data
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                This page is designed to handle OAuth 2.0 authorization callbacks, but no authorization code or error was found in the URL.
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <Button 
              onClick={goToDocs}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to API Docs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;

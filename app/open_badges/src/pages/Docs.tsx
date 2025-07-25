import React, { useState, useEffect, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';

// Use the actual IDL instruction type from the generated file
type InstructionWithDocs = typeof idl.instructions[number];
import { toast } from 'sonner';
import type { OpenBadges } from '@/types/open_badges';
import idl from '@/idl/open_badges.json';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Copy, Play, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Register Prism languages for syntax highlighting
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('json', json);

const Docs: React.FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program<OpenBadges> | null>(null);
  const [formValues, setFormValues] = useState<{ [key: string]: string }>({});
  const [selectedTab, setSelectedTab] = useState<'anchor' | 'web3js' | 'jsonRpc' | 'curl' | 'test'>('anchor');
  const [isIndexOpen, setIsIndexOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'docs' | 'api'>('docs');

  // API Testing State
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:3001');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/oauth2/register');
  const [selectedEndpointKey, setSelectedEndpointKey] = useState<string>('POST:/oauth2/register');
  const [selectedSubEndpoint, setSelectedSubEndpoint] = useState<string>('POST:/oauth2/register');

  // Authentication Flow State Management
  const [authFlowData, setAuthFlowData] = useState<{
    client_id?: string;
    client_secret?: string;
    authorization_code?: string;
    access_token?: string;
    refresh_token?: string;
    wallet_challenge?: string;
    wallet_signature?: string;
    redirect_uri?: string;
    code_verifier?: string;
    code_challenge?: string;
  }>({});
  const [requestMethod, setRequestMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('POST');
  const [requestBody, setRequestBody] = useState<string>('{}');
  const [requestHeaders, setRequestHeaders] = useState<string>('{}');
  const [responseData, setResponseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);

  // API Endpoints configuration - Open Badges v3.0 Specification Compliant
  const apiEndpoints = [
    // System Health Check
    { path: '/health', method: 'GET', description: 'Check API health status', category: 'System' },
    
    // Open Badges v3.0 Core API (Section 6 of specification)
    { path: '/ims/ob/v3p0/discovery', method: 'GET', description: 'Service discovery - OB v3.0 spec § 6.3.1', category: 'OB Standard' },
    { path: '/ims/ob/v3p0/credentials', method: 'GET', description: 'Get OpenBadgeCredentials - OB v3.0 spec § 6.2.2', category: 'OB Standard' },
    { path: '/ims/ob/v3p0/credentials', method: 'POST', description: 'Upsert AchievementCredential - OB v3.0 spec § 6.2.3', category: 'OB Standard' },
    { path: '/ims/ob/v3p0/profile', method: 'GET', description: 'Get issuer profile - OB v3.0 spec § 6.2.4', category: 'OB Standard' },
    { path: '/ims/ob/v3p0/profile', method: 'PUT', description: 'Update issuer profile - OB v3.0 spec § 6.2.5', category: 'OB Standard' },
    
    // OAuth 2.0 Security (Section 7 of specification) 
    { path: '/oauth2/register', method: 'POST', description: 'OAuth 2.0 dynamic client registration (RFC7591)', category: 'Auth' },
    { path: '/oauth2/authorize', method: 'GET', description: 'OAuth 2.0 authorization endpoint (RFC6749)', category: 'Auth' },
    { path: '/oauth2/token', method: 'POST', description: 'OAuth 2.0 token endpoint (RFC6749)', category: 'Auth' },
    { path: '/oauth2/revoke', method: 'POST', description: 'OAuth 2.0 token revocation (RFC7009)', category: 'Auth' },
    
    // Wallet-based Authentication (Beyond specification)
    { path: '/api/auth/challenge', method: 'POST', description: 'Get wallet signing challenge', category: 'Auth' },
    { path: '/api/auth/verify', method: 'POST', description: 'Verify wallet signature challenge', category: 'Auth' },
    { path: '/api/auth/status', method: 'GET', description: 'Check authentication status', category: 'Auth' },
    { path: '/api/auth/profile', method: 'GET', description: 'Get authenticated user profile', category: 'Auth' },
    { path: '/api/auth/logout', method: 'POST', description: 'Logout and invalidate token', category: 'Auth' },
    
    // Extended API - Profile & Achievement Management
    { path: '/ims/ob/ext/profiles', method: 'POST', description: 'Create issuer profile (extended)', category: 'Extended' },
    { path: '/ims/ob/ext/profiles/:authority', method: 'GET', description: 'Get profile by authority (extended)', category: 'Extended' },
    { path: '/ims/ob/ext/achievements', method: 'GET', description: 'List achievements (extended)', category: 'Extended' },
    { path: '/ims/ob/ext/achievements', method: 'POST', description: 'Create achievement (extended)', category: 'Extended' },
    { path: '/ims/ob/ext/achievements/:id', method: 'GET', description: 'Get specific achievement (extended)', category: 'Extended' },
    { path: '/ims/ob/ext/achievements/:id', method: 'PUT', description: 'Update achievement (extended)', category: 'Extended' },
    { path: '/ims/ob/ext/achievements/:id', method: 'DELETE', description: 'Delete achievement (extended)', category: 'Extended' },
    
    // Extended API - Enhanced Credential Management
    { path: '/ims/ob/ext/credentials', method: 'GET', description: 'List credentials with filtering (extended)', category: 'Extended' },
    { path: '/ims/ob/ext/credentials', method: 'POST', description: 'Issue new credential (extended)', category: 'Extended' },
    { path: '/ims/ob/ext/credentials/:id', method: 'GET', description: 'Get specific credential (extended)', category: 'Extended' },
    { path: '/ims/ob/ext/credentials/:id', method: 'PUT', description: 'Update credential (extended)', category: 'Extended' },
    { path: '/ims/ob/ext/credentials/:id', method: 'DELETE', description: 'Revoke credential (extended)', category: 'Extended' },
    { path: '/ims/ob/ext/credentials/:id/verify', method: 'POST', description: 'Verify credential (extended)', category: 'Extended' },
    { path: '/ims/ob/ext/credentials/:id/status', method: 'GET', description: 'Check credential status (extended)', category: 'Extended' },
    
    // Extended API - Verification & Validation  
    { path: '/ims/ob/ext/verify/credential', method: 'POST', description: 'Verify credential format & signatures', category: 'Extended' },
    { path: '/ims/ob/ext/verify/presentation', method: 'POST', description: 'Verify presentation', category: 'Extended' },
    { path: '/ims/ob/ext/validate/achievement', method: 'POST', description: 'Validate achievement compliance', category: 'Extended' },
    
    // Extended API - DID & Cryptographic Operations
    { path: '/ims/ob/ext/did/resolve/:did', method: 'GET', description: 'Resolve DID document', category: 'Extended' },
    { path: '/ims/ob/ext/crypto/sign', method: 'POST', description: 'Sign credential with Solana key', category: 'Extended' },
    { path: '/ims/ob/ext/crypto/verify', method: 'POST', description: 'Verify Solana signature', category: 'Extended' },
  ];

  // Check API status
  const checkApiStatus = async () => {
    try {
      setApiStatus('checking');
      const response = await fetch(`${apiBaseUrl}/health`);
      if (response.ok) {
        setApiStatus('online');
        const data = await response.json();
        setResponseData(data);
      } else {
        setApiStatus('offline');
      }
    } catch (error) {
      setApiStatus('offline');
    }
  };

  // Generate PKCE code verifier and challenge
  const generatePKCE = () => {
    const codeVerifier = btoa(crypto.getRandomValues(new Uint8Array(32)).reduce((data, byte) => data + String.fromCharCode(byte), ''))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    return crypto.subtle.digest('SHA-256', data).then(hash => {
      const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      return { codeVerifier, codeChallenge };
    });
  };

  // Auto-generate PKCE codes for OAuth flow
  const ensurePKCECodes = async () => {
    if (!authFlowData.code_verifier || !authFlowData.code_challenge) {
      const { codeVerifier, codeChallenge } = await generatePKCE();
      setAuthFlowData(prev => ({
        ...prev,
        code_verifier: codeVerifier,
        code_challenge: codeChallenge
      }));
      return { codeVerifier, codeChallenge };
    }
    return {
      codeVerifier: authFlowData.code_verifier,
      codeChallenge: authFlowData.code_challenge
    };
  };

  // Extract authentication flow data from API responses
  const extractAuthFlowData = (endpoint: string, responseData: any) => {
    let updatedData = { ...authFlowData };
    
    setAuthFlowData(prev => {
      const updated = { ...prev };
      
      switch (endpoint) {
        case '/oauth2/register':
          if (responseData.client_id) updated.client_id = responseData.client_id;
          if (responseData.client_secret) updated.client_secret = responseData.client_secret;
          if (responseData.redirect_uris?.[0]) updated.redirect_uri = responseData.redirect_uris[0];
          // Initialize PKCE codes when client is registered
          if (!updated.code_verifier || !updated.code_challenge) {
            generatePKCE().then(({ codeVerifier, codeChallenge }) => {
              setAuthFlowData(prev => ({
                ...prev,
                code_verifier: codeVerifier,
                code_challenge: codeChallenge
              }));
            });
          }
          break;
          
        case '/oauth2/authorize':
          // Usually this returns a redirect, but if we get a code parameter, capture it
          if (responseData.code) updated.authorization_code = responseData.code;
          break;
          
        case '/oauth2/token':
          if (responseData.access_token) updated.access_token = responseData.access_token;
          if (responseData.refresh_token) updated.refresh_token = responseData.refresh_token;
          // Also set the auth token for subsequent requests
          if (responseData.access_token) setAuthToken(responseData.access_token);
          break;
          
        case '/api/auth/challenge':
          if (responseData.challengeId) updated.wallet_challenge = responseData.challengeId;
          if (responseData.challenge) updated.wallet_challenge = responseData.challenge;
          if (responseData.message) updated.wallet_challenge = responseData.challengeId || responseData.challenge;
          break;
          
        case '/api/auth/verify':
          if (responseData.access_token) updated.access_token = responseData.access_token;
          if (responseData.access_token) setAuthToken(responseData.access_token);
          break;
      }
      
      updatedData = updated;
      return updated;
    });
    
    return updatedData;
  };

  // Get the next suggested step in the OAuth flow
  const getNextFlowStep = () => {
    if (!authFlowData.client_id) return 'POST:/oauth2/register';
    if (!authFlowData.authorization_code) return 'GET:/oauth2/authorize';
    if (!authFlowData.access_token) return 'POST:/oauth2/token';
    return null; // Flow complete
  };

  // Auto-advance to next step after successful request
  const handleFlowAdvancement = (_endpoint: string, wasSuccessful: boolean, updatedAuthData?: any) => {
    if (!wasSuccessful) return;
    
    // Use the provided updated auth data or current state
    const authData = updatedAuthData || authFlowData;
    
    // Determine next step based on updated auth data
    const getNextStepWithData = (data: any) => {
      if (!data.client_id) return 'POST:/oauth2/register';
      if (!data.authorization_code) return 'GET:/oauth2/authorize';
      if (!data.access_token) return 'POST:/oauth2/token';
      return null; // Flow complete
    };
    
    const nextStep = getNextStepWithData(authData);
    if (nextStep && selectedEndpointKey !== nextStep) {
      const [method, path] = nextStep.split(':');
      setSelectedEndpointKey(nextStep);
      setSelectedEndpoint(path);
      setRequestMethod(method as any);
      setSelectedSubEndpoint(nextStep);
      
      // Update request body for the next step
      setRequestBody(getExampleRequestBody(path, method));
      
      toast.success(`Auto-advanced to next step: ${method} ${path}`);
    }
  };

  // Execute API request
  const executeApiRequest = async () => {
    if (!selectedEndpoint) return;
    
    setIsLoading(true);
    setLastRequestTime(Date.now());
    
    try {
      const headers: any = {
        'Content-Type': 'application/json',
        ...JSON.parse(requestHeaders || '{}')
      };
      
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      let url = `${apiBaseUrl}${selectedEndpoint}`;
      const config: RequestInit = {
        method: requestMethod,
        headers,
      };

      if (requestMethod === 'GET' && requestBody) {
        // For GET requests, add parameters to URL as query string
        try {
          const params = JSON.parse(requestBody);
          const urlParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              urlParams.append(key, String(value));
            }
          });
          if (urlParams.toString()) {
            url += `?${urlParams.toString()}`;
          }
        } catch (error) {
          console.warn('Invalid JSON in request body for GET request:', error);
        }
      } else if (requestMethod !== 'GET' && requestBody) {
        config.body = requestBody;
      }

      const response = await fetch(url, config);
      const data = await response.json();
      
      // Extract flow data from successful responses
      if (response.ok) {
        const updatedAuthData = extractAuthFlowData(selectedEndpoint, data);
        handleFlowAdvancement(selectedEndpoint, true, updatedAuthData);
      }
      
      setResponseData({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - lastRequestTime
      });

      if (response.ok) {
        toast.success(`${requestMethod} ${selectedEndpoint} - ${response.status}`);
      } else {
        toast.error(`${requestMethod} ${selectedEndpoint} - ${response.status}`);
        handleFlowAdvancement(selectedEndpoint, false);
      }
    } catch (error: any) {
      setResponseData({
        error: error.message,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - lastRequestTime
      });
      toast.error('Request failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get example request body for endpoint with flow data
  const getExampleRequestBody = (endpoint: string, _method: string) => {
    const examples: any = {
      // Authentication endpoints
      '/api/auth/challenge': {
        walletAddress: wallet.publicKey?.toString() || "YOUR_WALLET_ADDRESS"
      },
      '/api/auth/verify': {
        challengeId: authFlowData.wallet_challenge || "CHALLENGE_ID_FROM_PREVIOUS_REQUEST",
        signature: authFlowData.wallet_signature || "WALLET_SIGNATURE",
        walletAddress: wallet.publicKey?.toString() || "YOUR_WALLET_ADDRESS"
      },
      '/oauth2/register': {
        client_name: "My Open Badges Client",
        client_uri: "http://localhost:5173",
        redirect_uris: [authFlowData.redirect_uri || "http://localhost:5173/oauth/callback"],
        token_endpoint_auth_method: "client_secret_basic",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        scope: "https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.readonly https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.upsert offline_access",
        // Alternative redirect URIs for testing:
        // "https://httpbin.org/get" - Shows the complete callback URL with parameters
        // "http://localhost:5173/oauth/callback" - Uses our custom callback page
      },
      '/oauth2/authorize': {
        // This is a GET request, parameters go in query string
        response_type: "code",
        client_id: authFlowData.client_id || "CLIENT_ID_FROM_REGISTRATION",
        redirect_uri: authFlowData.redirect_uri || "http://localhost:5173/oauth/callback",
        scope: "https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.readonly https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.upsert",
        state: `state_${Date.now()}`, // Generate a random state
        code_challenge: authFlowData.code_challenge || "AUTO_GENERATED_CODE_CHALLENGE",
        code_challenge_method: "S256"
      },
      '/oauth2/token': {
        grant_type: "authorization_code",
        code: authFlowData.authorization_code || "AUTHORIZATION_CODE_FROM_AUTHORIZE",
        redirect_uri: authFlowData.redirect_uri || "http://localhost:5173/oauth/callback",
        client_id: authFlowData.client_id || "CLIENT_ID_FROM_REGISTRATION",
        client_secret: authFlowData.client_secret || "CLIENT_SECRET_FROM_REGISTRATION",
        code_verifier: authFlowData.code_verifier || "AUTO_GENERATED_CODE_VERIFIER"
      },
      '/oauth2/revoke': {
        token: authFlowData.access_token || authFlowData.refresh_token || "TOKEN_TO_REVOKE",
        token_type_hint: authFlowData.access_token ? "access_token" : "refresh_token",
        client_id: authFlowData.client_id || "CLIENT_ID_FROM_REGISTRATION"
      },
      
      // Open Badges v3.0 Standard API
      '/ims/ob/v3p0/credentials': {
        "@context": [
          "https://www.w3.org/ns/credentials/v2",
          "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
        ],
        "id": "http://example.edu/credentials/3732",
        "type": ["VerifiableCredential", "OpenBadgeCredential"],
        "issuer": {
          "id": "https://example.edu/issuers/565049",
          "type": "Profile",
          "name": "Example University"
        },
        "validFrom": "2025-01-01T00:00:00Z",
        "credentialSubject": {
          "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
          "achievement": {
            "id": "https://example.edu/achievements/web-dev-101",
            "type": "Achievement",
            "name": "Web Development Fundamentals",
            "description": "Basic web development skills",
            "criteria": {
              "narrative": "Complete all required modules"
            }
          }
        }
      },
      '/ims/ob/v3p0/profile': {
        "id": "https://example.edu/issuers/565049",
        "type": "Profile",
        "name": "Example University",
        "description": "A leading educational institution",
        "url": "https://example.edu",
        "image": "https://example.edu/logo.png",
        "email": "badges@example.edu"
      },
      
      // Extended API
      '/ims/ob/ext/profiles': {
        name: "Example Organization",
        description: "A sample organization issuing digital badges",
        url: "https://example.org",
        image: "https://example.org/logo.png",
        email: "badges@example.org"
      },
      '/ims/ob/ext/achievements': {
        name: "Web Development Fundamentals",
        description: "Demonstrates proficiency in HTML, CSS, and JavaScript",
        achievementType: "Course",
        criteria: {
          narrative: "Complete all required web development modules and pass final assessment"
        },
        image: "https://example.org/badges/web-dev.png",
        tags: ["web-development", "html", "css", "javascript"]
      },
      '/ims/ob/ext/credentials': {
        achievementId: "ACHIEVEMENT_ID",
        recipientId: "RECIPIENT_DID_OR_ADDRESS",
        format: "json-ld",
        validFrom: "2025-01-01T00:00:00Z",
        evidence: [
          {
            id: "https://example.org/portfolio/project1",
            type: "Evidence",
            name: "Final Project Submission"
          }
        ]
      },
      '/ims/ob/ext/verify/credential': {
        credential: {
          "@context": ["https://www.w3.org/ns/credentials/v2"],
          "type": ["VerifiableCredential", "OpenBadgeCredential"],
          "issuer": "did:example:issuer",
          "credentialSubject": {
            "id": "did:example:subject"
          }
        }
      },
      '/ims/ob/ext/verify/presentation': {
        presentation: {
          "@context": ["https://www.w3.org/ns/credentials/v2"],
          "type": "VerifiablePresentation",
          "verifiableCredential": []
        }
      },
      '/ims/ob/ext/crypto/sign': {
        payload: {
          message: "Content to sign"
        },
        keyId: "SOLANA_PUBLIC_KEY"
      }
    };
    
    return JSON.stringify(examples[endpoint] || {}, null, 2);
  };

  // Handle section navigation and endpoint selection
  const handleSectionClick = (section: string) => {
    // Auto-select relevant endpoint based on section
    const sectionEndpoints: { [key: string]: string } = {
      'auth': 'POST:/oauth2/register',
      'profiles': 'POST:/ims/ob/ext/profiles',
      'achievements': 'POST:/ims/ob/ext/achievements',
      'credentials': 'POST:/ims/ob/ext/credentials',
      'verification': 'POST:/ims/ob/ext/verify/credential',
      'did': 'GET:/ims/ob/ext/did/resolve/:did'
    };
    
    if (sectionEndpoints[section]) {
      const [method, path] = sectionEndpoints[section].split(':');
      setSelectedEndpointKey(sectionEndpoints[section]);
      setSelectedEndpoint(path);
      setRequestMethod(method as any);
      setSelectedSubEndpoint(sectionEndpoints[section]);
      
      // Update request body with smart example
      setRequestBody(getExampleRequestBody(path, method));
    }
  };

  // Handle individual endpoint clicks from content panel
  const handleEndpointClick = (endpoint: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE') => {
    const endpointMethod = method || 'GET';
    const compositeKey = `${endpointMethod}:${endpoint}`;
    
    setSelectedEndpointKey(compositeKey);
    setSelectedEndpoint(endpoint);
    setRequestMethod(endpointMethod);
    setSelectedSubEndpoint(compositeKey);
    
    // Update request body with smart example
    setRequestBody(getExampleRequestBody(endpoint, endpointMethod));
  };

  // Handle progress button clicks with proper state synchronization
  const handleProgressClick = async (endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', needsPKCE = false) => {
    const compositeKey = `${method}:${endpoint}`;
    
    // Generate PKCE codes if needed (for authorization endpoint) BEFORE updating state
    if (needsPKCE) {
      await ensurePKCECodes();
    }
    
    // Update all endpoint-related state
    setSelectedEndpointKey(compositeKey);
    setSelectedEndpoint(endpoint);
    setRequestMethod(method);
    setSelectedSubEndpoint(compositeKey);
    
    // Update request body with the latest auth flow data
    setRequestBody(getExampleRequestBody(endpoint, method));
    
    toast.success(`Switched to ${endpoint} endpoint`);
  };

  // Define instruction categories and ordering based on actual available instructions
  const coreInstructions = [
    'initialize_issuer',
    'initialize_issuer_with_did', 
    'create_achievement',
    'issue_achievement_credential',
    'issue_achievement_credential_simple_subject',
    'initialize_revocation_list',
    'revoke_credential'
  ];

  const extensionInstructions = [
    'batch_revocation_operation',
    'reactivate_credential',
    'revoke_credential_direct'
  ];

  const utilityInstructions = [
    'generate_jsonld_credential',
    'generate_jwt_credential', 
    'generate_credential_json',
    'generate_credential_json_did_subject',
    'generate_credential_json_simple_subject',
    'create_linked_data_proof',
    'verify_credential',
    'verify_credential_format',
    'verify_linked_data_proof',
    'resolve_did_document',
    'validate_achievement_compliance',
    'validate_credential_compliance', 
    'validate_profile_compliance'
  ];

  // Get ordered instructions with sections - only include instructions that exist in IDL
  const getOrderedInstructions = () => {
    const allInstructions = [...coreInstructions, ...extensionInstructions, ...utilityInstructions];
    const availableInstructions = idl.instructions.filter(inst => allInstructions.includes(inst.name));
    return availableInstructions.sort((a, b) => allInstructions.indexOf(a.name) - allInstructions.indexOf(b.name));
  };

  const [selectedInstruction, setSelectedInstruction] = useState<InstructionWithDocs>(() => {
    const ordered = getOrderedInstructions();
    return ordered.length > 0 ? ordered[0] as any : idl.instructions[0] as any;
  });

  const sectionRefs = useRef<HTMLDivElement[]>([]);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  // Track previous visible index to prevent flicker
  const prevIndexRef = useRef<number>(0);
  // Refs for sidebar nav buttons to auto-scroll
  const navRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      const provider = new AnchorProvider(connection, wallet as any, AnchorProvider.defaultOptions());
      const programInstance = new Program<OpenBadges>(idl as any, provider);
      setProgram(programInstance);
    } else {
      setProgram(null);
    }
  }, [wallet, connection]);

  // Check API status when switching to API mode
  useEffect(() => {
    if (viewMode === 'api') {
      checkApiStatus();
    }
  }, [viewMode, apiBaseUrl]);

  // Update request method when endpoint changes (but only if not explicitly set)
  useEffect(() => {
    const endpoint = apiEndpoints.find(ep => ep.path === selectedEndpoint && ep.method === requestMethod);
    if (endpoint) {
      // Only update request body if the method matches what we expect
      if (endpoint.method !== 'GET') {
        setRequestBody(getExampleRequestBody(selectedEndpoint, endpoint.method));
      } else {
        setRequestBody(getExampleRequestBody(selectedEndpoint, 'GET'));
      }
    }
  }, [selectedEndpoint, requestMethod]);

  // Auto-update request body when auth flow data changes
  useEffect(() => {
    if (selectedEndpoint && viewMode === 'api') {
      const currentEndpoint = apiEndpoints.find(ep => ep.path === selectedEndpoint && ep.method === requestMethod);
      if (currentEndpoint) {
        setRequestBody(getExampleRequestBody(selectedEndpoint, requestMethod));
      }
    }
  }, [authFlowData, selectedEndpoint, requestMethod, viewMode]);

  const handleInputChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!program || !selectedInstruction || !wallet.publicKey) {
      toast.error('Please connect your wallet.');
      return;
    }
    try {
      const args = await Promise.all(
        selectedInstruction.args.map(async (arg: any) => {
          const value = formValues[arg.name];
          if (['u64', 'u32', 'u16', 'u8'].includes(arg.type)) {
            return new BN(value);
          }
          if (arg.type === 'publicKey') {
            return new web3.PublicKey(value);
          }
          return value;
        })
      );
      const accounts = selectedInstruction.accounts.reduce((acc: any, account: any) => {
        if (formValues[account.name]) {
          acc[account.name] = new web3.PublicKey(formValues[account.name]);
        }
        return acc;
      }, {});
      if (!accounts.systemProgram) accounts.systemProgram = web3.SystemProgram.programId;
      if (!accounts.rent) accounts.rent = web3.SYSVAR_RENT_PUBKEY;
      const tx = await (program.methods as any)[selectedInstruction.name](...args).accounts(accounts).rpc();
      toast.success('Transaction sent', { description: tx });
    } catch (error: any) {
      toast.error('Transaction error', { description: error.message });
    }
  };

  const renderDocs = (docs: any) => {
    if (!docs) {
      return null;
    }
    if (typeof docs === 'string') {
      return <p>{docs}</p>;
    }
    if (Array.isArray(docs)) {
      return docs.map((line: string, i: number) => <p key={i}>{line}</p>);
    }
    if (typeof docs === 'object') {
      const def = (docs as any).defined;
      if (def !== undefined) {
        if (typeof def === 'string') {
          return <p>{def}</p>;
        }
        if (Array.isArray(def)) {
          return def.map((line: string, i: number) => <p key={i}>{line}</p>);
        }
        return <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(def, null, 2)}</pre>;
      }
      return <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(docs, null, 2)}</pre>;
    }
    return null;
  };

  // Helper to render argument and account types
  const renderType = (type: any): string => {
    if (typeof type === 'string') {
      return type;
    }
    if (type && typeof type === 'object') {
      if ('defined' in type) {
        const def = (type as any).defined;
        if (typeof def === 'string') return def;
        if (typeof def === 'object' && 'name' in def) return (def as any).name;
        return JSON.stringify(def);
      }
      if ('vec' in type) {
        return `Vec<${renderType((type as any).vec)}>`;
      }
      if ('option' in type) {
        return `Option<${renderType((type as any).option)}>`;
      }
      return JSON.stringify(type);
    }
    return String(type);
  };

  // Define descriptions for each instruction
  const instructionDescriptions: Record<string, string> = {
    initialize_issuer: `Creates a basic issuer profile account that represents an organization or individual capable of issuing Open Badges v3.0 credentials. This is the foundational step for any badge issuing entity.`,
    initialize_issuer_with_did: `Creates an issuer profile with full DID (Decentralized Identifier) integration. Enables advanced identity verification and interoperability with external systems that support DID standards.`,
    create_achievement: `Creates an achievement definition that describes a specific accomplishment, skill, or competency. Achievements serve as templates for issuing credentials and must comply with Open Badges v3.0 achievement schema.`,
    issue_achievement_credential: `Issues a verifiable credential for a specific achievement to a recipient. Creates a complete Open Badges v3.0 compliant credential with cryptographic proof and DID-based subject identification.`,
    issue_achievement_credential_simple_subject: `Issues a credential using simple address-based subject identification instead of DID format. Provides a more straightforward approach while maintaining Open Badges v3.0 compliance.`,
    initialize_revocation_list: `Initializes a revocation list for tracking credential status. Essential for implementing proper credential status checking and revocation management as required by Open Badges v3.0.`,
    revoke_credential: `Revokes a previously issued credential by setting its revocation status. Implements proper credential lifecycle management as required by the Open Badges v3.0 specification.`,
    batch_revocation_operation: `Performs batch revocation and reactivation operations for multiple credentials. Provides efficient management of credential lifecycle at scale.`,
    reactivate_credential: `Reactivates a previously revoked credential, restoring its validity. Useful for correcting erroneous revocations or reinstating credentials after appeals.`,
    revoke_credential_direct: `Directly revokes a credential with immediate effect. Provides a streamlined revocation process for urgent cases.`,
    generate_jsonld_credential: `Generates a JSON-LD formatted credential for a given achievement. Returns the complete credential data structure compliant with Open Badges v3.0 and W3C Verifiable Credentials specifications.`,
    generate_jwt_credential: `Generates a JWT (JSON Web Token) formatted credential for a given achievement. Provides an alternative credential format while maintaining Open Badges v3.0 compliance.`,
    generate_credential_json: `Generates a generic JSON credential format. Provides flexibility for custom credential representations while maintaining core compliance.`,
    generate_credential_json_did_subject: `Generates JSON credentials specifically formatted with DID subjects. Optimized for systems requiring advanced identity verification.`,
    generate_credential_json_simple_subject: `Generates JSON credentials with simple address-based subjects. Streamlined for straightforward credential requirements.`,
    verify_credential: `Performs comprehensive verification of a credential including signature validation, issuer verification, and compliance checking.`,
    verify_credential_format: `Verifies the format and structure of a credential against Open Badges v3.0 specifications. Validates both JSON-LD and JWT credential formats for compliance.`,
    verify_linked_data_proof: `Verifies cryptographic proofs in linked data credentials. Ensures the integrity and authenticity of credential signatures.`,
    create_linked_data_proof: `Creates cryptographic proofs for linked data credentials. Generates the digital signatures necessary for credential authenticity.`,
    resolve_did_document: `Resolves a DID (Decentralized Identifier) to its complete DID document. Supports did:sol, did:key, and did:web methods for comprehensive identity resolution.`,
    validate_achievement_compliance: `Validates an achievement definition against Open Badges v3.0 specification requirements. Ensures achievements meet all necessary compliance standards.`,
    validate_credential_compliance: `Validates a credential against Open Badges v3.0 specification requirements. Comprehensive compliance checking for issued credentials.`,
    validate_profile_compliance: `Validates an issuer profile against Open Badges v3.0 specification requirements. Ensures issuer information meets all compliance standards.`,
  };

  // Manual mapping of instructions to pertinent Open Badges v3.0 spec URLs
  const specLinks: Record<string, { label: string; href: string }> = {
    initialize_issuer: {
      label: 'Profile Specification',
      href: 'https://purl.imsglobal.org/spec/ob/v3p0/#profile',
    },
    initialize_issuer_with_did: {
      label: 'Profile Specification',
      href: 'https://purl.imsglobal.org/spec/ob/v3p0/#profile',
    },
    create_achievement: {
      label: 'Achievement Specification', 
      href: 'https://purl.imsglobal.org/spec/ob/v3p0/#achievement',
    },
    issue_achievement_credential: {
      label: 'AchievementCredential Specification',
      href: 'https://purl.imsglobal.org/spec/ob/v3p0/#achievementcredential',
    },
    issue_achievement_credential_simple_subject: {
      label: 'AchievementCredential Specification',
      href: 'https://purl.imsglobal.org/spec/ob/v3p0/#achievementcredential',
    },
    initialize_revocation_list: {
      label: 'Credential Status',
      href: 'https://purl.imsglobal.org/spec/ob/v3p0/#credentialstatus',
    },
    revoke_credential: {
      label: 'Credential Status',
      href: 'https://purl.imsglobal.org/spec/ob/v3p0/#credentialstatus',
    },
    batch_revocation_operation: {
      label: 'Credential Status',
      href: 'https://purl.imsglobal.org/spec/ob/v3p0/#credentialstatus',
    },
    generate_jsonld_credential: {
      label: 'JSON-LD Serialization',
      href: 'https://purl.imsglobal.org/spec/ob/v3p0/#json-ld-serialization',
    },
    generate_jwt_credential: {
      label: 'JWT Serialization',
      href: 'https://purl.imsglobal.org/spec/ob/v3p0/#jwt-serialization',
    },
    verify_credential_format: {
      label: 'Verification',
      href: 'https://purl.imsglobal.org/spec/ob/v3p0/#verification',
    },
    verify_credential: {
      label: 'Verification',
      href: 'https://purl.imsglobal.org/spec/ob/v3p0/#verification',
    },
    resolve_did_document: {
      label: 'DID Methods',
      href: 'https://www.w3.org/TR/did-core/#did-resolution',
    },
  };

  // Track selected instruction index for display
  const orderedInstructions = getOrderedInstructions();
  const selectedIndex = orderedInstructions.findIndex((ins) => ins.name === selectedInstruction.name);

  // Prepare code examples for the selected instruction
  const anchorExample = `import { SystemProgram } from "@solana/web3.js";
const signature = await program.methods.${selectedInstruction.name}(${selectedInstruction.args.map(arg => arg.name).join(', ')})
  .accounts({
    ${selectedInstruction.accounts.map((acct: any) => `${acct.name}: /* PublicKey */`).join(',\n    ')},
    systemProgram: SystemProgram.programId
  })
  .rpc();
console.log('Signature:', signature);`;
  const web3jsExample = `import { Transaction } from "@solana/web3.js";
const ix = program.instruction.${selectedInstruction.name}(${selectedInstruction.args.map(arg => arg.name).join(', ')});
const tx = new Transaction().add(ix);
const signature = await connection.sendTransaction(tx, [wallet.publicKey]);
await connection.confirmTransaction(signature, 'confirmed');
console.log('Signature:', signature);`;
  const jsonRpcExample = `import { Transaction, SystemProgram } from "@solana/web3.js";
const ix = program.instruction.${selectedInstruction.name}(${selectedInstruction.args.map(arg => arg.name).join(', ')});
const tx = new Transaction().add(ix);
tx.feePayer = wallet.publicKey!;
tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
const serialized = tx.serialize({ requireAllSignatures: false });
const base64Tx = serialized.toString("base64");
const response = await fetch(connection.rpcEndpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'sendTransaction',
    params: [
      base64Tx,
      { encoding: 'base64', preflightCommitment: 'confirmed' }
    ]
  })
});
const signature = (await response.json()).result;
console.log('Signature:', signature);`;
  const curlExample = `curl -X POST ${connection.rpcEndpoint} \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sendTransaction",
    "params": [
      "<BASE64_TX>",
      {
        "encoding": "base64",
        "preflightCommitment": "confirmed"
      }
    ]
  }'`;

  const handlePanelScroll = () => {
    const container = leftPanelRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop;
    const center = scrollTop + container.clientHeight / 2;
    let bestIdx = prevIndexRef.current;
    let minDist = Infinity;
    sectionRefs.current.forEach((el, i) => {
      const elCenter = el.offsetTop + el.clientHeight / 2;
      const dist = Math.abs(elCenter - center);
      if (dist < minDist) {
        minDist = dist;
        bestIdx = i;
      }
    });
    if (bestIdx !== prevIndexRef.current && orderedInstructions[bestIdx]) {
      prevIndexRef.current = bestIdx;
      setSelectedInstruction(orderedInstructions[bestIdx] as any);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Collapsible Index Column */}
      <div className={`flex-none sticky top-0 h-full flex flex-col bg-background transition-all ${isIndexOpen ? 'w-88 p-2' : 'w-8 p-2'}`}>  
        <div className="flex items-center justify-between">
          {isIndexOpen && (
            <div className="flex-1 flex items-center justify-between">
              <span className="font-semibold text-sm">Content</span>
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'docs' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('docs')}
                  className="h-6 text-xs px-3 rounded-md"
                >
                  📚 Chain
                </Button>
                <Button
                  variant={viewMode === 'api' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('api')}
                  className="h-6 text-xs px-3 rounded-md"
                >
                  🚀 API
                </Button>
              </div>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsIndexOpen(!isIndexOpen)}>
            {isIndexOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </Button>
        </div>
        {isIndexOpen && (
          <nav className="mt-1 flex-1 overflow-y-auto space-y-1">
            {viewMode === 'docs' ? (
              // Program Documentation Index - Categorized
              <div className="space-y-3">
                {/* Core Compliance Section */}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1 px-2">
                    🏛️ Core Compliance
                  </div>
                  {orderedInstructions
                    .filter(inst => coreInstructions.includes(inst.name))
                    .map((inst) => {
                      const globalIdx = orderedInstructions.findIndex(i => i.name === inst.name);
                      return (
                        <Button
                          key={inst.name}
                          ref={(el) => { navRefs.current[globalIdx] = el; }}
                          variant="ghost"
                          className={`justify-start w-full ml-2 pl-2 text-xs ${selectedInstruction.name === inst.name ? 'text-primary font-bold bg-primary/10' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const container = leftPanelRef.current;
                            if (container) {
                              const el = sectionRefs.current[globalIdx];
                              const offset = el.offsetTop - (container.clientHeight - el.clientHeight) / 2;
                              container.scrollTo({ top: offset, behavior: 'smooth' });
                            }
                            setSelectedInstruction(inst as InstructionWithDocs);
                            prevIndexRef.current = globalIdx;
                            navRefs.current[globalIdx]?.scrollIntoView({ block: 'center' });
                          }}
                        >
                          <Badge variant="secondary" className="mr-1">{globalIdx + 1}</Badge>
                          <span className="truncate">{inst.name}</span>
                        </Button>
                      );
                    })}
                </div>

                {/* Revocation Extensions Section */}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1 px-2">
                    🚀 Revocation Extensions
                  </div>
                  {orderedInstructions
                    .filter(inst => extensionInstructions.includes(inst.name))
                    .map((inst) => {
                      const globalIdx = orderedInstructions.findIndex(i => i.name === inst.name);
                      return (
                        <Button
                          key={inst.name}
                          ref={(el) => { navRefs.current[globalIdx] = el; }}
                          variant="ghost"
                          className={`justify-start w-full ml-2 pl-2 text-xs ${selectedInstruction.name === inst.name ? 'text-primary font-bold bg-primary/10' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const container = leftPanelRef.current;
                            if (container) {
                              const el = sectionRefs.current[globalIdx];
                              const offset = el.offsetTop - (container.clientHeight - el.clientHeight) / 2;
                              container.scrollTo({ top: offset, behavior: 'smooth' });
                            }
                            setSelectedInstruction(inst as InstructionWithDocs);
                            prevIndexRef.current = globalIdx;
                            navRefs.current[globalIdx]?.scrollIntoView({ block: 'center' });
                          }}
                        >
                          <Badge variant="secondary" className="mr-1">{globalIdx + 1}</Badge>
                          <span className="truncate">{inst.name}</span>
                        </Button>
                      );
                    })}
                </div>

                {/* Utilities Section */}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1 px-2">
                    🔧 Utilities
                  </div>
                  {orderedInstructions
                    .filter(inst => utilityInstructions.includes(inst.name))
                    .map((inst) => {
                      const globalIdx = orderedInstructions.findIndex(i => i.name === inst.name);
                      return (
                        <Button
                          key={inst.name}
                          ref={(el) => { navRefs.current[globalIdx] = el; }}
                          variant="ghost"
                          className={`justify-start w-full ml-2 pl-2 text-xs ${selectedInstruction.name === inst.name ? 'text-primary font-bold bg-primary/10' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const container = leftPanelRef.current;
                            if (container) {
                              const el = sectionRefs.current[globalIdx];
                              const offset = el.offsetTop - (container.clientHeight - el.clientHeight) / 2;
                              container.scrollTo({ top: offset, behavior: 'smooth' });
                            }
                            setSelectedInstruction(inst as InstructionWithDocs);
                            prevIndexRef.current = globalIdx;
                            navRefs.current[globalIdx]?.scrollIntoView({ block: 'center' });
                          }}
                        >
                          <Badge variant="secondary" className="mr-1">{globalIdx + 1}</Badge>
                          <span className="truncate">{inst.name}</span>
                        </Button>
                      );
                    })}
                </div>
              </div>
            ) : (
              // API Client Index with detailed sections
              <div className="space-y-3">
                <div>
                  <Button 
                    variant="ghost"
                    className="justify-start w-full px-2 text-xs font-semibold text-muted-foreground mb-1"
                    onClick={() => handleSectionClick('auth')}
                  >
                    🔐 1. Authentication
                  </Button>
                  <div className="ml-2 space-y-1">
                    {/* Official OAuth 2.0 Specification Endpoints (Section 7) */}
                    <div className="text-xs font-medium text-muted-foreground mb-2 px-2">OAuth 2.0 (Official Spec)</div>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'POST:/oauth2/register' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/oauth2/register', 'POST')}
                    >
                      <span className="truncate">Client Registration</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'GET:/oauth2/authorize' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/oauth2/authorize', 'GET')}
                    >
                      <span className="truncate">Authorization Endpoint</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'POST:/oauth2/token' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/oauth2/token', 'POST')}
                    >
                      <span className="truncate">Token Endpoint</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'POST:/oauth2/revoke' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/oauth2/revoke', 'POST')}
                    >
                      <span className="truncate">Token Revocation</span>
                    </Button>
                    
                    {/* Wallet-based Authentication (Extended) */}
                    <div className="text-xs font-medium text-muted-foreground mb-2 px-2 mt-4">Wallet-based (Extended)</div>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'POST:/api/auth/challenge' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/api/auth/challenge', 'POST')}
                    >
                      <span className="truncate">Wallet Challenge</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'POST:/api/auth/verify' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/api/auth/verify', 'POST')}
                    >
                      <span className="truncate">Verify Signature</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'GET:/api/auth/status' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/api/auth/status', 'GET')}
                    >
                      <span className="truncate">Auth Status</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'POST:/api/auth/logout' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/api/auth/logout', 'POST')}
                    >
                      <span className="truncate">Logout</span>
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Button 
                    variant="ghost"
                    className="justify-start w-full px-2 text-xs font-semibold text-muted-foreground mb-1"
                    onClick={() => handleSectionClick('profiles')}
                  >
                    👤 2. Profiles & Issuers
                  </Button>
                  <div className="ml-2 space-y-1">
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'POST:/ims/ob/ext/profiles' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/ext/profiles', 'POST')}
                    >
                      <span className="truncate">Create Profile</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'PUT:/ims/ob/v3p0/profile' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/v3p0/profile', 'PUT')}
                    >
                      <span className="truncate">Update Profile</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'GET:/ims/ob/v3p0/profile' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/v3p0/profile', 'GET')}
                    >
                      <span className="truncate">Get Profile Info</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <Button 
                    variant="ghost"
                    className="justify-start w-full px-2 text-xs font-semibold text-muted-foreground mb-1"
                    onClick={() => handleSectionClick('achievements')}
                  >
                    🏆 3. Achievements
                  </Button>
                  <div className="ml-2 space-y-1">
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'POST:/ims/ob/ext/achievements' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/ext/achievements', 'POST')}
                    >
                      <span className="truncate">Create Achievement</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'GET:/ims/ob/ext/achievements' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/ext/achievements', 'GET')}
                    >
                      <span className="truncate">List Achievements</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'PUT:/ims/ob/ext/achievements/:id' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/ext/achievements/:id', 'PUT')}
                    >
                      <span className="truncate">Update Achievement</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <Button 
                    variant="ghost"
                    className="justify-start w-full px-2 text-xs font-semibold text-muted-foreground mb-1"
                    onClick={() => handleSectionClick('credentials')}
                  >
                    🎖️ 4. Credentials
                  </Button>
                  <div className="ml-2 space-y-1">
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'POST:/ims/ob/ext/credentials' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/ext/credentials', 'POST')}
                    >
                      <span className="truncate">Issue Credential</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'GET:/ims/ob/v3p0/credentials' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/v3p0/credentials', 'GET')}
                    >
                      <span className="truncate">Get Credentials</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'PUT:/ims/ob/ext/credentials/:id' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/ext/credentials/:id', 'PUT')}
                    >
                      <span className="truncate">Update Credential</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'DELETE:/ims/ob/ext/credentials/:id' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/ext/credentials/:id', 'DELETE')}
                    >
                      <span className="truncate">Revoke Credential</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <Button 
                    variant="ghost"
                    className="justify-start w-full px-2 text-xs font-semibold text-muted-foreground mb-1"
                    onClick={() => handleSectionClick('verification')}
                  >
                    ✅ 5. Verification
                  </Button>
                  <div className="ml-2 space-y-1">
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'POST:/ims/ob/ext/verify/credential' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/ext/verify/credential', 'POST')}
                    >
                      <span className="truncate">Verify Credential</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'GET:/ims/ob/ext/credentials/:id/status' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/ext/credentials/:id/status', 'GET')}
                    >
                      <span className="truncate">Check Status</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'POST:/ims/ob/ext/verify/presentation' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/ext/verify/presentation', 'POST')}
                    >
                      <span className="truncate">Verify Presentation</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <Button 
                    variant="ghost"
                    className="justify-start w-full px-2 text-xs font-semibold text-muted-foreground mb-1"
                    onClick={() => handleSectionClick('did')}
                  >
                    🆔 6. DID Resolution
                  </Button>
                  <div className="ml-2 space-y-1">
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'GET:/ims/ob/ext/did/resolve/:did' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/ext/did/resolve/:did', 'GET')}
                    >
                      <span className="truncate">Resolve DID</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`justify-start w-full pl-2 text-xs ${selectedSubEndpoint === 'POST:/ims/ob/ext/crypto/sign' ? 'text-primary font-bold bg-primary/10' : ''}`} 
                      onClick={() => handleEndpointClick('/ims/ob/ext/crypto/sign', 'POST')}
                    >
                      <span className="truncate">Crypto Operations</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </nav>
        )}
      </div>
      
      {/* Main Content Area */}
      <div
        ref={leftPanelRef}
        onScroll={viewMode === 'docs' ? handlePanelScroll : undefined}
        className={`flex-1 pt-6 px-6 pb-16 overflow-y-auto h-full ${
          viewMode === 'api' 
            ? 'w-full' 
            : isIndexOpen ? 'w-3/5' : 'w-4/5'
        } [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
        
        {viewMode === 'docs' ? (
          // Documentation Content
          <div className="space-y-6">
            {/* Direct Solana Integration Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Open Badges v3.0 Direct Integration</h2>
              <p className="text-muted-foreground mb-4">
                Direct blockchain interaction where the React app communicates with the Solana Open Badges v3.0 program using Anchor and wallet adapters. This provides immediate on-chain verification and full decentralization.
              </p>
              <div className="bg-chart-4/10 p-4 rounded-lg border border-chart-4/20">
                <h3 className="font-medium text-foreground mb-2">Integration Flow:</h3>
                <div className="text-sm text-muted-foreground">
                  <code className="bg-chart-4/20 px-2 py-1 rounded text-xs text-foreground">
                    React App → Anchor Client → Open Badges Program → Solana Blockchain
                  </code>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <li>• Direct Open Badges v3.0 compliant credential issuance</li>
                  <li>• Wallet-based authentication with Ed25519 signatures</li>
                  <li>• On-chain DID resolution and verification</li>
                  <li>• Complete credential lifecycle management</li>
                  <li>• JSON-LD and JWT credential format support</li>
                </ul>
              </div>
            </div>
            
            {/* Core Compliance Section */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold">🏛️ Core Compliance Instructions</h3>
                <Badge variant="default" className="bg-primary hover:bg-primary/90">Required</Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Essential instructions required for Open Badges v3.0 compliance. These cover the complete credential lifecycle from issuer setup to credential management.
              </p>
            </div>
            
            {orderedInstructions
              .filter(inst => coreInstructions.includes(inst.name))
              .map((instruction) => {
                const globalIndex = orderedInstructions.findIndex(i => i.name === instruction.name);
                return (
                  <Card key={instruction.name} ref={(el: HTMLDivElement) => { if (el) sectionRefs.current[globalIndex] = el; }} className="scroll-mt-6 shadow-sm">
                    <CardHeader className="flex items-center space-x-2">
                      <Badge variant="secondary">{globalIndex + 1}</Badge>
                      <CardTitle className="text-base font-semibold truncate">{instruction.name}</CardTitle>
                      <Badge variant="default" className="bg-primary hover:bg-primary/90">Core</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 prose prose-sm dark:prose-invert">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-foreground/80 flex-1">{instructionDescriptions[instruction.name] ?? 'No description available.'}</p>
                        {specLinks[instruction.name] && (
                          <Button asChild variant="outline" size="sm">
                            <a href={specLinks[instruction.name].href} target="_blank">
                              {specLinks[instruction.name].label}
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="prose prose-sm dark:prose-invert">
                        {renderDocs((instruction as InstructionWithDocs).docs)}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Arguments</h3>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {instruction.args.map((arg: any) => (
                            <li key={arg.name}>
                              <strong>{arg.name}</strong>: {renderType(arg.type)}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Accounts</h3>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {instruction.accounts.map((account: any) => (
                            <li key={account.name}>
                              <strong>{account.name}</strong>: {account.isMut ? 'mutable ' : ''}{account.isSigner ? 'signer' : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

            {/* Batch Extensions Section */}
            <div className="mb-6 mt-8">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold">🚀 Revocation Extensions</h3>
                <Badge variant="secondary">Extension</Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Advanced credential lifecycle management operations including batch revocation and credential reactivation for comprehensive status control.
              </p>
            </div>
            
            {orderedInstructions
              .filter(inst => extensionInstructions.includes(inst.name))
              .map((instruction) => {
                const globalIndex = orderedInstructions.findIndex(i => i.name === instruction.name);
                return (
                  <Card key={instruction.name} ref={(el: HTMLDivElement) => { if (el) sectionRefs.current[globalIndex] = el; }} className="scroll-mt-6 shadow-sm">
                    <CardHeader className="flex items-center space-x-2">
                      <Badge variant="secondary">{globalIndex + 1}</Badge>
                      <CardTitle className="text-base font-semibold truncate">{instruction.name}</CardTitle>
                      <Badge variant="secondary">Extension</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 prose prose-sm dark:prose-invert">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-foreground/80 flex-1">{instructionDescriptions[instruction.name] ?? 'No description available.'}</p>
                        {specLinks[instruction.name] && (
                          <Button asChild variant="outline" size="sm">
                            <a href={specLinks[instruction.name].href} target="_blank">
                              {specLinks[instruction.name].label}
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="prose prose-sm dark:prose-invert">
                        {renderDocs((instruction as InstructionWithDocs).docs)}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Arguments</h3>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {instruction.args.map((arg: any) => (
                            <li key={arg.name}>
                              <strong>{arg.name}</strong>: {renderType(arg.type)}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Accounts</h3>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {instruction.accounts.map((account: any) => (
                            <li key={account.name}>
                              <strong>{account.name}</strong>: {account.isMut ? 'mutable ' : ''}{account.isSigner ? 'signer' : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

            {/* Utilities Section */}
            <div className="mb-6 mt-8">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold">🔧 Utility Instructions</h3>
                <Badge variant="outline">Utility</Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Helper functions for credential generation, verification, and compliance validation. These support the core functionality with additional tooling and format conversions.
              </p>
            </div>
            
            {orderedInstructions
              .filter(inst => utilityInstructions.includes(inst.name))
              .map((instruction) => {
                const globalIndex = orderedInstructions.findIndex(i => i.name === instruction.name);
                return (
                  <Card key={instruction.name} ref={(el: HTMLDivElement) => { if (el) sectionRefs.current[globalIndex] = el; }} className="scroll-mt-6 shadow-sm">
                    <CardHeader className="flex items-center space-x-2">
                      <Badge variant="secondary">{globalIndex + 1}</Badge>
                      <CardTitle className="text-base font-semibold truncate">{instruction.name}</CardTitle>
                      <Badge variant="outline">Utility</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 prose prose-sm dark:prose-invert">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-foreground/80 flex-1">{instructionDescriptions[instruction.name] ?? 'No description available.'}</p>
                        {specLinks[instruction.name] && (
                          <Button asChild variant="outline" size="sm">
                            <a href={specLinks[instruction.name].href} target="_blank">
                              {specLinks[instruction.name].label}
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="prose prose-sm dark:prose-invert">
                        {renderDocs((instruction as InstructionWithDocs).docs)}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Arguments</h3>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {instruction.args.map((arg: any) => (
                            <li key={arg.name}>
                              <strong>{arg.name}</strong>: {renderType(arg.type)}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Accounts</h3>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {instruction.accounts.map((account: any) => (
                            <li key={account.name}>
                              <strong>{account.name}</strong>: {account.isMut ? 'mutable ' : ''}{account.isSigner ? 'signer' : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        ) : (
          // API Client Content - Interactive Testing
          <div className="space-y-6 pr-4">
            
            {/* API Status and Testing Interface */}
            <div className="mb-6">
              {/* API Status Card */}
              <div className="flex items-center gap-4 p-4 bg-card rounded-lg border mb-6">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${apiStatus === 'online' ? 'bg-primary' : apiStatus === 'offline' ? 'bg-destructive' : 'bg-muted animate-pulse'}`}></div>
                  <span className="font-medium">
                    API Status: <span className={apiStatus === 'online' ? 'text-primary' : apiStatus === 'offline' ? 'text-destructive' : 'text-muted-foreground'}>
                      {apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Checking...'}
                    </span>
                  </span>
                </div>
                <Input 
                  value={apiBaseUrl} 
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  placeholder="API Base URL"
                  className="max-w-xs"
                />
                <Button 
                  onClick={checkApiStatus} 
                  size="sm" 
                  disabled={apiStatus === 'checking'}
                >
                  {apiStatus === 'checking' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check Status'}
                </Button>
              </div>

              {/* Auth Flow Status Card */}
              <div className="p-4 from-primary/10 to-secondary/10 rounded-lg border border-border mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">🔄 Authentication Flow Progress</h3>
                  <div className="flex gap-2">
                    {getNextFlowStep() && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => {
                          const nextStep = getNextFlowStep()!;
                          const [method, path] = nextStep.split(':');
                          setSelectedEndpointKey(nextStep);
                          setSelectedEndpoint(path);
                          setRequestMethod(method as any);
                          setSelectedSubEndpoint(nextStep);
                          setRequestBody(getExampleRequestBody(path, method));
                        }}
                        className="text-xs bg-primary hover:bg-primary/90"
                      >
                        Next: {getNextFlowStep()?.split(':')[1]}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => {
                        // Clear all flow data and generate fresh PKCE codes
                        setAuthFlowData({});
                        setAuthToken(null);
                        const { codeVerifier, codeChallenge } = await generatePKCE();
                        setAuthFlowData({
                          code_verifier: codeVerifier,
                          code_challenge: codeChallenge
                        });
                        // Reset to first step
                        setSelectedEndpointKey('POST:/oauth2/register');
                        setSelectedEndpoint('/oauth2/register');
                        setRequestMethod('POST');
                        setSelectedSubEndpoint('POST:/oauth2/register');
                        setRequestBody(getExampleRequestBody('/oauth2/register', 'POST'));
                        toast.success('Flow reset with fresh PKCE codes!');
                      }}
                      className="text-xs"
                    >
                      Reset Flow
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <button 
                    className={`p-2 rounded border text-left hover:opacity-80 transition-opacity ${authFlowData.client_id ? 'bg-primary/10 border-primary/20' : (getNextFlowStep() === 'POST:/oauth2/register' ? 'bg-accent border-accent-foreground/20' : 'bg-muted border-muted-foreground/20')}`}
                    onClick={() => handleProgressClick('/oauth2/register', 'POST')}
                  >
                    <div className="font-medium">Client Registration</div>
                    <div className="text-muted-foreground">
                      {authFlowData.client_id ? `✅ ${authFlowData.client_id.substring(0, 8)}...` : (getNextFlowStep() === 'POST:/oauth2/register' ? '🎯 Next Step' : '⏳ Pending')}
                    </div>
                  </button>
                  
                  <button 
                    className={`p-2 rounded border text-left hover:opacity-80 transition-opacity ${authFlowData.authorization_code ? 'bg-primary/10 border-primary/20' : (getNextFlowStep() === 'GET:/oauth2/authorize' ? 'bg-accent border-accent-foreground/20' : 'bg-muted border-muted-foreground/20')} ${!authFlowData.client_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (!authFlowData.client_id) return;
                      handleProgressClick('/oauth2/authorize', 'GET', true);
                    }}
                    disabled={!authFlowData.client_id}
                  >
                    <div className="font-medium">Authorization</div>
                    <div className="text-muted-foreground">
                      {authFlowData.authorization_code ? `✅ ${authFlowData.authorization_code.substring(0, 8)}...` : (getNextFlowStep() === 'GET:/oauth2/authorize' ? '🎯 Next Step' : '⏳ Pending')}
                    </div>
                  </button>
                  
                  <button 
                    className={`p-2 rounded border text-left hover:opacity-80 transition-opacity ${authFlowData.access_token ? 'bg-primary/10 border-primary/20' : (getNextFlowStep() === 'POST:/oauth2/token' ? 'bg-accent border-accent-foreground/20' : 'bg-muted border-muted-foreground/20')} ${!authFlowData.authorization_code ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (!authFlowData.authorization_code) return;
                      handleProgressClick('/oauth2/token', 'POST');
                    }}
                    disabled={!authFlowData.authorization_code}
                  >
                    <div className="font-medium">Access Token</div>
                    <div className="text-muted-foreground">
                      {authFlowData.access_token ? `✅ ${authFlowData.access_token.substring(0, 8)}...` : (getNextFlowStep() === 'POST:/oauth2/token' ? '🎯 Next Step' : '⏳ Pending')}
                    </div>
                  </button>
                  
                  <button 
                    className={`p-2 rounded border text-left hover:opacity-80 transition-opacity ${authFlowData.wallet_challenge ? 'bg-primary/10 border-primary/20' : 'bg-muted border-muted-foreground/20'}`}
                    onClick={() => handleProgressClick('/api/auth/challenge', 'POST')}
                  >
                    <div className="font-medium">Wallet Auth</div>
                    <div className="text-muted-foreground">
                      {authFlowData.wallet_challenge ? `✅ Challenge Ready` : '⏳ No Challenge'}
                    </div>
                  </button>
                </div>

                {/* Manual Auth Code Entry */}
                {authFlowData.client_id && (
                  <div className="mt-3 p-3 bg-accent/20 rounded border border-accent-foreground/20">
                    <div className="text-sm font-medium text-foreground mb-2">
                      📝 Authorization Code {authFlowData.authorization_code ? 'Update' : 'Entry'}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {!authFlowData.authorization_code 
                        ? "Got an authorization code from the browser redirect? Enter it here:"
                        : "Current auth code detected. Update it here if needed:"
                      }
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter authorization code..."
                        value={authFlowData.authorization_code || ''}
                        onChange={(e) => {
                          setAuthFlowData(prev => ({ ...prev, authorization_code: e.target.value }));
                        }}
                        className="text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const code = (e.target as HTMLInputElement).value;
                            if (code) {
                              setAuthFlowData(prev => ({ ...prev, authorization_code: code }));
                              setSelectedEndpointKey('POST:/oauth2/token');
                              setSelectedEndpoint('/oauth2/token');
                              setRequestMethod('POST');
                              setSelectedSubEndpoint('POST:/oauth2/token');
                              toast.success('Authorization code saved! Ready to get access token.');
                            }
                          }
                        }}
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          if (authFlowData.authorization_code) {
                            setSelectedEndpointKey('POST:/oauth2/token');
                            setSelectedEndpoint('/oauth2/token');
                            setRequestMethod('POST');
                            setSelectedSubEndpoint('POST:/oauth2/token');
                            toast.success('Ready to get access token!');
                          }
                        }}
                        className="text-xs"
                      >
                        {authFlowData.authorization_code ? 'Update & Continue' : 'Save & Continue'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Troubleshooting for invalid_grant error */}
                {responseData && responseData.data?.error === 'invalid_grant' && (
                  <div className="mt-3 p-3 bg-destructive/10 rounded border border-destructive/20">
                    <div className="text-sm font-medium text-destructive mb-2">
                      🔧 Troubleshooting: Invalid Grant Error
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>This error usually means PKCE codes don't match or the authorization code expired.</div>
                      <div className="font-medium">Try these solutions:</div>
                      <div>1. Click "Reset Flow" above to generate fresh PKCE codes</div>
                      <div>2. Complete the entire flow within 10 minutes</div>
                      <div>3. Make sure you're using the same browser session</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* API Testing Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Panel - Request Configuration */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Request Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Endpoint Selection */}
                  <div className="space-y-2">
                    <Label>Endpoint</Label>
                    <Select value={selectedEndpointKey} onValueChange={(value) => {
                      setSelectedEndpointKey(value);
                      const [method, path] = value.split(':');
                      setSelectedEndpoint(path);
                      setRequestMethod(method as any);
                      setRequestBody(getExampleRequestBody(path, method));
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an endpoint" />
                      </SelectTrigger>
                      <SelectContent>
                        {['System', 'Auth', 'OB Standard', 'Extended'].map(category => (
                          <div key={category}>
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">{category}</div>
                            {apiEndpoints
                              .filter(ep => ep.category === category)
                              .map(endpoint => (
                                <SelectItem key={`${endpoint.method}-${endpoint.path}`} value={`${endpoint.method}:${endpoint.path}`}>
                                  <div className="flex items-center gap-2 w-full">
                                    <Badge 
                                      variant={endpoint.method === 'GET' ? 'default' : 
                                              endpoint.method === 'POST' ? 'secondary' : 
                                              endpoint.method === 'PUT' ? 'outline' : 'destructive'} 
                                      className="text-xs min-w-12 justify-center"
                                    >
                                      {endpoint.method}
                                    </Badge>
                                    <div className="flex flex-col">
                                      <span className="font-mono text-xs">{endpoint.path}</span>
                                      <span className="text-xs text-muted-foreground truncate max-w-64">{endpoint.description}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            }
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Method and URL Display */}
                  <div className="flex gap-2">
                    <div className="space-y-2 flex-none">
                      <Label>Method</Label>
                      <Select value={requestMethod} onValueChange={(value: any) => setRequestMethod(value)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label>URL</Label>
                      <Input 
                        value={(() => {
                          let url = `${apiBaseUrl}${selectedEndpoint}`;
                          if (requestMethod === 'GET' && requestBody) {
                            try {
                              const params = JSON.parse(requestBody);
                              const urlParams = new URLSearchParams();
                              Object.entries(params).forEach(([key, value]) => {
                                if (value !== null && value !== undefined) {
                                  urlParams.append(key, String(value));
                                }
                              });
                              if (urlParams.toString()) {
                                url += `?${urlParams.toString()}`;
                              }
                            } catch (error) {
                              // Invalid JSON, just show base URL
                            }
                          }
                          return url;
                        })()} 
                        readOnly 
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Headers */}
                  <div className="space-y-2">
                    <Label>Headers (JSON)</Label>
                    <Textarea
                      value={requestHeaders}
                      onChange={(e) => setRequestHeaders(e.target.value)}
                      placeholder='{"Content-Type": "application/json"}'
                      rows={3}
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* Auth Token */}
                  <div className="space-y-2">
                    <Label>Auth Token (Optional)</Label>
                    <Input
                      type="password"
                      value={authToken || ''}
                      onChange={(e) => setAuthToken(e.target.value || null)}
                      placeholder="JWT token for authenticated requests"
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* Request Body */}
                  <div className="space-y-2">
                    <Label>
                      {requestMethod === 'GET' ? 'Query Parameters (JSON)' : 'Request Body (JSON)'}
                    </Label>
                    {requestMethod === 'GET' && (
                      <div className="text-xs text-muted-foreground mb-2">
                        💡 For GET requests, these parameters will be added to the URL as query string
                      </div>
                    )}
                    <Textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder="{}"
                      rows={6}
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* OAuth Authorization Helper */}
                  {selectedEndpoint === '/oauth2/authorize' && requestMethod === 'GET' && (
                    <div className="p-3 bg-secondary/20 rounded border border-border mb-4">
                      <div className="text-sm font-medium text-foreground mb-2">
                        📋 OAuth Authorization URL Helper
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        For OAuth authorization, you typically open this URL in a browser. The redirect will contain your authorization code.
                      </div>
                      <div className="text-xs text-accent-foreground mb-3 p-2 bg-accent/30 rounded">
                        💡 <strong>Tip:</strong> The redirect URL will be something like:<br/>
                        <code className="text-xs">http://localhost:5173/oauth/callback?code=AUTH_CODE_HERE&state=...</code><br/>
                        Copy the <code>code</code> parameter value and paste it in the manual entry field below.
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            try {
                              const params = JSON.parse(requestBody || '{}');
                              const urlParams = new URLSearchParams();
                              Object.entries(params).forEach(([key, value]) => {
                                if (value !== null && value !== undefined) {
                                  urlParams.append(key, String(value));
                                }
                              });
                              const authUrl = `${apiBaseUrl}${selectedEndpoint}?${urlParams.toString()}`;
                              navigator.clipboard.writeText(authUrl);
                              toast.success('Authorization URL copied to clipboard!');
                            } catch (error) {
                              toast.error('Invalid JSON in request body');
                            }
                          }}
                          className="text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Auth URL
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            try {
                              const params = JSON.parse(requestBody || '{}');
                              const urlParams = new URLSearchParams();
                              Object.entries(params).forEach(([key, value]) => {
                                if (value !== null && value !== undefined) {
                                  urlParams.append(key, String(value));
                                }
                              });
                              const authUrl = `${apiBaseUrl}${selectedEndpoint}?${urlParams.toString()}`;
                              window.open(authUrl, '_blank');
                            } catch (error) {
                              toast.error('Invalid JSON in request body');
                            }
                          }}
                          className="text-xs"
                        >
                          🔗 Open in Browser
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Execute Button - Hidden for OAuth authorize endpoint */}
                  {!(selectedEndpoint === '/oauth2/authorize' && requestMethod === 'GET') && (
                    <Button 
                      onClick={executeApiRequest} 
                      disabled={isLoading || apiStatus !== 'online'}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Execute Request
                        </>
                      )}
                    </Button>
                  )}

                  {/* OAuth Authorization Message */}
                  {selectedEndpoint === '/oauth2/authorize' && requestMethod === 'GET' && (
                    <div className="p-3 bg-secondary/20 rounded border text-center">
                      <div className="text-sm font-medium text-foreground mb-2">
                        🔗 Use the buttons above to open this URL in your browser
                      </div>
                      <div className="text-xs text-muted-foreground">
                        OAuth authorization requires browser interaction
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Panel - Response */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {responseData ? (
                        responseData.error ? (
                          <XCircle className="w-5 h-5 text-destructive" />
                        ) : responseData.status >= 200 && responseData.status < 300 ? (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground" />
                        )
                      ) : (
                        <div className="w-5 h-5 rounded border-2 border-muted" />
                      )}
                      Response
                    </div>
                    {responseData && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
                          toast.success('Response copied to clipboard');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {responseData ? (
                    <div className="space-y-4">
                      {/* Response Status */}
                      {responseData.status && (
                        <div className="flex items-center gap-4 p-2 bg-muted rounded">
                          <Badge variant={responseData.status >= 200 && responseData.status < 300 ? 'default' : 'destructive'}>
                            {responseData.status} {responseData.statusText}
                          </Badge>
                          {responseData.responseTime && (
                            <span className="text-xs text-muted-foreground">
                              {responseData.responseTime}ms
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {responseData.timestamp}
                          </span>
                        </div>
                      )}
                      
                      {/* Response Body */}
                      <div className="relative">
                        <SyntaxHighlighter 
                          language="json" 
                          style={oneDark} 
                          customStyle={{ 
                            margin: 0, 
                            borderRadius: '0.5rem',
                            fontSize: '12px',
                            maxHeight: '400px',
                            overflow: 'auto'
                          }}
                        >
                          {JSON.stringify(responseData.error ? { error: responseData.error } : responseData.data || responseData, null, 2)}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-muted flex items-center justify-center">
                        <Play className="w-6 h-6" />
                      </div>
                      <p>Execute a request to see the response</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Examples */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>💡 Quick Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Health Check', endpoint: '/health', method: 'GET', description: 'Check if API is running', badge: 'System' },
                    { name: 'Service Discovery', endpoint: '/ims/ob/v3p0/discovery', method: 'GET', description: 'OB v3.0 service info', badge: 'OB Spec' },
                    { name: 'Get Credentials', endpoint: '/ims/ob/v3p0/credentials', method: 'GET', description: 'List OpenBadgeCredentials', badge: 'OB Spec' },
                    { name: 'Issue Credential', endpoint: '/ims/ob/v3p0/credentials', method: 'POST', description: 'Create AchievementCredential', badge: 'OB Spec' },
                    { name: 'Get Profile', endpoint: '/ims/ob/v3p0/profile', method: 'GET', description: 'Get issuer profile', badge: 'OB Spec' },
                    { name: 'Auth Challenge', endpoint: '/api/auth/challenge', method: 'POST', description: 'Get wallet auth challenge', badge: 'Auth' },
                    { name: 'Create Achievement', endpoint: '/ims/ob/ext/achievements', method: 'POST', description: 'Define new achievement', badge: 'Extended' },
                    { name: 'Verify Credential', endpoint: '/ims/ob/ext/verify/credential', method: 'POST', description: 'Validate credential format', badge: 'Extended' },
                    { name: 'Resolve DID', endpoint: '/ims/ob/ext/did/resolve/did:example:123', method: 'GET', description: 'Get DID document', badge: 'Extended' },
                  ].map((example) => (
                    <Button
                      key={`${example.method}-${example.endpoint}`}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start text-left space-y-2 hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedEndpoint(example.endpoint);
                        setRequestMethod(example.method as any);
                      }}
                    >
                      <div className="flex items-center gap-2 w-full justify-between">
                        <Badge 
                          variant={example.method === 'GET' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {example.method}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                        >
                          {example.badge}
                        </Badge>
                      </div>
                      <span className="font-medium text-sm">{example.name}</span>
                      <p className="text-xs text-muted-foreground leading-relaxed">{example.description}</p>
                      <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">{example.endpoint}</code>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Right Panel - Only show in docs mode */}
      {viewMode === 'docs' && (
        <div className="flex-none w-2/5 pt-6 bg-background sticky top-0 h-full overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>
                <Badge variant="secondary" className="mr-2">{selectedIndex + 1}</Badge>
                {selectedInstruction.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 prose prose-sm dark:prose-invert">
              <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)} className="w-full">
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="anchor">Anchor</TabsTrigger>
                    <TabsTrigger value="web3js">Web3.js</TabsTrigger>
                    <TabsTrigger value="jsonRpc">JSON-RPC</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="test">Test</TabsTrigger>
                  </TabsList>
                  {selectedTab !== 'test' && (
                    <Button size="sm" variant="ghost" onClick={() => {
                      const codeToCopy = selectedTab === 'anchor' ? anchorExample : selectedTab === 'web3js' ? web3jsExample : selectedTab === 'jsonRpc' ? jsonRpcExample : curlExample;
                      const label = selectedTab === 'anchor' ? 'Anchor code copied' : selectedTab === 'web3js' ? 'Web3.js code copied' : selectedTab === 'jsonRpc' ? 'JSON-RPC code copied' : 'cURL code copied';
                      navigator.clipboard.writeText(codeToCopy);
                      toast.success(label);
                    }}>
                      <Copy size={16} />
                    </Button>
                  )}
                </div>
                <TabsContent value="anchor">
                  <div className="relative overflow-x-auto mb-6 rounded-md">
                    <SyntaxHighlighter language="typescript" style={oneDark} wrapLongLines customStyle={{ margin: 0, padding: '1rem', borderRadius: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '60ch' }}>
                      {anchorExample}
                    </SyntaxHighlighter>
                  </div>
                </TabsContent>
                <TabsContent value="web3js">
                  <div className="relative overflow-x-auto mb-6 rounded-md">
                    <SyntaxHighlighter language="javascript" style={oneDark} wrapLongLines customStyle={{ margin: 0, padding: '1rem', borderRadius: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '60ch' }}>
                      {web3jsExample}
                    </SyntaxHighlighter>
                  </div>
                </TabsContent>
                <TabsContent value="jsonRpc">
                  <div className="relative overflow-x-auto mb-6 rounded-md">
                    <SyntaxHighlighter language="javascript" style={oneDark} wrapLongLines customStyle={{ margin: 0, padding: '1rem', borderRadius: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '60ch' }}>
                      {jsonRpcExample}
                    </SyntaxHighlighter>
                  </div>
                </TabsContent>
                <TabsContent value="curl">
                  <div className="relative overflow-x-auto mb-6 rounded-md">
                    <SyntaxHighlighter language="javascript" style={oneDark} wrapLongLines customStyle={{ margin: 0, padding: '1rem', borderRadius: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '60ch' }}>
                      {curlExample}
                    </SyntaxHighlighter>
                  </div>
                </TabsContent>
                <TabsContent value="test">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {selectedInstruction.args.map((arg: any) => (
                      <div key={arg.name} className="space-y-1">
                        <label htmlFor={arg.name} className="block text-sm font-medium text-muted-foreground">
                          {arg.name} ({renderType(arg.type)})
                        </label>
                        <Input
                          id={arg.name}
                          value={formValues[arg.name] || ''}
                          onChange={(e) => handleInputChange(arg.name, e.target.value)}
                        />
                      </div>
                    ))}
                    {selectedInstruction.accounts.map((account: any) => (
                      <div key={account.name} className="space-y-1">
                        <label htmlFor={account.name} className="block text-sm font-medium text-muted-foreground">
                          {account.name} (Account)
                        </label>
                        <Input
                          id={account.name}
                          value={formValues[account.name] || ''}
                          onChange={(e) => handleInputChange(account.name, e.target.value)}
                        />
                      </div>
                    ))}
                    <Button type="submit" className="w-full">
                      Call {selectedInstruction.name}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Docs;

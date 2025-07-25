import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Clock, Loader2, Zap, Trophy, Award, Shield, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type BlockchainEvent } from '@/hooks/useRealtimeEvents';

// ===================================================================
// REAL-TIME EVENT CARD COMPONENT
// ===================================================================

interface RealtimeEventCardProps {
  event: BlockchainEvent;
  onRemove?: (id: string) => void;
}

const getEventIcon = (type: BlockchainEvent['type']) => {
  switch (type) {
    case 'ISSUER_CREATED':
      return <User className="h-5 w-5" />;
    case 'ACHIEVEMENT_CREATED':
      return <Trophy className="h-5 w-5" />;
    case 'CREDENTIAL_ISSUED':
      return <Award className="h-5 w-5" />;
    case 'CREDENTIAL_VERIFIED':
      return <Shield className="h-5 w-5" />;
    case 'TRANSACTION_STARTED':
      return <Zap className="h-5 w-5" />;
    case 'TRANSACTION_CONFIRMED':
      return <CheckCircle className="h-5 w-5" />;
    case 'TRANSACTION_FAILED':
      return <AlertCircle className="h-5 w-5" />;
    default:
      return <Clock className="h-5 w-5" />;
  }
};

const getEventTitle = (type: BlockchainEvent['type']) => {
  switch (type) {
    case 'ISSUER_CREATED':
      return 'Issuer Profile Created';
    case 'ACHIEVEMENT_CREATED':
      return 'Achievement Created';
    case 'CREDENTIAL_ISSUED':
      return 'Credential Issued';
    case 'CREDENTIAL_VERIFIED':
      return 'Credential Verified';
    case 'TRANSACTION_STARTED':
      return 'Transaction Started';
    case 'TRANSACTION_CONFIRMED':
      return 'Transaction Confirmed';
    case 'TRANSACTION_FAILED':
      return 'Transaction Failed';
    default:
      return 'Blockchain Event';
  }
};

const getStatusColor = (status: BlockchainEvent['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500';
    case 'processing':
      return 'bg-blue-500';
    case 'success':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusIcon = (status: BlockchainEvent['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'processing':
      return <Loader2 className="h-4 w-4 animate-spin" />;
    case 'success':
      return <CheckCircle className="h-4 w-4" />;
    case 'error':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export const RealtimeEventCard: React.FC<RealtimeEventCardProps> = ({ event, onRemove }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const truncateSignature = (signature?: string) => {
    if (!signature) return null;
    return `${signature.slice(0, 8)}...${signature.slice(-8)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      layout
      className="w-full"
    >
      <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Event Icon */}
              <div className={`p-2 rounded-full ${getStatusColor(event.status)} text-white`}>
                {getEventIcon(event.type)}
              </div>
              
              {/* Event Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {getEventTitle(event.type)}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(event.status)}
                      <span className="capitalize">{event.status}</span>
                    </div>
                  </Badge>
                </div>
                
                {event.message && (
                  <p className="text-sm text-gray-600 mb-2">{event.message}</p>
                )}
                
                {/* Progress Bar */}
                {event.status === 'processing' && event.progress !== undefined && (
                  <div className="mb-2">
                    <Progress value={event.progress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">{event.progress}% complete</p>
                  </div>
                )}
                
                {/* Transaction Signature */}
                {event.signature && (
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs text-gray-500">Signature:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                      {truncateSignature(event.signature)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => navigator.clipboard.writeText(event.signature!)}
                    >
                      Copy
                    </Button>
                  </div>
                )}
                
                {/* Timestamp */}
                <p className="text-xs text-gray-500">{formatTime(event.timestamp)}</p>
              </div>
            </div>
            
            {/* Remove Button */}
            {onRemove && (event.status === 'success' || event.status === 'error') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                onClick={() => onRemove(event.id)}
              >
                ×
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ===================================================================
// REAL-TIME EVENTS PANEL
// ===================================================================

interface RealtimeEventsPanelProps {
  events: BlockchainEvent[];
  onRemoveEvent?: (id: string) => void;
  className?: string;
}

export const RealtimeEventsPanel: React.FC<RealtimeEventsPanelProps> = ({ 
  events, 
  onRemoveEvent,
  className = ""
}) => {
  if (events.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No active blockchain events</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence mode="popLayout">
        {events.map((event) => (
          <RealtimeEventCard
            key={event.id}
            event={event}
            onRemove={onRemoveEvent}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// ===================================================================
// FLOATING EVENTS WIDGET
// ===================================================================

interface FloatingEventsWidgetProps {
  events: BlockchainEvent[];
  onRemoveEvent?: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const FloatingEventsWidget: React.FC<FloatingEventsWidgetProps> = ({
  events,
  onRemoveEvent,
  position = 'top-right'
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  if (events.length === 0) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-50 w-96 max-h-96 overflow-y-auto`}>
      <div className="bg-white rounded-lg shadow-lg border p-2">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-sm font-medium text-gray-900 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-blue-500" />
            Live Events
          </h3>
          <Badge variant="secondary" className="text-xs">
            {events.length}
          </Badge>
        </div>
        <RealtimeEventsPanel events={events} onRemoveEvent={onRemoveEvent} />
      </div>
    </div>
  );
};

// ===================================================================
// CONNECTION STATUS INDICATOR
// ===================================================================

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'reconnecting';
  isListening: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  isListening,
  className = ""
}) => {
  const getStatusColor = () => {
    if (!isListening) return 'bg-gray-500';
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'reconnecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (!isListening) return 'Not listening';
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}>
        {status === 'reconnecting' && (
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        )}
      </div>
      <span className="text-xs text-gray-600">{getStatusText()}</span>
    </div>
  );
};

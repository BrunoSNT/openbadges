import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  User, 
  Trophy, 
  Award, 
  Shield, 
  Zap, 
  Clock,
  CheckCircle,
  Eye,
  MousePointer,
  Sparkles,
  Search
} from 'lucide-react';

export function RealtimeNavigationShowcase() {
  const location = useLocation();

  const enhancedPages = [
    {
      path: '/issuer',
      title: 'Enhanced Issuer Profile',
      description: 'Create issuer profiles with real-time blockchain events',
      icon: User,
      color: 'bg-blue-500',
      features: ['Live transaction tracking', 'Profile creation events', 'Real-time status updates']
    },
    {
      path: '/enhanced-achievements',
      title: 'Enhanced Achievements',
      description: 'Manage achievements with live event tracking',
      icon: Trophy,
      color: 'bg-yellow-500',
      features: ['Achievement creation events', 'Progress tracking', 'Live statistics']
    },
    {
      path: '/enhanced-badges',
      title: 'Enhanced Credentials',
      description: 'Issue and manage credentials with real-time feedback',
      icon: Award,
      color: 'bg-green-500',
      features: ['Credential issuance tracking', 'Live verification', 'Event history']
    },
    {
      title: 'Validation Explorer',
      path: '/validation-explorer',
      description: 'Advanced proof verification with step-by-step analysis',
      icon: Search,
      color: 'bg-indigo-500',
      features: ['Cryptographic proof analysis', 'Step-by-step verification', 'Interactive validation']
    },
    {
      title: 'Enhanced Validation',
      path: '/enhanced-validation',
      description: 'Validate credentials with live blockchain verification',
      icon: Shield,
      color: 'bg-purple-500',
      features: ['Real-time validation', 'Proof verification', 'Live results']
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold flex items-center justify-center space-x-3">
          <Sparkles className="h-8 w-8 text-yellow-500" />
          <span>Real-time Open Badges Experience</span>
          <Sparkles className="h-8 w-8 text-yellow-500" />
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Experience the future of Open Badges with real-time blockchain events, 
          live transaction tracking, and beautiful interactive interfaces.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            <span>Live Events</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-blue-500" />
            <span>Real-time Updates</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Blockchain Verified</span>
          </Badge>
        </div>
      </motion.div>

      {/* Features Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { icon: Eye, label: 'Live Monitoring', desc: 'Real-time event tracking' },
          { icon: Zap, label: 'Instant Updates', desc: 'Immediate feedback' },
          { icon: MousePointer, label: 'Interactive UI', desc: 'Beautiful animations' },
          { icon: Shield, label: 'Blockchain Proof', desc: 'Cryptographic verification' }
        ].map((feature, index) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card className="text-center">
              <CardContent className="p-4">
                <feature.icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">{feature.label}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Enhanced Pages Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {enhancedPages.map((page, index) => (
          <motion.div
            key={page.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className={`h-full border-l-4 ${page.path === location.pathname ? 'border-l-blue-500 bg-blue-50' : 'border-l-gray-200'} hover:shadow-lg transition-all duration-200`}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${page.color} text-white`}>
                    <page.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                    <CardDescription>{page.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Real-time Features:</h4>
                  <ul className="space-y-1">
                    {page.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2 text-sm">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-2">
                  <Button asChild className="w-full">
                    <Link to={page.path}>
                      <Eye className="h-4 w-4 mr-2" />
                      Experience Live Demo
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center space-y-4 py-8"
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Experience the Future of Open Badges</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Each enhanced page demonstrates real-time blockchain interaction with beautiful UI feedback.
              Watch transactions happen live, see proof creation in real-time, and experience the next generation of credential management.
            </p>
            <div className="flex justify-center space-x-4">
              <Button asChild size="lg">
                <Link to="/issuer">
                  <User className="h-5 w-5 mr-2" />
                  Start with Issuer Profile
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/enhanced-validation">
                  <Shield className="h-5 w-5 mr-2" />
                  Try Live Validation
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

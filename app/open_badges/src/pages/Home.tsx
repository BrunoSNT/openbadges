import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, Globe, Users2, Award, Sparkles } from 'lucide-react';
import { useI18nContext } from '@/contexts/I18nContext';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { BadgeCheck } from 'lucide-react';
import { Users } from 'lucide-react';

export const Home: React.FC = () => {
  const { t } = useI18nContext();
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Your badges are secured on the Solana blockchain, ensuring immutable verification"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Issue and verify badges instantly with Solana's high-performance blockchain"
    },
    {
      icon: Globe,
      title: "Globally Recognized",
      description: "Open Badges v3.0 compliant credentials recognized worldwide"
    },
    {
      icon: Users2,
      title: "Community Driven",
      description: "Build and manage credential ecosystems for your organization"
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <div className="text-center space-y-8 mb-20">
        <div className="flex justify-center">
          <Badge variant="outline" className="text-sm font-medium px-4 py-2 ">
            <Sparkles className="mr-2 h-4 w-4" />
            {t('home.badge')}
          </Badge>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            {t('home.title')}
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground leading-relaxed">
            {t('home.subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="group px-8 py-3" onClick={() => navigate('/badges')}>
            Get Started
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button variant="outline" size="lg" className="px-8 py-3" onClick={() => navigate('/docs')}>
            Learn More
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="transition-all hover:shadow-xl hover:scale-105 border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{t('dashboard.cards.createBadge.title')}</CardTitle>
                  <CardDescription className="text-sm">{t('dashboard.cards.createBadge.description')}</CardDescription>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardFooter>
              <Button 
                variant="ghost"
                className="w-full group justify-between px-0 py-2 h-auto hover:bg-blue-500/10"
                onClick={() => navigate('/badges')}
              >
                {t('dashboard.cards.createBadge.button')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="transition-all hover:shadow-xl hover:scale-105 border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{t('dashboard.cards.manageUsers.title')}</CardTitle>
                  <CardDescription className="text-sm">{t('dashboard.cards.manageUsers.description')}</CardDescription>
                </div>
                <div className="rounded-lg bg-green-500/10 p-3">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardHeader>
            <CardFooter>
              <Button 
                variant="ghost"
                className="w-full group justify-between px-0 py-2 h-auto hover:bg-green-500/10"
                onClick={() => navigate('/profile-management')}
              >
                {t('dashboard.cards.manageUsers.button')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="transition-all hover:shadow-xl hover:scale-105 border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{t('dashboard.cards.verifyCredentials.title')}</CardTitle>
                  <CardDescription className="text-sm">{t('dashboard.cards.verifyCredentials.description')}</CardDescription>
                </div>
                <div className="rounded-lg bg-purple-500/10 p-3">
                  <BadgeCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardHeader>
            <CardFooter>
              <Button 
                variant="ghost"
                className="w-full group justify-between px-0 py-2 h-auto hover:bg-purple-500/10"
                onClick={() => navigate('/validate')}
              >
                {t('dashboard.cards.verifyCredentials.button')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardFooter>
          </Card>
        </div>
    </>
  );
};

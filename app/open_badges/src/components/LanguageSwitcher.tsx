import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useI18nContext } from '@/contexts/I18nContext';
import { Check, Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'pt-BR', name: 'Português' },
] as const;

export function LanguageSwitcher() {
  const { locale, changeLocale } = useI18nContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLocale(lang.code)}
            className="flex items-center justify-between"
          >
            <span>{lang.name}</span>
            {locale === lang.code && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
